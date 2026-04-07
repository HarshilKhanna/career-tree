'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign } from 'lucide-react';
import { CareerNode } from '@/lib/types';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const SHEET_BREAKPOINT = '(max-width: 639px)';

interface InfoPanelProps {
  node: CareerNode | null;
  onClose: () => void;
  /**
   * `page` — fixed under the public tree header (56px offset).
   * `embedded` — absolute inside the admin preview column (full height of preview).
   */
  variant?: 'page' | 'embedded';
}

export default function InfoPanel({ node, onClose, variant = 'page' }: InfoPanelProps) {
  const isEmbedded = variant === 'embedded';
  const isSheet = useMediaQuery(SHEET_BREAKPOINT);

  useEffect(() => {
    if (!node || !isSheet || isEmbedded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [node, isSheet, isEmbedded]);

  useEffect(() => {
    if (!node) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [node, onClose]);

  const sheet = isSheet;
  const zBackdrop = isEmbedded ? 25 : 190;
  const zPanel = isEmbedded ? 30 : 200;

  return (
    <AnimatePresence>
      {node && (
        <>
          {sheet && (
            <motion.div
              key="backdrop"
              role="presentation"
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              style={{
                position: isEmbedded ? 'absolute' : 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                top: isEmbedded ? 0 : 56,
                background: 'rgba(26, 26, 24, 0.38)',
                zIndex: zBackdrop,
              }}
            />
          )}
          <motion.aside
            key="panel"
            initial={
              sheet
                ? { y: '100%', opacity: 1 }
                : { x: 380, opacity: 0 }
            }
            animate={sheet ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
            exit={sheet ? { y: '100%', opacity: 1 } : { x: 380, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 340 }}
            className="will-change-transform ct-info-panel"
            style={{
              position: isEmbedded ? 'absolute' : 'fixed',
              top: sheet ? 'auto' : isEmbedded ? 0 : 56,
              right: sheet ? 0 : 0,
              bottom: sheet ? 0 : 0,
              left: sheet ? 0 : 'auto',
              width: sheet ? '100%' : isEmbedded ? 'min(380px, 100%)' : 'min(380px, 100vw)',
              maxWidth: sheet ? '100%' : undefined,
              maxHeight: sheet ? 'min(88dvh, 640px)' : undefined,
              margin: 0,
              background: 'white',
              borderLeft: sheet ? 'none' : '1px solid var(--color-border)',
              borderTop: sheet ? '1px solid var(--color-border)' : undefined,
              borderRadius: sheet ? '16px 16px 0 0' : undefined,
              boxShadow: sheet
                ? '0 -8px 40px rgba(0,0,0,0.12)'
                : isEmbedded
                  ? '-4px 0 24px rgba(0,0,0,0.06)'
                  : 'var(--shadow-panel)',
              zIndex: zPanel,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              paddingBottom: sheet ? 'env(safe-area-inset-bottom, 0px)' : undefined,
            }}
          >
            {sheet && (
              <div
                aria-hidden
                style={{
                  alignSelf: 'center',
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  background: 'var(--color-border)',
                  marginTop: 10,
                  marginBottom: 4,
                  flexShrink: 0,
                }}
              />
            )}
            {/* Header */}
            <div
              style={{
                padding: sheet ? '16px 18px 14px' : '24px 24px 20px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
                flexShrink: 0,
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: sheet ? 'clamp(1.25rem, 4.5vw, 1.5rem)' : '26px',
                  lineHeight: 1.15,
                  color: 'var(--color-ink)',
                  letterSpacing: '-0.02em',
                }}
              >
                {node.name}
              </h2>
              <button
                onClick={onClose}
                className="btn-ghost"
                aria-label="Close panel"
                style={{ padding: '8px', flexShrink: 0, marginTop: sheet ? 0 : '2px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                padding: sheet ? '18px' : '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: sheet ? 18 : 24,
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: sheet ? '15px' : '14px',
                  lineHeight: 1.7,
                  color: 'var(--color-ink)',
                }}
              >
                {node.description}
              </p>

              {node.salaryRange && (
                <div>
                  <SectionLabel>Salary Range</SectionLabel>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      background: 'var(--color-paper)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      marginTop: '8px',
                    }}
                  >
                    <DollarSign size={13} color="var(--color-accent)" />
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '13px',
                        color: 'var(--color-ink)',
                        fontWeight: 500,
                      }}
                    >
                      {node.salaryRange}
                    </span>
                  </div>
                </div>
              )}

              {node.skills && node.skills.length > 0 && (
                <div>
                  <SectionLabel>Key Skills</SectionLabel>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginTop: '10px',
                    }}
                  >
                    {node.skills.map((skill) => (
                      <span key={skill} className="skill-pill">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {node.roadmap && (
                <div>
                  <SectionLabel>How to Get There</SectionLabel>
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: sheet ? '14px' : '13.5px',
                      lineHeight: 1.75,
                      color: 'var(--color-ink)',
                      marginTop: '10px',
                      padding: '14px',
                      background: 'var(--color-paper)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      borderLeft: '3px solid var(--color-accent)',
                    }}
                  >
                    {node.roadmap}
                  </p>
                </div>
              )}

              <PathDetailSections node={node} sheet={sheet} />

              {node.children.length === 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--color-border)',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--color-accent)',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: 'var(--color-ink-muted)',
                    }}
                  >
                    Terminal path — no further branches
                  </span>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'block',
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--color-ink-muted)',
      }}
    >
      {children}
    </span>
  );
}

