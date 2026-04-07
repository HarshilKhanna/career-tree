'use client';

import {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  useRef,
  type CSSProperties,
} from 'react';
import { useRouter } from 'next/navigation';
import { CareerTree, CareerNode } from '@/lib/types';
import type { TreeMetadata } from '@/lib/types';
import { parseTreeFile, ParseError } from '@/lib/parseTreeFile';
import {
  applyProfileMetadata,
  buildTreeId,
  profileToCareerTreeFields,
  treeSelectionsFromForm,
  type Exp2PlusEducation,
  type TreeSelections,
} from '@/lib/treeUtils';
import { Play, Save, AlertCircle, ArrowLeft, Bot } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import OrientationToggle from '@/components/OrientationToggle';
import InfoPanel from '@/components/InfoPanel';
import {
  formatLevelLabel,
  INSCHOOL_STREAMS,
  MASTERS_DEGREES,
  PROFILE_TYPES,
  profileSpecialisations,
  SENIOR_ROLES,
  UG_DEGREES,
  WORK_DOMAINS,
} from '@/lib/treeConfig';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const TreeViewer = dynamic(() => import('@/components/TreeViewer'), { ssr: false });

const SPLIT_STORAGE_KEY = 'careertree_admin_split_pct';
const CUSTOM_OPTIONS_STORAGE_KEY = 'careertree_admin_custom_options_v1';
const SPLIT_MIN = 22;
const SPLIT_MAX = 78;

const DUPLICATE_PROFILE_MSG =
  'A tree already exists for this ID. Change the selections or edit the existing tree.';

function duplicateProfileId(meta: TreeMetadata[], id: string): boolean {
  return meta.some((m) => m.id === id);
}

function adminLabelStyle(): CSSProperties {
  return {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--color-ink-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: '6px',
  };
}

function AdminSelect({
  label,
  value,
  onChange,
  placeholder,
  items,
  disabled,
  allowCustom,
  onCreateOption,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  items: { value: string; label: string }[];
  disabled?: boolean;
  allowCustom?: boolean;
  onCreateOption?: (nextValue: string) => void;
}) {
  const NEW_VALUE = '__new__';
  return (
    <div style={{ flex: 1, minWidth: '140px' }}>
      <label style={adminLabelStyle()}>{label}</label>
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
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.value;
          if (allowCustom && next === NEW_VALUE && onCreateOption) {
            const typed = window.prompt(`Add new option for ${label}`);
            if (typed && typed.trim()) {
              onCreateOption(typed.trim());
            }
            return;
          }
          onChange(next);
        }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {items.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {allowCustom ? <option value={NEW_VALUE}>+ New…</option> : null}
      </select>
    </div>
  );
}

interface CustomAdminOptions {
  inschoolStreams: string[];
  ugDegrees: string[];
  mastersDegrees: string[];
  workDomains: string[];
  seniorRoles: string[];
  specialisations: Record<string, string[]>;
}

const EMPTY_CUSTOM_OPTIONS: CustomAdminOptions = {
  inschoolStreams: [],
  ugDegrees: [],
  mastersDegrees: [],
  workDomains: [],
  seniorRoles: [],
  specialisations: {},
};

interface AdminUploaderProps {
  initialText?: string;
  isEdit?: boolean;
  originalTreeId?: string;
  /** When editing, preserve stable metadata the .txt header does not encode (profile id, UG fields, timestamps). */
  editBaseline?: Pick<CareerTree, 'id' | 'createdAt' | 'country' | 'ugDegree' | 'ugStream'> | null;
}

