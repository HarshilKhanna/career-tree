'use client';

import { useEffect, useState, useMemo } from 'react';
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

  useEffect(() => {
    params.then(({ id }) => setTreeId(id));
  }, [params]);

  useEffect(() => {
    if (!treeId) return;

    Promise.all([
      fetch(`/api/trees/${treeId}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/analytics/${treeId}`).then(r => r.ok ? r.json() : null)
    ]).then(([treeData, analyticsData]) => {
      setTree(treeData);
      if (analyticsData) setAnalytics(analyticsData);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

  }, [treeId]);

  const nodeScores = useMemo(() => {
    if (!analytics || !analytics.nodes) return {};
    const scores: Record<string, number> = {};
    for (const [id, data] of Object.entries(analytics.nodes)) {
      scores[id] = scoreNode(data);
    }
    return scores;
  }, [analytics]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-ink-muted)' }}>Loading analytics...</div>;
  if (!tree) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#B91C1C' }}>Tree not found.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      {/* Top Bar */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin" style={{ color: 'var(--color-ink-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <div style={{ width: '1px', height: '16px', background: 'var(--color-border)' }} />
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '18px' }}>Analytics & Heatmap: {tree.degree} in {tree.country}</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)' }}>
          <div>Views: <strong style={{ color: 'var(--color-ink)', fontWeight: 600 }}>{analytics?.treeViews || 0}</strong></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', padding: '16px 24px', background: 'var(--color-paper)', borderBottom: '1px solid var(--color-border)', alignItems: 'center', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
        <span style={{ color: 'var(--color-ink-muted)' }}>Heatmap Legend:</span>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}><div style={{ width: '12px', height: '12px', background: '#FEF2F2', border: '2px solid #C03020', borderRadius: '3px' }}/> High Engagement (Score &gt; 20)</div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}><div style={{ width: '12px', height: '12px', background: '#FFF7ED', border: '2px solid #E07820', borderRadius: '3px' }}/> Medium Engagement (Score &gt; 5)</div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}><div style={{ width: '12px', height: '12px', background: '#FFFBEB', border: '2px solid #F0C040', borderRadius: '3px' }}/> Low Engagement (Score &gt; 0)</div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}><div style={{ width: '12px', height: '12px', background: 'white', border: '1px solid var(--color-border)', borderRadius: '3px' }}/> No Engagement</div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <TreeViewer
          root={tree.root}
          orientation={'horizontal'}
          onNodeClick={() => {}}
          containerWidth={typeof window !== 'undefined' ? window.innerWidth : 1000}
          containerHeight={typeof window !== 'undefined' ? window.innerHeight - 120 : 800}
          nodeScores={nodeScores}
        />
      </div>
    </div>
  );
}
