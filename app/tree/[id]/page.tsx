'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { CareerNode, CareerTree } from '@/lib/types';
import Header from '@/components/Header';
import InfoPanel from '@/components/InfoPanel';
import OrientationToggle from '@/components/OrientationToggle';
import { sortTreeByAnalytics } from '@/lib/analyticsUtils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

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

export default function TreePage({ params }: { params: Promise<{ id: string }> }) {
  const [tree, setTree] = useState<CareerTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<CareerNode | null>(null);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
  const [treeId, setTreeId] = useState<string>('');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const zoomInRef = useRef<(() => void) | null>(null);
  const zoomOutRef = useRef<(() => void) | null>(null);
  const zoomResetRef = useRef<(() => void) | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const minimalHeader = useMediaQuery('(max-width: 768px)');
  const expandThenPanel = useMediaQuery('(max-width: 1023px)');
  const orientationLabelsInHeader = useMediaQuery('(min-width: 520px)');
  /** Zoom (+/−/home) only on desktop — hidden on mobile and tablet. */
  const showHeaderZoom = useMediaQuery('(min-width: 1024px)');

  useEffect(() => {
    params.then(({ id }) => setTreeId(id));
  }, [params]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setDimensions({
        w: Math.max(160, Math.floor(cr.width)),
        h: Math.max(160, Math.floor(cr.height)),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [tree]);

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

  useEffect(() => {
    if (!treeId) return;

    Promise.all([
      fetch(`/api/trees/${treeId}`).then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      }),
      fetch(`/api/analytics/${treeId}`)
        .then((r) => {
          if (!r.ok) return undefined;
          return r.json();
        })
        .catch(() => undefined),
    ])
      .then(([treeData, analyticsData]) => {
        const sortedTree = {
          ...treeData,
          root: sortTreeByAnalytics(treeData.root, analyticsData),
        };

        setTree(sortedTree);
        setLoading(false);

        fetch(`/api/analytics/${treeId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'view' }),
        }).catch(() => null);
      })
      .catch(() => {
        setError('Could not load this tree. It may not exist.');
        setLoading(false);
      });
  }, [treeId]);

  const handleNodeClick = useCallback(
    (node: CareerNode) => {
      setSelectedNode(node);
      if (!treeId) return;
      fetch(`/api/analytics/${treeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'click', nodeId: node.id }),
      }).catch(() => null);
    },
    [treeId]
  );

  const handleNodeExpand = useCallback(
    (node: CareerNode) => {
      if (!treeId) return;
      fetch(`/api/analytics/${treeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'expand', nodeId: node.id }),
      }).catch(() => null);
    },
    [treeId]
  );

  const registerZoomIn = useCallback((fn: () => void) => {
    zoomInRef.current = fn;
  }, []);
  const registerZoomOut = useCallback((fn: () => void) => {
    zoomOutRef.current = fn;
  }, []);
  const registerZoomReset = useCallback((fn: () => void) => {
    zoomResetRef.current = fn;
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNode(null);
  }, []);

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
          padding: '24px',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            color: 'var(--color-ink-muted)',
            textAlign: 'center',
            maxWidth: '360px',
          }}
        >
          {error || 'Tree not found.'}
        </p>
      </div>
    );
  }

  const breadcrumb = `${tree.degree}${tree.stream ? ` · ${tree.stream}` : ''} · ${tree.country}`;

  return (
    <>
      <Header
        mode={minimalHeader ? 'minimal' : 'full'}
        breadcrumb={breadcrumb}
        showBack
        showZoom={showHeaderZoom}
        showAdminLink
        compactToolbar={minimalHeader}
        onZoomIn={() => zoomInRef.current?.()}
        onZoomOut={() => zoomOutRef.current?.()}
        onZoomReset={() => zoomResetRef.current?.()}
        centerContent={
          minimalHeader ? undefined : (
            <OrientationToggle
              orientation={orientation}
              onChange={handleOrientationChange}
              showLabels={orientationLabelsInHeader}
            />
          )
        }
        trailingToolbarStart={
          minimalHeader ? (
            <OrientationToggle
              orientation={orientation}
              onChange={handleOrientationChange}
              showLabels={false}
            />
          ) : undefined
        }
      />

      <main
        style={{
          paddingTop: '56px',
          height: '100dvh',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        <div
          ref={canvasRef}
          style={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            width: '100%',
            position: 'relative',
          }}
        >
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
            clickMode={expandThenPanel ? 'expandThenPanel' : 'default'}
            onClearSelection={clearSelection}
          />
        </div>

        <InfoPanel node={selectedNode} onClose={clearSelection} />
      </main>
    </>
  );
}
