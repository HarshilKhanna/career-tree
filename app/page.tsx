'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Settings } from 'lucide-react';
import SteppedSelector from '@/components/SteppedSelector';
import { EducationLevel } from '@/lib/treeConfig';
import { buildTreeId } from '@/lib/treeUtils';
import { TreeMetadata } from '@/lib/types';
import Link from 'next/link';
import { useEffect } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: 'easeOut' as const, delay: i * 0.15 },
  }),
};

export default function HomePage() {
  const router = useRouter();
  const [country, setCountry] = useState('');
  const [level, setLevel] = useState<EducationLevel | ''>('');
  const [degree, setDegree] = useState('');
  const [stream, setStream] = useState<string | null | undefined>(undefined);
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'not-found'>('idle');
  const [treeData, setTreeData] = useState<TreeMetadata[]>([]);

  useEffect(() => {
    fetch('/api/trees')
      .then(r => r.json())
      .then((data: TreeMetadata[]) => setTreeData(data))
      .catch(console.error);
  }, []);

  const isComplete = Boolean(country && level && degree && (stream !== undefined));

  const handleExplore = async () => {
    if (!isComplete) return;
    setStatus('loading');
    
    // buildTreeId to get id, then fetch tree
    const targetId = buildTreeId(level as string, degree, stream as string | null, country as string);
    
    try {
      const res = await fetch(`/api/trees/${targetId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      // If we find it, proceed
      router.push(`/tree/${targetId}`);
    } catch {
      setStatus('not-found');
    }
  };

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
      {/* Subtle background texture */}
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

      {/* Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px',
          maxWidth: '600px',
          width: '100%',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Eyebrow */}
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

        {/* Heading */}
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
          }}
        >
          Where does your degree{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--color-accent)' }}>
            take you?
          </em>
        </motion.h1>

        {/* Subheading */}
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
          }}
        >
          Explore every career path available to you — from first job to career
          peak — in an interactive, collapsible tree.
        </motion.p>

        {/* Selectors */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="will-change-transform"
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <SteppedSelector
            country={country}
            level={level as any}
            degree={degree}
            stream={stream}
            treeData={treeData}
            onCountryChange={(v) => { setCountry(v); setStatus('idle'); }}
            onLevelChange={(v) => { setLevel(v); setStatus('idle'); }}
            onDegreeChange={(v) => { setDegree(v); setStatus('idle'); }}
            onStreamChange={(v) => { setStream(v); setStatus('idle'); }}
          />
        </motion.div>

        {/* CTA */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: 0.1 }}
              style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}
            >
              <button
                className="btn-primary"
                onClick={handleExplore}
                disabled={status === 'loading'}
                id="explore-btn"
                style={{
                  fontSize: '16px',
                  padding: '14px 36px',
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                }}
              >
                {status === 'loading' ? 'Searching…' : 'Explore Paths'}
                {status !== 'loading' && <ArrowRight size={16} />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Not-found message */}
        {status === 'not-found' && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: '#B45309',
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '6px',
              padding: '10px 16px',
            }}
          >
            This path isn&apos;t mapped yet. Check back soon.
          </motion.p>
        )}
      </div>

      {/* Admin link */}
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