const PATH_DETAIL_SECTIONS: Array<{
  key: keyof import('@/lib/types').CareerNode;
  label: string;
}> = [
  { key: 'what_it_is', label: 'What It Is' },
  { key: 'entry_route', label: 'Entry Route' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'salary_range', label: 'Salary Range' },
  { key: 'work_lifestyle', label: 'Work & Lifestyle' },
  { key: 'growth_and_progression', label: 'Growth' },
  { key: 'demand_and_outlook', label: 'Demand' },
  { key: 'who_its_not_for', label: "Not For" },
  { key: 'honest_caveat', label: 'Caveat' },
];

function PathDetailSections({ node, sheet }: { node: import('@/lib/types').CareerNode; sheet: boolean }) {
  const rows = PATH_DETAIL_SECTIONS.filter(({ key }) => {
    const val = node[key as keyof import('@/lib/types').CareerNode];
    return Array.isArray(val) && (val as string[]).length > 0;
  });
  if (rows.length === 0) return null;

  return (
    <div>
      <SectionLabel>Path Details</SectionLabel>
      <div
        style={{
          marginTop: '8px',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          overflow: 'hidden',
          background: 'var(--color-paper)',
        }}
      >
        {rows.map(({ key, label }, idx) => {
          const items = node[key as keyof import('@/lib/types').CareerNode] as string[];
          return (
            <div
              key={key}
              style={{
                display: 'grid',
                gridTemplateColumns: 'min(34%, 120px) 1fr',
                borderBottom: idx < rows.length - 1 ? '1px solid var(--color-border)' : undefined,
              }}
            >
              <div
                style={{
                  padding: '7px 10px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--color-ink-muted)',
                  lineHeight: 1.4,
                  borderRight: '1px solid var(--color-border)',
                }}
              >
                {label}
              </div>
              <div
                style={{
                  padding: '7px 10px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: sheet ? '13.5px' : '13px',
                  lineHeight: 1.55,
                  color: 'var(--color-ink)',
                }}
              >
                {items.length === 1 ? (
                  items[0]
                ) : (
                  <ul style={{ margin: 0, padding: '0 0 0 14px' }}>
                    {items.map((item, i) => (
                      <li key={i} style={{ marginBottom: i < items.length - 1 ? '2px' : 0 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