export default function AdminUploader({
  initialText = '',
  isEdit = false,
  originalTreeId,
  editBaseline = null,
}: AdminUploaderProps) {
  const router = useRouter();
  const [text, setText] = useState(initialText);
  const [previewTree, setPreviewTree] = useState<CareerTree | null>(null);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [saving, setSaving] = useState(false);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [notice, setNotice] = useState<{ text: string; tone: 'info' | 'error' } | null>(null);
  const [isDuplicateProfile, setIsDuplicateProfile] = useState(false);

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

  const [pProfile, setPProfile] = useState<TreeSelections['profile'] | ''>('');
  const [pStream, setPStream] = useState('');
  const [pUgDegree, setPUgDegree] = useState('');
  const [pUgSpec, setPUgSpec] = useState('');
  const [pMastersDegree, setPMastersDegree] = useState('');
  const [pMastersSpec, setPMastersSpec] = useState('');
  const [pDomain, setPDomain] = useState('');
  const [pRole, setPRole] = useState('');
  const [pExp2plusEdu, setPExp2plusEdu] = useState<Exp2PlusEducation | ''>('');
  const [customOptions, setCustomOptions] =
    useState<CustomAdminOptions>(EMPTY_CUSTOM_OPTIONS);

  const addUnique = (arr: string[], value: string) =>
    arr.some((v) => v.toLowerCase() === value.toLowerCase()) ? arr : [...arr, value];

  const persistCustomOptions = (next: CustomAdminOptions) => {
    setCustomOptions(next);
    try {
      localStorage.setItem(CUSTOM_OPTIONS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_OPTIONS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CustomAdminOptions;
      persistCustomOptions({
        inschoolStreams: parsed.inschoolStreams || [],
        ugDegrees: parsed.ugDegrees || [],
        mastersDegrees: parsed.mastersDegrees || [],
        workDomains: parsed.workDomains || [],
        seniorRoles: parsed.seniorRoles || [],
        specialisations: parsed.specialisations || {},
      });
    } catch {
      /* ignore */
    }
  }, []);

  const inschoolOptions = useMemo(
    () => [...INSCHOOL_STREAMS, ...customOptions.inschoolStreams],
    [customOptions.inschoolStreams]
  );
  const ugDegreeOptions = useMemo(
    () => [...UG_DEGREES, ...customOptions.ugDegrees],
    [customOptions.ugDegrees]
  );
  const mastersDegreeOptions = useMemo(
    () => [...MASTERS_DEGREES, ...customOptions.mastersDegrees],
    [customOptions.mastersDegrees]
  );
  const workDomainOptions = useMemo(
    () => [...WORK_DOMAINS, ...customOptions.workDomains],
    [customOptions.workDomains]
  );
  const seniorRoleOptions = useMemo(
    () => [...SENIOR_ROLES, ...customOptions.seniorRoles],
    [customOptions.seniorRoles]
  );

  const profileForm = useMemo(() => {
    const profileTrim = pProfile.trim();
    const profileNorm =
      profileTrim === '' ? null : (profileTrim as TreeSelections['profile']);
    const eduTrim = pExp2plusEdu.trim();
    const exp2EduNorm: Exp2PlusEducation | null =
      profileNorm === 'exp2plus' &&
      (eduTrim === 'bachelors_only' || eduTrim === 'masters')
        ? eduTrim
        : null;
    return {
      profile: profileNorm,
      stream: pStream.trim() || null,
      ugDegree: pUgDegree.trim() || null,
      ugSpec: pUgSpec.trim() || null,
      mastersDegree: pMastersDegree.trim() || null,
      mastersSpec: pMastersSpec.trim() || null,
      domain: pDomain.trim() || null,
      role: pRole.trim() || null,
      exp2plusEducation: exp2EduNorm,
    };
  }, [
    pProfile,
    pStream,
    pUgDegree,
    pUgSpec,
    pMastersDegree,
    pMastersSpec,
    pDomain,
    pRole,
    pExp2plusEdu,
  ]);

  const profileSelections = useMemo(
    () => treeSelectionsFromForm(profileForm),
    [profileForm]
  );

  const computedTreeId = profileSelections ? buildTreeId(profileSelections) : '';

  const ugSpecList = useMemo(() => {
    if (!pUgDegree) return null;
    const base = profileSpecialisations(pUgDegree) || [];
    const extra = customOptions.specialisations[pUgDegree] || [];
    const merged = [...base, ...extra];
    return merged.length ? merged : null;
  }, [pUgDegree, customOptions.specialisations]);

  const mastersSpecList = useMemo(() => {
    if (!pMastersDegree) return null;
    const base = profileSpecialisations(pMastersDegree) || [];
    const extra = customOptions.specialisations[pMastersDegree] || [];
    const merged = [...base, ...extra];
    return merged.length ? merged : null;
  }, [pMastersDegree, customOptions.specialisations]);

  /** New trees: block source editing until profile path is complete (edit mode always allowed). */
  const metaComplete = useMemo(
    () => isEdit || profileSelections !== null,
    [isEdit, profileSelections]
  );
  const duplicateLocked = !isEdit && isDuplicateProfile;

  useEffect(() => {
    if (!pUgDegree) {
      setPUgSpec('');
      return;
    }
    const opts = profileSpecialisations(pUgDegree);
    if (!opts || opts.length === 0) {
      setPUgSpec('');
      return;
    }
    setPUgSpec((prev) => (prev && opts.includes(prev) ? prev : ''));
  }, [pUgDegree]);

  useEffect(() => {
    if (!pMastersDegree) {
      setPMastersSpec('');
      return;
    }
    const opts = profileSpecialisations(pMastersDegree);
    if (!opts || opts.length === 0) {
      setPMastersSpec('');
      return;
    }
    setPMastersSpec((prev) => (prev && opts.includes(prev) ? prev : ''));
  }, [pMastersDegree]);

  useLayoutEffect(() => {
    setPStream('');
    setPUgDegree('');
    setPUgSpec('');
    setPMastersDegree('');
    setPMastersSpec('');
    setPDomain('');
    setPRole('');
    setPExp2plusEdu('');
  }, [pProfile]);

  useEffect(() => {
    if (pExp2plusEdu.trim() === 'bachelors_only') {
      setPMastersDegree('');
      setPMastersSpec('');
    }
  }, [pExp2plusEdu]);

  const ugPathReadyAdmin = useMemo(
    () =>
      Boolean(
        pUgDegree?.trim() && (!ugSpecList?.length || Boolean(pUgSpec?.trim()))
      ),
    [pUgDegree, pUgSpec, ugSpecList]
  );

  const mastersPathReadyAdmin = useMemo(
    () =>
      Boolean(
        pMastersDegree?.trim() &&
          (!mastersSpecList?.length || Boolean(pMastersSpec?.trim()))
      ),
    [pMastersDegree, pMastersSpec, mastersSpecList]
  );

  /** Drop exp2+ follow-ups when undergrad path is incomplete (avoids stale UI vs validation). */
  useEffect(() => {
    if (pProfile !== 'exp2plus') return;
    if (ugPathReadyAdmin) return;
    setPExp2plusEdu('');
    setPRole('');
  }, [pProfile, ugPathReadyAdmin]);

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
    if (!computedTreeId) {
      setIsDuplicateProfile(false);
      setNotice((n) => (n?.text === DUPLICATE_PROFILE_MSG ? null : n));
      return;
    }

    const ac = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch('/api/trees', { signal: ac.signal });
        if (!res.ok) return;
        const meta = (await res.json()) as TreeMetadata[];
        if (duplicateProfileId(meta, computedTreeId)) {
          setIsDuplicateProfile(true);
          setNotice({ text: DUPLICATE_PROFILE_MSG, tone: 'error' });
        } else {
          setIsDuplicateProfile(false);
          setNotice((prev) => (prev?.text === DUPLICATE_PROFILE_MSG ? null : prev));
        }
      } catch {
        /* aborted or network */
      }
    }, 380);

    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [computedTreeId, isEdit]);

  const clearFeedback = useCallback(() => {
    setNotice(null);
    setErrors([]);
  }, []);

  const showNotice = (text: string, tone: 'info' | 'error' = 'info') => {
    setNotice({ text, tone });
  };

  const handleGeneratePrompt = () => {
    if (duplicateLocked) {
      showNotice(DUPLICATE_PROFILE_MSG, 'error');
      return;
    }
    if (!profileSelections) {
      showNotice('Complete the profile selections before generating.', 'error');
      return;
    }
    const f = profileToCareerTreeFields(profileSelections);
    const header = `TREE: ${f.degree} — ${f.stream ?? 'None'} | ${formatLevelLabel(f.level)}`;
    const isInschool = profileSelections.profile === 'inschool';
    const profileTypeLabel =
      PROFILE_TYPES.find((p) => p.id === profileSelections.profile)?.label ??
      'Unknown profile';

    const inschoolBlock = isInschool
      ? `
In-School focus (${f.stream ?? 'stream'}):
- Audience: students in school choosing next steps (exams, degrees, early careers).
- Keep salary and progression examples realistic and practical.
`
      : `
Audience:
- Match ${formatLevelLabel(f.level)}; tree id for reference: ${f.id}.
- Profile type: ${profileTypeLabel}.
`;

    const profileContextBlock = (() => {
      if (!profileSelections) return '';
      if (profileSelections.profile === 'masters_exp') {
        return `
Profile nuance (must reflect in content):
- Profile type: ${profileTypeLabel}.
- UG degree: ${profileSelections.ugDegree}${profileSelections.ugSpec ? ` — ${profileSelections.ugSpec}` : ''}.
- Master's degree: ${profileSelections.mastersDegree}${profileSelections.mastersSpec ? ` — ${profileSelections.mastersSpec}` : ''}.
- Work domain (from dropdown): ${profileSelections.domain ?? 'selected domain'}.
- This is NOT a generic masters student tree.
- Audience has a master's degree plus under 2 years of work experience.
- Prioritize transition-ready roles where early industry exposure is valued.
- Include practical portfolio, delivery, stakeholder, and business-context readiness.
- Tailor content specifically to this degree + specialization + domain combination.
`;
      }
      if (profileSelections.profile === 'bachelors_exp') {
        return `
Profile nuance (must reflect in content):
- Profile type: ${profileTypeLabel}.
- UG degree: ${profileSelections.ugDegree}${profileSelections.ugSpec ? ` — ${profileSelections.ugSpec}` : ''}.
- Work domain (from dropdown): ${profileSelections.domain ?? 'selected domain'}.
- Audience has a bachelor's degree plus under 2 years of work experience.
- Favor role paths that reward execution maturity over purely academic depth.
- Tailor content specifically to this degree + specialization + domain combination.
`;
      }
      if (profileSelections.profile === 'exp2plus') {
        const hasMasters = Boolean(profileSelections.mastersDegree?.trim());
        const eduLines: string[] = [];
        eduLines.push(`- UG degree: ${profileSelections.ugDegree}${profileSelections.ugSpec ? ` — ${profileSelections.ugSpec}` : ''}`);
        if (hasMasters) {
          eduLines.push(`- Master's degree: ${profileSelections.mastersDegree}${profileSelections.mastersSpec ? ` — ${profileSelections.mastersSpec}` : ''}`);
        } else {
          eduLines.push(`- Highest education: Bachelor's only (no master's degree).`);
        }
        return `
Profile nuance (must reflect in content):
- Profile type (from dropdown): ${profileTypeLabel}.
${eduLines.join('\n')}
- Target senior role / domain (from dropdown): ${profileSelections.role ?? 'not specified'}.
- Audience has 2+ years experience and is targeting growth/leadership trajectory.
- Emphasize ownership, decision-making, cross-functional scope, and progression paths.
- Tailor content specifically to someone with this education background pursuing this senior role.
`;
      }
      return '';
    })();

    const template = `=== LLM PROMPT — CareerTree .txt source (copy into ChatGPT / Claude) ===

Act as an expert career counselor.

## Output contract
- Return **ONLY** parser-valid tree text.
- Your response must start with \`TREE:\` as the first character.
- Do **NOT** include any preface, explanation, notes, headings, markdown, code fences, or trailing commentary.
- Do **NOT** wrap the answer in backticks.
- Do **NOT** output any line containing a colon (\`:\`) unless it uses one of the exact keywords listed below. The parser treats every \`KEYWORD: value\` line as a keyword — any invented label (e.g. \`THE FUNDAMENTAL FORK:\`, \`NOTE:\`, \`SECTION:\`) will cause a parse error and reject the whole tree.
- If you cannot comply, output exactly: \`ERROR: unable to generate valid tree\`

${inschoolBlock.trim()}

${profileContextBlock.trim()}

## Hard limits (important)
- **Total nodes: 50–60** (count every **CATEGORY, PATH, SPEC, and SUB**; the root line is not a node). Aim mid-band unless the topic needs the high end.
- Build a **substantial** tree: use enough categories, paths, branches, and **SUB** splits so coverage feels deep, while keeping the total in **50–60**.
- **Before finalizing, self-count nodes. If outside 50–60, expand/compress and recount until compliant.**
- **Do not return a draft. Return only the final version that already satisfies 50–60 nodes.**
- **Do not** mention "terminal", "leaf", or "end of tree" in any user-facing text.

## Hierarchy (indent with exactly 2 spaces per level)
Use the full chain **CATEGORY → PATH → SPEC → SUB** whenever it helps. **SUB** is encouraged for finer role splits (e.g. multiple concrete jobs under one SPEC). Do **not** flatten artificially.

## Every non-terminal node (ABSOLUTE rule — zero exceptions)
For **every node that has children** (\`CATEGORY\`, \`PATH\`, or a branching \`SPEC\`), you **must** output all of the following, in this exact order — skipping even one will cause a parse error:
1. \`DESC: …\` — one short line.
2. \`WHAT_IT_IS:\` followed by at least one \`- …\` bullet.
3. \`WHO_ITS_NOT_FOR:\` followed by at least one \`- …\` bullet.
4. \`WORK_LIFESTYLE:\` followed by at least one \`- …\` bullet.
5. \`ENTRY_ROUTE:\` followed by at least one \`- …\` bullet.
6. \`TIMELINE:\` followed by at least one \`- …\` bullet.
7. \`SALARY_RANGE:\` followed by at least one \`- …\` bullet.
8. \`GROWTH:\` followed by at least one \`- …\` bullet.
9. \`DEMAND:\` followed by at least one \`- …\` bullet.
10. \`HONEST_CAVEAT:\` followed by at least one \`- …\` bullet.
- **Do not** put \`SKILLS:\`, \`SALARY:\`, or \`ROADMAP:\` on non-terminals (those are terminal-only).
- **Check before moving to the next node**: every non-terminal must have all 10 items above.

## SPEC nodes — two cases
**A) SPEC branches further** (has \`SUB:\` children): treat exactly like any non-terminal — output \`DESC:\` plus **all ten items** from the non-terminal rule above (one \`- \` bullet each). **No** \`SKILLS\` / \`SALARY\` / \`ROADMAP\` on that SPEC.

**B) SPEC is a leaf** (no SUB under it): terminal content — \`    DESC:\` (1–2 short sentences), \`    SKILLS:\` (**4–8** comma-separated), \`    SALARY:\` (one INR line), \`    ROADMAP:\` (one line; use \`→\` where natural).

## SUB nodes = deepest terminals (no children)
Each \`SUB:\` **must** include:
- \`      DESC: …\` — 1–2 short sentences.
- \`      SKILLS: …\` — **4–8** comma-separated skills.
- \`      SALARY: …\` — one INR line.
- \`      ROADMAP: …\` — one scannable line with \`→\` where natural.

## First line (required)
${header}

## Keywords the parser accepts
Structural: \`CATEGORY:\`, \`PATH:\`, \`SPEC:\`, \`SUB:\`
Scalars: \`DESC:\`, \`SKILLS:\`, \`SALARY:\`, \`ROADMAP:\`
Path arrays: \`WHAT_IT_IS:\`, \`WHO_ITS_NOT_FOR:\`, \`WORK_LIFESTYLE:\`, \`ENTRY_ROUTE:\`, \`TIMELINE:\`, \`SALARY_RANGE:\`, \`GROWTH:\`, \`DEMAND:\`, \`HONEST_CAVEAT:\` (prefer \`- \` bullets, but concise plain lines are acceptable).

## Minimal example shape (illustration only — replace with real content)
${header}

CATEGORY: Example domain
  DESC: One-line scope for this bucket.
  WHAT_IT_IS:
  - Short point under ten words.
  WHO_ITS_NOT_FOR:
  - Short point under ten words.
  WORK_LIFESTYLE:
  - Short point under ten words.
  ENTRY_ROUTE:
  - Short point under ten words.
  TIMELINE:
  - Short point under ten words.
  SALARY_RANGE:
  - Short point under ten words.
  GROWTH:
  - Short point under ten words.
  DEMAND:
  - Short point under ten words.
  HONEST_CAVEAT:
  - Short point under ten words.

  PATH: Example route
    DESC: One-line summary of this branch.
    WHAT_IT_IS:
    - Short point under ten words.
    WHO_ITS_NOT_FOR:
    - Short point under ten words.
    WORK_LIFESTYLE:
    - Short point under ten words.
    ENTRY_ROUTE:
    - Short point under ten words.
    TIMELINE:
    - Short point under ten words.
    SALARY_RANGE:
    - Short point under ten words.
    GROWTH:
    - Short point under ten words.
    DEMAND:
    - Short point under ten words.
    HONEST_CAVEAT:
    - Short point under ten words.

    SPEC: Example grouping (branches to SUBs)
      DESC: One line introducing this split.
      WHAT_IT_IS:
      - Short point under ten words.
      WHO_ITS_NOT_FOR:
      - Short point under ten words.
      WORK_LIFESTYLE:
      - Short point under ten words.
      ENTRY_ROUTE:
      - Short point under ten words.
      TIMELINE:
      - Short point under ten words.
      SALARY_RANGE:
      - Short point under ten words.
      GROWTH:
      - Short point under ten words.
      DEMAND:
      - Short point under ten words.
      HONEST_CAVEAT:
      - Short point under ten words.

      SUB: Concrete role A
        DESC: One or two sentences. Practical and realistic tone.
        SKILLS: Skill A, Skill B, Skill C, Skill D, Skill E
        SALARY: ₹10L–₹25L / yr
        ROADMAP: Step one → Step two → Step three

      SUB: Concrete role B
        DESC: One or two sentences.
        SKILLS: Skill F, Skill G, Skill H, Skill I
        SALARY: ₹8L–₹18L / yr
        ROADMAP: Stage one → Stage two → Stage three

    SPEC: Standalone leaf role (no SUB)
      DESC: One or two sentences when this SPEC has no children.
      SKILLS: Skill A, Skill B, Skill C, Skill D
      SALARY: ₹12L–₹28L / yr
      ROADMAP: A → B → C
`;
    setText(template);
  };

  const handlePreview = () => {
    if (!metaComplete) {
      showNotice('Complete the profile selections before previewing the tree.', 'error');
      return;
    }
    if (!isEdit && !profileSelections) {
      showNotice('Complete the profile selections before previewing the tree.', 'error');
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
      const next = result.tree ? { ...result.tree } : null;
      if (next && !isEdit && profileSelections) {
        applyProfileMetadata(next, profileSelections);
      }
      if (next && isEdit && editBaseline) {
        next.id = editBaseline.id;
        next.createdAt = editBaseline.createdAt;
        next.country = editBaseline.country;
        next.ugDegree = editBaseline.ugDegree ?? null;
        next.ugStream = editBaseline.ugStream ?? null;
      }
      setPreviewTree(next);
      if (next && !isDesktopSplit) setMobilePreviewOpen(true);
    }
  };

  const handleSave = async () => {
    if (!metaComplete) {
      showNotice('Complete the profile selections before saving.', 'error');
      return;
    }
    if (!previewTree) {
      showNotice('Preview the tree first — click Preview and fix any parse errors.', 'info');
      return;
    }

    if (isEdit && originalTreeId && previewTree.id !== originalTreeId) {
      showNotice(
        'Saved tree id must match this record. Revert edits to the parsed id or open New Tree for a different path.',
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
        if (duplicateProfileId(meta, previewTree.id)) {
          showNotice(DUPLICATE_PROFILE_MSG, 'error');
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
                  ? 'Complete profile selections first'
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
                  ? 'Complete profile selections first'
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
              <AdminSelect
                label="Profile type"
                value={pProfile}
                onChange={(v) => {
                  clearFeedback();
                  const t = v.trim();
                  setPProfile((t || '') as TreeSelections['profile'] | '');
                }}
                placeholder="Select profile…"
                items={PROFILE_TYPES.map((p) => ({ value: p.id, label: p.label }))}
              />
              {pProfile === 'inschool' ? (
                <AdminSelect
                  label="Stream"
                  value={pStream}
                  onChange={(v) => {
                    clearFeedback();
                    setPStream(v);
                  }}
                  placeholder="Select stream…"
                  items={inschoolOptions.map((s) => ({ value: s, label: s }))}
                  allowCustom
                  onCreateOption={(next) => {
                    clearFeedback();
                    const updated = {
                      ...customOptions,
                      inschoolStreams: addUnique(customOptions.inschoolStreams, next),
                    };
                    persistCustomOptions(updated);
                    setPStream(next);
                  }}
                />
              ) : null}
              {pProfile === 'bachelors' ||
              pProfile === 'bachelors_exp' ||
              pProfile === 'masters' ||
              pProfile === 'masters_exp' ||
              pProfile === 'exp2plus' ? (
                <AdminSelect
                  label={
                    pProfile === 'masters' || pProfile === 'masters_exp' || pProfile === 'exp2plus'
                      ? 'Undergraduate degree'
                      : 'Degree'
                  }
                  value={pUgDegree}
                  onChange={(v) => {
                    clearFeedback();
                    setPUgDegree(v);
                  }}
                  placeholder="Select degree…"
                  items={ugDegreeOptions.map((s) => ({ value: s, label: s }))}
                  allowCustom
                  onCreateOption={(next) => {
                    clearFeedback();
                    const updated = {
                      ...customOptions,
                      ugDegrees: addUnique(customOptions.ugDegrees, next),
                    };
                    persistCustomOptions(updated);
                    setPUgDegree(next);
                    setPUgSpec('');
                  }}
                />
              ) : null}
              {pUgDegree && ugSpecList && ugSpecList.length > 0 ? (
                <AdminSelect
                  label={
                    pProfile === 'masters' || pProfile === 'masters_exp' || pProfile === 'exp2plus'
                      ? 'UG specialisation'
                      : 'Specialisation'
                  }
                  value={pUgSpec}
                  onChange={(v) => {
                    clearFeedback();
                    setPUgSpec(v);
                  }}
                  placeholder="Select specialisation…"
                  items={ugSpecList.map((s) => ({ value: s, label: s }))}
                  allowCustom
                  onCreateOption={(next) => {
                    clearFeedback();
                    if (!pUgDegree) return;
                    const current = customOptions.specialisations[pUgDegree] || [];
                    const updated = {
                      ...customOptions,
                      specialisations: {
                        ...customOptions.specialisations,
                        [pUgDegree]: addUnique(current, next),
                      },
                    };
                    persistCustomOptions(updated);
                    setPUgSpec(next);
                  }}
                />
              ) : null}
              {pProfile === 'exp2plus' && ugPathReadyAdmin ? (
                <AdminSelect
                  label="Beyond bachelor's"
                  value={pExp2plusEdu}
                  onChange={(v) => {
                    clearFeedback();
                    const t = v.trim();
                    const next: Exp2PlusEducation | '' =
                      t === 'bachelors_only' || t === 'masters' ? t : '';
                    const prevEdu = pExp2plusEdu.trim();
                    if (prevEdu !== '' && next !== '' && next !== prevEdu) setPRole('');
                    setPExp2plusEdu(next);
                  }}
                  placeholder="Select education path…"
                  items={[
                    {
                      value: 'bachelors_only',
                      label: "Bachelor's only — no master's",
                    },
                    { value: 'masters', label: "I have a master's" },
                  ]}
                />
              ) : null}
              {pProfile === 'masters' ||
              pProfile === 'masters_exp' ||
              (pProfile === 'exp2plus' && pExp2plusEdu.trim() === 'masters') ? (
                <AdminSelect
                  label="Master's degree"
                  value={pMastersDegree}
                  onChange={(v) => {
                    clearFeedback();
                    setPMastersDegree(v);
                  }}
                  placeholder="Select master's degree…"
                  disabled={!pUgDegree || Boolean(ugSpecList?.length && !pUgSpec)}
                  items={mastersDegreeOptions.map((s) => ({ value: s, label: s }))}
                  allowCustom
                  onCreateOption={(next) => {
                    clearFeedback();
                    const updated = {
                      ...customOptions,
                      mastersDegrees: addUnique(customOptions.mastersDegrees, next),
                    };
                    persistCustomOptions(updated);
                    setPMastersDegree(next);
                    setPMastersSpec('');
                  }}
                />
              ) : null}
              {pMastersDegree && mastersSpecList && mastersSpecList.length > 0 ? (
                <AdminSelect
                  label="Master's specialisation"
                  value={pMastersSpec}
                  onChange={(v) => {
                    clearFeedback();
                    setPMastersSpec(v);
                  }}
                  placeholder="Select specialisation…"
                  items={mastersSpecList.map((s) => ({ value: s, label: s }))}
                  allowCustom
                  onCreateOption={(next) => {
                    clearFeedback();
                    if (!pMastersDegree) return;
                    const current = customOptions.specialisations[pMastersDegree] || [];
                    const updated = {
                      ...customOptions,
                      specialisations: {
                        ...customOptions.specialisations,
                        [pMastersDegree]: addUnique(current, next),
                      },
                    };
                    persistCustomOptions(updated);
                    setPMastersSpec(next);
                  }}
                />
              ) : null}
              {pProfile === 'bachelors_exp' ? (
                <AdminSelect
                  label="Work domain"
                  value={pDomain}
                  onChange={(v) => {
                    clearFeedback();
                    setPDomain(v);
                  }}
                  placeholder="Select domain…"
                  disabled={!ugPathReadyAdmin}
                  items={workDomainOptions.map((s) => ({ value: s, label: s }))}
                  allowCustom
                  onCreateOption={(next) => {
                    clearFeedback();
                    const updated = {
                      ...customOptions,
                      workDomains: addUnique(customOptions.workDomains, next),
                    };
                    persistCustomOptions(updated);
                    setPDomain(next);
                  }}
                />
              ) : null}
              {pProfile === 'masters_exp' ? (
                <AdminSelect
                  label="Work domain"
                  value={pDomain}
                  onChange={(v) => {
                    clearFeedback();
                    setPDomain(v);
                  }}
                  placeholder="Select domain…"
                  disabled={!ugPathReadyAdmin || !mastersPathReadyAdmin}
                  items={workDomainOptions.map((s) => ({ value: s, label: s }))}
                  allowCustom
                  onCreateOption={(next) => {
                    clearFeedback();
                    const updated = {
                      ...customOptions,
                      workDomains: addUnique(customOptions.workDomains, next),
                    };
                    persistCustomOptions(updated);
                    setPDomain(next);
                  }}
                />
              ) : null}
              {pProfile === 'exp2plus' ? (
                <AdminSelect
                  label="Most recent role"
                  value={pRole}
                  onChange={(v) => {
                    clearFeedback();
                    setPRole(v.trim());
                  }}
                  placeholder="Select role…"
                  disabled={
                    !ugPathReadyAdmin ||
                    pExp2plusEdu.trim() === '' ||
                    (pExp2plusEdu.trim() === 'masters' && !mastersPathReadyAdmin)
                  }
                  items={seniorRoleOptions.map((s) => ({ value: s, label: s }))}
                  allowCustom
                  onCreateOption={(next) => {
                    clearFeedback();
                    const updated = {
                      ...customOptions,
                      seniorRoles: addUnique(customOptions.seniorRoles, next),
                    };
                    persistCustomOptions(updated);
                    setPRole(next);
                  }}
                />
              ) : null}
            </div>
            {computedTreeId ? (
              <div style={{ marginBottom: 14 }}>
                <span style={adminLabelStyle()}>Generated tree id</span>
                <code
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    display: 'block',
                    wordBreak: 'break-all',
                    color: 'var(--color-ink)',
                  }}
                >
                  {computedTreeId}
                </code>
              </div>
            ) : null}
            <button
              onClick={() => {
                clearFeedback();
                handleGeneratePrompt();
              }}
              disabled={!metaComplete || duplicateLocked}
              className="btn-secondary"
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                color: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
                opacity: !metaComplete || duplicateLocked ? 0.5 : 1,
                cursor: !metaComplete || duplicateLocked ? 'not-allowed' : 'pointer',
              }}
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
            <strong>Profile required.</strong> Select your profile type and answer the follow-up fields above
            before editing the tree source.
          </div>
        )}
        {!isEdit && duplicateLocked && (
          <div
            style={{
              padding: '12px 24px',
              background: '#FEF2F2',
              borderBottom: '1px solid #FECACA',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              lineHeight: 1.5,
              color: '#991B1B',
            }}
          >
            <strong>Tree already exists.</strong> Source editing and prompt generation are disabled for this
            profile. Open it from the library and edit that tree instead.
          </div>
        )}

        <textarea
          value={text}
          onChange={(e) => {
            if (!metaComplete || duplicateLocked) return;
            clearFeedback();
            setText(e.target.value);
          }}
          onPaste={(e) => {
            if (!metaComplete || duplicateLocked) e.preventDefault();
          }}
          onDrop={(e) => {
            if (!metaComplete || duplicateLocked) e.preventDefault();
          }}
          readOnly={!metaComplete || duplicateLocked}
          aria-readonly={!metaComplete || duplicateLocked}
          placeholder={
            duplicateLocked
              ? 'This profile already has a tree. Open existing tree from the library to edit.'
              : metaComplete
              ? 'TREE: B.Tech — Computer Science | undergraduate&#10;CATEGORY: Software Development&#10;  DESC: ...&#10;'
              : 'Complete profile selections above to edit the tree source…'
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
            background: metaComplete && !duplicateLocked ? 'white' : 'var(--color-paper)',
            color: metaComplete && !duplicateLocked ? 'var(--color-ink)' : 'var(--color-ink-muted)',
            cursor: metaComplete && !duplicateLocked ? 'text' : 'not-allowed',
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
