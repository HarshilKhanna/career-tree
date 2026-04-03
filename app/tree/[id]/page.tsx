'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { CareerNode, CareerTree } from '@/lib/types';
import Header from '@/components/Header';
import InfoPanel from '@/components/InfoPanel';
import OrientationToggle from '@/components/OrientationToggle';
import { sortTreeByAnalytics } from '@/lib/analyticsUtils';

// SSR=false: React Flow / dagre layout run in the browser
const TreeViewer = dynamic(() => import('@/components/TreeViewer'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        color: 'var(--color-ink-muted)',
      }}
    >
      Loading tree…
    </div>
  ),
});

interface FlatListProps {
  node: CareerNode;
  depth?: number;
}

function FlatList({ node, depth = 0 }: FlatListProps) {
  return (
    <li>
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '14px',
          color: depth === 0 ? 'var(--color-ink)' : 'var(--color-ink-muted)',
          fontWeight: depth === 0 ? 600 : 400,
        }}
      >
        {node.name}
      </span>
      {node.children.length > 0 && (
        <ul style={{ paddingLeft: '20px', borderLeft: '1px solid var(--color-border)', marginLeft: '8px', marginTop: '4px' }}>
          {node.children.map((child) => (
            <FlatList key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function TreePage({ params }: { params: Promise<{ id: string }> }) {
  const [tree, setTree] = useState<CareerTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<CareerNode | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [dimensions, setDimensions] = useState({ w: 1200, h: 800 });
  const [treeId, setTreeId] = useState<string>('');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const zoomInRef = useRef<(() => void) | null>(null);
  const zoomOutRef = useRef<(() => void) | null>(null);
  const zoomResetRef = useRef<(() => void) | null>(null);

  // Resolve params
  useEffect(() => {
    params.then(({ id }) => setTreeId(id));
  }, [params]);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Measure container
  useEffect(() => {
    const update = () => {
      setDimensions({ w: window.innerWidth, h: window.innerHeight - 56 });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Load orientation
  useEffect(() => {
    const saved = localStorage.getItem('careertree_orientation');
    if (saved === 'horizontal' || saved === 'vertical') {
      setOrientation(saved);
    }
  }, []);

  const handleOrientationChange = useCallback((o: 'horizontal' | 'vertical') => {
    setOrientation(o);
    localStorage.setItem('careertree_orientation', o);
  }, []);

  // Load tree + analytics once per navigation (treeId). Sorted order is fixed for this visit —
  // clicks/expands do not refetch or reshuffle the layout mid-session (next visit picks up new analytics).
  useEffect(() => {
    if (!treeId) return;
    
    Promise.all([
      fetch(`/api/trees/${treeId}`).then(r => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      }),
      fetch(`/api/analytics/${treeId}`).then(r => {
        if (!r.ok) return undefined;
        return r.json();
      }).catch(() => undefined)
    ])
      .then(([treeData, analyticsData]) => {
        const sortedTree = {
          ...treeData,
          root: sortTreeByAnalytics(treeData.root, analyticsData)
        };
        
        setTree(sortedTree);
        setLoading(false);
        
        // Track view
        fetch(`/api/analytics/${treeId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'view' })
        }).catch(() => null);
      })
      .catch(() => {
        setError('Could not load this tree. It may not exist.');
        setLoading(false);
      });
  }, [treeId]);

  const handleNodeClick = useCallback((node: CareerNode) => {
    setSelectedNode(node);
    if (!treeId) return;
    fetch(`/api/analytics/${treeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'click', nodeId: node.id })
    }).catch(() => null);
  }, [treeId]);

  const handleNodeExpand = useCallback((node: CareerNode) => {
    if (!treeId) return;
    fetch(`/api/analytics/${treeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'expand', nodeId: node.id })
    }).catch(() => null);
  }, [treeId]);

  const registerZoomIn = useCallback((fn: () => void) => { zoomInRef.current = fn; }, []);
  const registerZoomOut = useCallback((fn: () => void) => { zoomOutRef.current = fn; }, []);
  const registerZoomReset = useCallback((fn: () => void) => { zoomResetRef.current = fn; }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100dvh',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: 'var(--color-ink-muted)',
        }}
      >
        Loading…
      </div>
    );
  }

  if (error || !tree) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100dvh',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-muted)' }}>
          {error || 'Tree not found.'}
        </p>
      </div>
    );
  }

  const breadcrumb = `${tree.degree}${tree.stream ? ` · ${tree.stream}` : ''} · ${tree.country}`;

  return (
    <>
      <Header
        breadcrumb={breadcrumb}
        showBack
        showZoom={!isMobile}
        onZoomIn={() => zoomInRef.current?.()}
        onZoomOut={() => zoomOutRef.current?.()}
        onZoomReset={() => zoomResetRef.current?.()}
        centerContent={!isMobile && (
          <OrientationToggle orientation={orientation} onChange={handleOrientationChange} />
        )}
      />

      <main
        style={{
          paddingTop: '56px',
          height: '100dvh',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {isMobile ? (
          /* Mobile fallback */
          <div style={{ padding: '32px 24px', overflowY: 'auto', height: '100%' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '6px',
                marginBottom: '24px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: '#92400E',
              }}
            >
              Best viewed on desktop — showing simplified list view
            </div>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tree.root.children.map((child) => (
                <FlatList key={child.id} node={child} />
              ))}
            </ul>
          </div>
        ) : (
          /* Full tree viewer */
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <TreeViewer
              root={tree.root}
              orientation={orientation}
              onNodeClick={handleNodeClick}
              onNodeExpand={handleNodeExpand}
              onZoomIn={registerZoomIn}
              onZoomOut={registerZoomOut}
              onZoomReset={registerZoomReset}
              containerWidth={dimensions.w}
              containerHeight={dimensions.h}
              selectedNodeId={selectedNode?.id ?? null}
            />
          </div>
        )}

        <InfoPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
      </main>
    </>
  );
}
