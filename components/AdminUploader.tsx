'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CareerTree, CareerNode } from '@/lib/types';
import type { TreeMetadata } from '@/lib/types';
import { parseTreeFile, ParseError } from '@/lib/parseTreeFile';
import { buildTreeId } from '@/lib/treeUtils';
import { Play, Save, AlertCircle, ArrowLeft, Bot } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import OrientationToggle from '@/components/OrientationToggle';
import InfoPanel from '@/components/InfoPanel';
import { COUNTRIES, degreesForLevel, streamsForDegree, formatLevelLabel } from '@/lib/treeConfig';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const TreeViewer = dynamic(() => import('@/components/TreeViewer'), { ssr: false });

const SPLIT_STORAGE_KEY = 'careertree_admin_split_pct';
const SPLIT_MIN = 22;
const SPLIT_MAX = 78;

const OTHER = '__other__';

const LEVEL_OPTIONS = ['school', 'undergraduate', 'masters'] as const;

const DUPLICATE_TREE_MSG =
  'A tree already exists for this level, country, degree, and stream. Change one of the attributes or edit the existing tree.';

/** Same rules as save: composite id or matching level/degree/stream/country. */
function duplicateExists(
  meta: TreeMetadata[],
  level: string,
  degree: string,
  stream: string | null,
  country: string
): boolean {
  const streamNorm = stream?.trim() ? stream.trim() : null;
  const computedId = buildTreeId(level, degree, streamNorm, country);
  return meta.some(
    (m) =>
      m.id === computedId ||
      (m.level === level &&
        m.degree === degree &&
        m.country === country &&
        (m.stream ?? null) === streamNorm)
  );
}

function SelectOrOtherField({
  label,
  options,
  value,
  onSelect,
  otherText,
  onOtherText,
  resetListValue,
  placeholder,
  disabledSelect,
  formatOption,
}: {
  label: string;
  options: string[];
  value: string;
  onSelect: (v: string) => void;
  otherText: string;
  onOtherText: (v: string) => void;
  /** Value to apply when leaving “Other…” via “Choose from list” */
  resetListValue: string;
  placeholder: string;
  disabledSelect?: boolean;
  /** Optional label transform for list options (values unchanged). */
  formatOption?: (option: string) => string;
}) {
  const isOther = value === OTHER;
  if (isOther) {
    return (
      <div style={{ flex: 1, minWidth: '120px' }}>
        <label
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--color-ink-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'block',
            marginBottom: '6px',
          }}
        >
          {label}
        </label>
        <input
          type="text"
          className="ct-input"
          value={otherText}
          onChange={(e) => onOtherText(e.target.value)}
          placeholder={`Type ${label.toLowerCase()}…`}
          style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '6px', width: '100%' }}
        />
        <button
          type="button"
          className="btn-ghost"
          style={{ fontSize: '11px', marginTop: 6, padding: '2px 0' }}
          onClick={() => onSelect(resetListValue)}
        >
          Choose from list
        </button>
      </div>
    );
  }
  return (
    <div style={{ flex: 1, minWidth: '120px' }}>
      <label
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--color-ink-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          display: 'block',
          marginBottom: '6px',
        }}
      >
        {label}
      </label>
      <select
        className="ct-input"
        style={{
          padding: '6px 10px',
          fontSize: '13px',
          borderRadius: '6px',
          width: '100%',
          color: value === '' ? 'var(--color-ink-muted)' : 'inherit',
        }}
        value={value}
        disabled={disabledSelect}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {formatOption ? formatOption(o) : o}
          </option>
        ))}
        <option value={OTHER}>Other…</option>
      </select>
    </div>
  );
}

interface AdminUploaderProps {
  initialText?: string;
  isEdit?: boolean;
  originalTreeId?: string;
}

