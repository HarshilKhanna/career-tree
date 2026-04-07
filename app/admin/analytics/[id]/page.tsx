'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { CareerTree, TreeAnalytics, scoreNode } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';

const TreeViewer = dynamic(() => import('@/components/TreeViewer'), { ssr: false });

export default function AdminAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [treeId, setTreeId] = useState<string>('');
  const [tree, setTree] = useState<CareerTree | null>(null);
  const [analytics, setAnalytics] = useState<TreeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    params.then(({ id }) => setTreeId(id));
  }, [params]);

  useEffect(() => {
    if (!treeId) return;

    Promise.all([
      fetch(`/api/trees/${treeId}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/analytics/${treeId}`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([treeData, analyticsData]) => {
        setTree(treeData);
        if (analyticsData) setAnalytics(analyticsData);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [treeId]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setSize({
        w: Math.max(200, Math.floor(cr.width)),
        h: Math.max(200, Math.floor(cr.height)),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [tree]);

  const nodeScores = useMemo(() => {
    if (!analytics || !analytics.nodes) return {};
    const scores: Record<string, number> = {};
    for (const [id, data] of Object.entries(analytics.nodes)) {
      scores[id] = scoreNode(data);
    }
    return scores;
  }, [analytics]);

  if (loading) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: 'var(--color-ink-muted)',
        }}
      >
        Loading analytics...
      </div>
    );
  }
  if (!tree) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: '#B91C1C',
        }}
      >
        Tree not found.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: 'clamp(12px, 2vw, 16px) clamp(14px, 3vw, 24px)',
          borderBottom: '1px solid var(--color-border)',
          background: 'white',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          zIndex: 10,
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
          <Link
            href="/admin"
            style={{
              color: 'var(--color-ink-muted)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              fontFamily: 'var(--font-sans)',
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={14} /> Back
          </Link>
          <div
            style={{ width: '1px', height: '16px', background: 'var(--color-border)', flexShrink: 0 }}
          />
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(16px, 3.5vw, 18px)',
              lineHeight: 1.25,
            }}
          >
            Analytics: {tree.degree}
          </h2>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '16px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-ink-muted)',
            flexShrink: 0,
          }}
        >
          <div>
            Views:{' '}
            <strong style={{ color: 'var(--color-ink)', fontWeight: 600 }}>
              {analytics?.treeViews || 0}
            </strong>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px 20px',
          padding: 'clamp(12px, 2vw, 16px) clamp(14px, 3vw, 24px)',
          background: 'var(--color-paper)',
          borderBottom: '1px solid var(--color-border)',
          alignItems: 'center',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span style={{ color: 'var(--color-ink-muted)', flexShrink: 0 }}>Heatmap:</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 16px' }}>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                background: '#FEF2F2',
                border: '2px solid #C03020',
                borderRadius: '3px',
                flexShrink: 0,
              }}
            />
            High (&gt; 20)
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                background: '#FFF7ED',
                border: '2px solid #E07820',
                borderRadius: '3px',
                flexShrink: 0,
              }}
            />
            Medium (&gt; 5)
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                background: '#FFFBEB',
                border: '2px solid #F0C040',
                borderRadius: '3px',
                flexShrink: 0,
              }}
            />
            Low (&gt; 0)
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                background: 'white',
                border: '1px solid var(--color-border)',
                borderRadius: '3px',
                flexShrink: 0,
              }}
            />
            None
          </div>
        </div>
      </div>

      <div ref={canvasRef} style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <TreeViewer
          root={tree.root}
          orientation={'horizontal'}
          onNodeClick={() => {}}
          containerWidth={size.w}
          containerHeight={size.h}
          nodeScores={nodeScores}
        />
      </div>
    </div>
  );
}
