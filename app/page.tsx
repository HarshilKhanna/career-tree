'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import ProfileLandingFlow from '@/components/ProfileLandingFlow';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: 'easeOut' as const, delay: i * 0.15 },
  }),
};

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(24px, 6vw, 48px) clamp(16px, 4vw, 24px)',
        paddingBottom: 'max(clamp(24px, 6vw, 48px), env(safe-area-inset-bottom, 0px))',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(45, 106, 79, 0.04) 0%, transparent 60%),
            radial-gradient(circle at 80% 20%, rgba(45, 106, 79, 0.03) 0%, transparent 50%)`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 32,
          maxWidth: 600,
          width: '100%',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="will-change-transform"
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: '100px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--color-ink-muted)',
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: 'var(--color-accent)',
              }}
            />
            Career Path Visualizer
          </span>
        </motion.div>

        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="will-change-transform"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(36px, 6vw, 60px)',
            lineHeight: 1.1,
            color: 'var(--color-ink)',
            letterSpacing: '-0.03em',
            margin: 0,
          }}
        >
          Where does your degree{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--color-accent)' }}>
            take you?
          </em>
        </motion.h1>

        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="will-change-transform"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '17px',
            lineHeight: 1.65,
            color: 'var(--color-ink-muted)',
            maxWidth: '440px',
            margin: 0,
          }}
        >
          Explore every career path available to you — from first job to career peak — in an
          interactive, collapsible tree.
        </motion.p>

        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="will-change-transform"
          style={{ width: '100%', maxWidth: 560 }}
        >
          <ProfileLandingFlow />
        </motion.div>
      </div>

      <Link
        href="/admin"
        className="btn-secondary"
        style={{
          position: 'fixed',
          bottom: 'max(16px, env(safe-area-inset-bottom, 0px))',
          left: 'max(16px, env(safe-area-inset-left, 0px))',
          padding: '8px 16px',
          fontSize: '12px',
          textDecoration: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          maxWidth: 'calc(100vw - 32px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px))',
        }}
      >
        <Settings size={14} />
        Manage Content
      </Link>
    </main>
  );
}
