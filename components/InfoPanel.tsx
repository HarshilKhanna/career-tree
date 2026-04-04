'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign } from 'lucide-react';
import { CareerNode } from '@/lib/types';

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

  return (
    <AnimatePresence>
      {node && (
        <>
          {/* Panel */}
          <motion.aside
            key="panel"
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="will-change-transform"
            style={{
              position: isEmbedded ? 'absolute' : 'fixed',
              top: isEmbedded ? 0 : '56px',
              right: 0,
              bottom: 0,
              width: isEmbedded ? 'min(380px, 100%)' : '380px',
              maxWidth: isEmbedded ? '100%' : undefined,
              background: 'white',
              borderLeft: '1px solid var(--color-border)',
              boxShadow: isEmbedded ? '-4px 0 24px rgba(0,0,0,0.06)' : 'var(--shadow-panel)',
              zIndex: isEmbedded ? 30 : 200,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '24px 24px 20px',
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
                  fontSize: '26px',
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
                style={{ padding: '4px', flexShrink: 0, marginTop: '2px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              }}
            >
              {/* Description */}
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  lineHeight: 1.7,
                  color: 'var(--color-ink)',
                }}
              >
                {node.description}
              </p>

              {/* Salary */}
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

              {/* Skills */}
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

              {/* Roadmap */}
              {node.roadmap && (
                <div>
                  <SectionLabel>How to Get There</SectionLabel>
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '13.5px',
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

              {/* Terminal indicator */}
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