export default function AdminUploader({
  initialText = '',
  isEdit = false,
  originalTreeId,
}: AdminUploaderProps) {
  const router = useRouter();
  const [text, setText] = useState(initialText);
  const [previewTree, setPreviewTree] = useState<CareerTree | null>(null);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [saving, setSaving] = useState(false);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [notice, setNotice] = useState<{ text: string; tone: 'info' | 'error' } | null>(null);

  const [selectedNode, setSelectedNode] = useState<CareerNode | null>(null);
  const [splitPct, setSplitPct] = useState(50);
  const [isDesktopSplit, setIsDesktopSplit] = useState(true);
  const [previewSize, setPreviewSize] = useState({ w: 600, h: 500 });
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const previewPaneRef = useRef<HTMLDivElement>(null);
  const mobilePreviewCanvasRef = useRef<HTMLDivElement>(null);
  const draggingSplit = useRef(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const expandThenPanel = useMediaQuery('(max-width: 1023px)');

  const [level, setLevel] = useState('');
  const [country, setCountry] = useState('');
  const [degree, setDegree] = useState('');
  const [stream, setStream] = useState('');

  const [customLevel, setCustomLevel] = useState('');
  const [customCountry, setCustomCountry] = useState('');
  const [customDegree, setCustomDegree] = useState('');
  const [customStream, setCustomStream] = useState('');

  const finalLevel = level === OTHER ? customLevel.trim() : level.trim();
  const finalCountry = country === OTHER ? customCountry.trim() : country.trim();
  const finalDegree = degree === OTHER ? customDegree.trim() : degree.trim();
  const finalStream = stream === OTHER ? customStream.trim() : stream.trim();

  /** New trees: block source editing until metadata is set (edit mode always allowed). */
  const metaComplete = useMemo(
    () =>
      isEdit ||
      Boolean(
        finalLevel &&
          finalCountry &&
          finalDegree &&
          finalStream
      ),
    [isEdit, finalLevel, finalCountry, finalDegree, finalStream]
  );

  const degreeOptions = useMemo(() => {
    if (!level) return [];
    if (level === OTHER && !customLevel.trim()) return [];
    const key = level === OTHER ? customLevel.trim() : level;
    return degreesForLevel(key || 'undergraduate');
  }, [level, customLevel]);

  useEffect(() => {
    if (!level || (level === OTHER && !customLevel.trim())) {
      setDegree('');
      return;
    }
    if (degreeOptions.length === 0) {
      setDegree('');
      return;
    }
    setDegree((prev) => {
      if (prev === OTHER) return prev;
      if (prev && degreeOptions.includes(prev)) return prev;
      return '';
    });
  }, [degreeOptions, level, customLevel]);

  const streamOptions = useMemo(() => streamsForDegree(finalDegree), [finalDegree]);

  useEffect(() => {
    if (!finalDegree) {
      setStream('');
      setCustomStream('');
      return;
    }
    const options = streamOptions;
    setStream((prev) => {
      if (prev === OTHER) return prev;
      if (prev && options.includes(prev)) return prev;
      return '';
    });
  }, [finalDegree, streamOptions]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SPLIT_STORAGE_KEY);
      if (raw == null) return;
      const n = Number(raw);
      if (Number.isFinite(n) && n >= SPLIT_MIN && n <= SPLIT_MAX) setSplitPct(n);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => setIsDesktopSplit(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    setSelectedNode(null);
  }, [previewTree?.root.id]);

  useEffect(() => {
    if (isDesktopSplit) setMobilePreviewOpen(false);
  }, [isDesktopSplit]);

  useEffect(() => {
    if (!previewTree) return;
    const el =
      !isDesktopSplit && mobilePreviewOpen
        ? mobilePreviewCanvasRef.current
        : previewPaneRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setPreviewSize({
        w: Math.max(240, Math.floor(cr.width)),
        h: Math.max(200, Math.floor(cr.height)),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [previewTree, isDesktopSplit, mobilePreviewOpen]);

  const persistSplitPct = useCallback((pct: number) => {
    const clamped = Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, Math.round(pct)));
    setSplitPct(clamped);
    try {
      localStorage.setItem(SPLIT_STORAGE_KEY, String(clamped));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const move = (clientX: number, clientY: number) => {
      if (!draggingSplit.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      if (isDesktopSplit) {
        const x = clientX - rect.left;
        persistSplitPct((x / rect.width) * 100);
      } else {
        const y = clientY - rect.top;
        persistSplitPct((y / rect.height) * 100);
      }
    };
    const onMouseMove = (e: MouseEvent) => move(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (!draggingSplit.current) return;
      e.preventDefault();
      if (e.touches[0]) move(e.touches[0].clientX, e.touches[0].clientY);
    };
    const end = () => {
      draggingSplit.current = false;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', end);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', end);
    };
  }, [isDesktopSplit, persistSplitPct]);

  const handleSplitPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    draggingSplit.current = true;
  }, []);

  useEffect(() => {
    if (isEdit) return;
    if (!finalLevel || !finalCountry || !finalDegree || !finalStream) {
      setNotice((n) => (n?.text === DUPLICATE_TREE_MSG ? null : n));
      return;
    }

    const ac = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch('/api/trees', { signal: ac.signal });
        if (!res.ok) return;
        const meta = (await res.json()) as TreeMetadata[];
        if (duplicateExists(meta, finalLevel, finalDegree, finalStream, finalCountry)) {
          setNotice({ text: DUPLICATE_TREE_MSG, tone: 'error' });
        } else {
          setNotice((prev) => (prev?.text === DUPLICATE_TREE_MSG ? null : prev));
        }
      } catch {
        /* aborted or network */
      }
    }, 380);

    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [finalLevel, finalCountry, finalDegree, finalStream, isEdit]);

  const clearFeedback = useCallback(() => {
    setNotice(null);
    setErrors([]);
  }, []);

  const showNotice = (text: string, tone: 'info' | 'error' = 'info') => {
    setNotice({ text, tone });
  };

  const handleGeneratePrompt = () => {
    if (!finalLevel || !finalCountry || !finalDegree || !finalStream) {
      showNotice('Fill level, country, degree, and stream before generating.', 'error');
      return;
    }

    const template = `=== LLM PROMPT (Copy/paste the text below into ChatGPT/Claude to generate a new tree) ===

Please act as an expert career counselor. Generate a comprehensive, deep, and highly detailed career path tree for a ${finalDegree} in ${finalStream} for students in ${finalCountry} at the ${formatLevelLabel(finalLevel)} level.

You MUST output your response strictly in the following custom plain-text format, with no markdown code blocks wrapping it. 
Strictly use exactly 2 spaces for each level of indentation.
Use the exact keywords: TREE:, CATEGORY:, PATH:, SPEC:, SUB:, DESC:, SKILLS:, SALARY:, ROADMAP:

Format Rules:
1. The first line must be the TREE header in exactly this format: TREE: ${finalDegree} - ${finalStream} | ${finalCountry} | ${formatLevelLabel(finalLevel)}
2. The hierarchy is: CATEGORY -> PATH -> SPEC -> SUB.
3. **CRITICAL**: EVERY SINGLE NODE (CATEGORY, PATH, SPEC, SUB) MUST have a detailed DESC (Description) under it.
4. **CRITICAL**: EVERY SINGLE PATH, SPEC, and SUB MUST also have SKILLS, SALARY, and ROADMAP attributes filled with highly realistic, role-specific data. Do not skip these attributes for any child nodes!
5. Metadata (DESC, SKILLS, SALARY, ROADMAP) must be indented 2 spaces further than their parent node.
6. Add an empty line between different categories/paths for readability.

Example structure:
TREE: ${finalDegree} - ${finalStream} | ${finalCountry} | ${formatLevelLabel(finalLevel)}

CATEGORY: Core Domain
  DESC: Writing, testing, and maintaining core systems and applications.

  PATH: Domain Specialist
    DESC: Building highly interactive experiences and robust logic.
    SKILLS: Core Skill 1, Core Skill 2, Essential Tooling
    SALARY: 10L - 25L / yr
    ROADMAP: Learn basics deeply -> Master a framework -> Build a complex portfolio -> Apply for jobs

    SPEC: Sub-Specialist
      DESC: Focusing on advanced niche applications directly within the field.
      SKILLS: Niche Skill 1, Niche Skill 2, Advanced Math
      SALARY: 15L - 35L / yr
      ROADMAP: Learn advanced concepts -> Master niche tools -> Build interactive playgrounds
`;
    setText(template);
  };

  const handlePreview = () => {
    if (!metaComplete) {
      showNotice(
        'Select level, country, degree, and stream before previewing the tree.',
        'error'
      );
      return;
    }
    clearFeedback();
    const result = parseTreeFile(text);
    if (!result.success) {
      setErrors(result.errors);
      setPreviewTree(null);
      setMobilePreviewOpen(false);
    } else {
      setErrors([]);
      const next = result.tree || null;
      setPreviewTree(next);
      if (next && !isDesktopSplit) setMobilePreviewOpen(true);
    }
  };

  const handleSave = async () => {
    if (!metaComplete) {
      showNotice(
        'Select level, country, degree, and stream before saving.',
        'error'
      );
      return;
    }
    if (!previewTree) {
      showNotice('Preview the tree first — click Preview and fix any parse errors.', 'info');
      return;
    }

    if (isEdit && originalTreeId && previewTree.id !== originalTreeId) {
      showNotice(
        'The TREE header must match this tree’s degree, stream, country, and level. Revert the first line or open New Tree for a different path.',
        'error'
      );
      return;
    }

    setSaving(true);
    try {
      const metaRes = await fetch('/api/trees');
      if (!metaRes.ok) throw new Error('Failed to list trees');
      const meta = (await metaRes.json()) as TreeMetadata[];

      if (!isEdit) {
        if (
          duplicateExists(
            meta,
            previewTree.level,
            previewTree.degree,
            previewTree.stream,
            previewTree.country
          )
        ) {
          showNotice(DUPLICATE_TREE_MSG, 'error');
          setSaving(false);
          return;
        }
      }

      const res = await fetch('/api/trees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(previewTree),
      });
      if (!res.ok) throw new Error('Failed to save');
      router.push('/admin');
    } catch {
      showNotice('Could not save the tree. Try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const degreeSelectDisabled = !level || (level === OTHER && !customLevel.trim()) || degreeOptions.length === 0;
  const streamSelectDisabled = !finalDegree;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden',
      }}
    >
      {notice && (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 250,
            maxWidth: 'min(420px, calc(100vw - 24px))',
            padding: '10px 16px',
            borderRadius: '8px',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            lineHeight: 1.4,
            boxShadow: 'var(--shadow-dropdown)',
            background: notice.tone === 'error' ? '#FEF2F2' : '#F0FDF4',
            border: notice.tone === 'error' ? '1px solid #FECACA' : '1px solid #BBF7D0',
            color: notice.tone === 'error' ? '#991B1B' : '#166534',
          }}
        >
          {notice.text}
        </div>
      )}

      {!isDesktopSplit && mobilePreviewOpen && previewTree ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 240,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--color-paper)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px clamp(12px, 3vw, 16px)',
              borderBottom: '1px solid var(--color-border)',
              background: 'white',
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => {
                setMobilePreviewOpen(false);
                setSelectedNode(null);
              }}
            >
              <ArrowLeft size={14} /> Editor
            </button>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--color-ink)',
              }}
            >
              Tree preview
            </span>
            <div style={{ marginLeft: 'auto' }}>
              <OrientationToggle
                orientation={orientation}
                onChange={setOrientation}
                showLabels={false}
              />
            </div>
          </div>
          <div
            ref={mobilePreviewCanvasRef}
            style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}
          >
            <TreeViewer
              root={previewTree.root}
              orientation={orientation}
              onNodeClick={(node) => setSelectedNode(node)}
              containerWidth={previewSize.w}
              containerHeight={previewSize.h}
              selectedNodeId={selectedNode?.id ?? null}
              clickMode={expandThenPanel ? 'expandThenPanel' : 'default'}
              onClearSelection={() => setSelectedNode(null)}
            />
            <InfoPanel
              variant="embedded"
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        </div>
      ) : null}

      <div
        ref={splitContainerRef}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: isDesktopSplit ? 'row' : 'column',
          minHeight: 0,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'white',
            minHeight: 0,
            ...(isDesktopSplit
              ? {
                  width: `${splitPct}%`,
                  minWidth: 220,
                  maxWidth: '86%',
                  borderRight: '1px solid var(--color-border)',
                }
              : {
                  flex: 1,
                  minHeight: 0,
                  width: '100%',
                }),
          }}
        >
        <div
          style={{
            padding: 'clamp(12px, 2vw, 16px) clamp(14px, 3vw, 24px)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            background: 'var(--color-paper)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(8px, 2vw, 16px)',
              flexWrap: 'wrap',
              minWidth: 0,
            }}
          >
            <Link href="/admin" style={{ color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontSize: '13px' }}>
              <ArrowLeft size={14} /> Back
            </Link>
            <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', margin: 0 }}>
              {isEdit ? 'Edit Tree Source' : 'New Tree Source'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handlePreview}
              className="btn-secondary"
              style={{ padding: '6px 14px' }}
              disabled={!metaComplete}
              title={
                !metaComplete
                  ? 'Fill level, country, degree, and stream first'
                  : undefined
              }
            >
              <Play size={14} /> Preview
              {!isDesktopSplit ? ' (full screen)' : ''}
            </button>
            {!isDesktopSplit && previewTree ? (
              <button
                type="button"
                onClick={() => setMobilePreviewOpen(true)}
                className="btn-secondary"
                style={{ padding: '6px 14px' }}
              >
                View tree
              </button>
            ) : null}
            <button
              onClick={handleSave}
              className="btn-primary"
              style={{ padding: '6px 14px' }}
              disabled={saving || !metaComplete}
              title={
                !metaComplete
                  ? 'Fill level, country, degree, and stream first'
                  : undefined
              }
            >
              <Save size={14} /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {!isEdit && (
          <div style={{ padding: '16px 24px', background: 'var(--color-paper)', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
              <SelectOrOtherField
                label="Level"
                options={[...LEVEL_OPTIONS]}
                value={level}
                onSelect={(v) => {
                  clearFeedback();
                  setLevel(v);
                }}
                otherText={customLevel}
                onOtherText={(v) => {
                  clearFeedback();
                  setCustomLevel(v);
                }}
                resetListValue=""
                placeholder="Select level…"
                formatOption={formatLevelLabel}
              />
              <SelectOrOtherField
                label="Country"
                options={COUNTRIES}
                value={country}
                onSelect={(v) => {
                  clearFeedback();
                  setCountry(v);
                }}
                otherText={customCountry}
                onOtherText={(v) => {
                  clearFeedback();
                  setCustomCountry(v);
                }}
                resetListValue=""
                placeholder="Select country…"
              />
              <SelectOrOtherField
                label="Degree"
                options={degreeOptions}
                value={degree}
                onSelect={(v) => {
                  clearFeedback();
                  setDegree(v);
                }}
                otherText={customDegree}
                onOtherText={(v) => {
                  clearFeedback();
                  setCustomDegree(v);
                }}
                resetListValue=""
                placeholder={degreeSelectDisabled ? 'Select level first…' : 'Select degree…'}
                disabledSelect={degreeSelectDisabled}
              />
              <SelectOrOtherField
                label="Stream / specialization"
                options={streamOptions}
                value={stream}
                onSelect={(v) => {
                  clearFeedback();
                  setStream(v);
                }}
                otherText={customStream}
                onOtherText={(v) => {
                  clearFeedback();
                  setCustomStream(v);
                }}
                resetListValue=""
                placeholder={streamSelectDisabled ? 'Select degree first…' : 'Select stream…'}
                disabledSelect={streamSelectDisabled}
              />
            </div>
            <button
              onClick={() => {
                clearFeedback();
                handleGeneratePrompt();
              }}
              className="btn-secondary"
              style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px', color: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
            >
              <Bot size={16} /> Generate AI Prompt
            </button>
          </div>
        )}

        {!isEdit && !metaComplete && (
          <div
            style={{
              padding: '12px 24px',
              background: '#FFFBEB',
              borderBottom: '1px solid #FDE68A',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              lineHeight: 1.5,
              color: '#92400E',
            }}
          >
            <strong>Metadata required.</strong> Choose level, country, degree, and stream above before
            editing the tree. If your stream is not listed, pick <strong>Other…</strong> and type it.
          </div>
        )}

        <textarea
          value={text}
          onChange={(e) => {
            if (!metaComplete) return;
            clearFeedback();
            setText(e.target.value);
          }}
          onPaste={(e) => {
            if (!metaComplete) e.preventDefault();
          }}
          onDrop={(e) => {
            if (!metaComplete) e.preventDefault();
          }}
          readOnly={!metaComplete}
          aria-readonly={!metaComplete}
          placeholder={
            metaComplete
              ? 'TREE: B.Tech — Computer Science | India | undergraduate&#10;CATEGORY: Software Development&#10;  DESC: ...&#10;'
              : 'Complete level, country, degree, and stream above to edit the tree source…'
          }
          style={{
            flex: 1,
            minHeight: 0,
            width: '100%',
            padding: '24px',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            lineHeight: 1.6,
            border: 'none',
            resize: 'none',
            outline: 'none',
            background: metaComplete ? 'white' : 'var(--color-paper)',
            color: metaComplete ? 'var(--color-ink)' : 'var(--color-ink-muted)',
            cursor: metaComplete ? 'text' : 'not-allowed',
            whiteSpace: 'pre',
          }}
          spellCheck={false}
        />

        {errors.length > 0 && (
          <div style={{ padding: '16px', background: '#FEF2F2', borderTop: '1px solid #FECACA', maxHeight: '200px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#B91C1C', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
              <AlertCircle size={14} /> Parse Errors ({errors.length})
            </div>
            {errors.map((e, idx) => (
              <div key={idx} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#991B1B', marginBottom: '4px' }}>
                Line {e.line}: {e.message}
              </div>
            ))}
          </div>
        )}
        </div>

        {isDesktopSplit ? (
          <>
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize source and preview panels"
              aria-valuenow={Math.round(splitPct)}
              tabIndex={0}
              onMouseDown={handleSplitPointerDown}
              onTouchStart={handleSplitPointerDown}
              onKeyDown={(e) => {
                const step = 4;
                if (e.key === 'ArrowLeft') persistSplitPct(splitPct - step);
                if (e.key === 'ArrowRight') persistSplitPct(splitPct + step);
              }}
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                touchAction: 'none',
                zIndex: 6,
                width: 12,
                marginLeft: -6,
                marginRight: -6,
                cursor: 'col-resize',
              }}
            >
              <div
                style={{
                  width: 3,
                  height: 'min(140px, 32vh)',
                  background: 'var(--color-border)',
                  borderRadius: 2,
                }}
              />
            </div>

            <div
              ref={previewPaneRef}
              style={{
                flex: 1,
                minWidth: 0,
                minHeight: 0,
                position: 'relative',
                background: 'var(--color-paper)',
                overflow: 'hidden',
              }}
            >
              {previewTree && (
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    zIndex: 15,
                    pointerEvents: 'auto',
                  }}
                >
                  <OrientationToggle orientation={orientation} onChange={setOrientation} />
                </div>
              )}
              {previewTree ? (
                <TreeViewer
                  root={previewTree.root}
                  orientation={orientation}
                  onNodeClick={(node) => setSelectedNode(node)}
                  containerWidth={previewSize.w}
                  containerHeight={previewSize.h}
                  selectedNodeId={selectedNode?.id ?? null}
                  clickMode={expandThenPanel ? 'expandThenPanel' : 'default'}
                  onClearSelection={() => setSelectedNode(null)}
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    padding: '24px',
                    gap: '8px',
                    color: 'var(--color-ink-muted)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '13px',
                    textAlign: 'center',
                  }}
                >
                  <span>Hit Preview to render the tree.</span>
                  <span style={{ fontSize: '12px', maxWidth: 280 }}>
                    After preview, click any node to open the same detail panel as the live viewer.
                  </span>
                </div>
              )}
              <InfoPanel
                variant="embedded"
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
