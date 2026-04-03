'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { Node } from '@xyflow/react';
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { CareerNode } from '@/lib/types';
import { toReactFlowElements } from '@/lib/toReactFlowElements';
import { CareerNodeCard, type CareerNodeData } from '@/components/NodeCard';
import { SmoothCareerEdge } from '@/components/SmoothCareerEdge';

const nodeTypes = { careerNode: CareerNodeCard };
const edgeTypes = { smoothCareer: SmoothCareerEdge };

interface TreeViewerProps {
  root: CareerNode;
  onNodeClick: (node: CareerNode) => void;
  onNodeExpand?: (node: CareerNode) => void;
  onZoomIn?: (fn: () => void) => void;
  onZoomOut?: (fn: () => void) => void;
  onZoomReset?: (fn: () => void) => void;
  containerWidth: number;
  containerHeight: number;
  orientation?: 'horizontal' | 'vertical';
  nodeScores?: Record<string, number>;
  selectedNodeId?: string | null;
}

function buildNodeMap(node: CareerNode, map = new Map<string, CareerNode>()): Map<string, CareerNode> {
  map.set(node.id, node);
  node.children.forEach((c) => buildNodeMap(c, map));
  return map;
}

/** Initial collapse: all nodes at depth >= 2 start collapsed. */
function buildInitialCollapsed(node: CareerNode, depth = 0): Set<string> {
  const result = new Set<string>();
  if (depth >= 2) {
    result.add(node.id);
  }
  for (const child of node.children) {
    const childSet = buildInitialCollapsed(child, depth + 1);
    childSet.forEach((id) => result.add(id));
  }
  return result;
}

function getVisibleNodeIds(root: CareerNode, collapsed: Set<string>): Set<string> {
  const ids = new Set<string>();
  function walk(n: CareerNode) {
    ids.add(n.id);
    if (!collapsed.has(n.id)) {
      n.children.forEach(walk);
    }
  }
  walk(root);
  return ids;
}

function FitViewOnChange({
  orientation,
  rootId,
}: {
  orientation: 'horizontal' | 'vertical';
  rootId: string;
}) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        void fitView({
          padding: 0.2,
          duration: 480,
          interpolate: 'smooth',
        });
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [orientation, rootId, fitView]);

  return null;
}

function ZoomBridge({
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: {
  onZoomIn?: (fn: () => void) => void;
  onZoomOut?: (fn: () => void) => void;
  onZoomReset?: (fn: () => void) => void;
}) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  useEffect(() => {
    if (onZoomIn) onZoomIn(() => zoomIn({ duration: 200 }));
  }, [onZoomIn, zoomIn]);

  useEffect(() => {
    if (onZoomOut) onZoomOut(() => zoomOut({ duration: 200 }));
  }, [onZoomOut, zoomOut]);

  useEffect(() => {
    if (onZoomReset) onZoomReset(() => fitView({ padding: 0.2, duration: 480, interpolate: 'smooth' }));
  }, [onZoomReset, fitView]);

  return null;
}

function TreeFlowInner({
  root,
  orientation,
  collapsedIds,
  onNodeClick,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  nodeScores,
  selectedNodeId,
  toggleNode,
}: {
  root: CareerNode;
  orientation: 'horizontal' | 'vertical';
  collapsedIds: Set<string>;
  onNodeClick: (node: CareerNode) => void;
  onZoomIn?: (fn: () => void) => void;
  onZoomOut?: (fn: () => void) => void;
  onZoomReset?: (fn: () => void) => void;
  nodeScores?: Record<string, number>;
  selectedNodeId?: string | null;
  toggleNode: (nodeId: string) => void;
}) {
  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => toReactFlowElements(root, orientation),
    [root, orientation]
  );

  const visibleIds = useMemo(
    () => getVisibleNodeIds(root, collapsedIds),
    [root, collapsedIds]
  );

  const visibleNodes = useMemo(() => {
    return layoutNodes
      .filter((n) => visibleIds.has(n.id))
      .map((n) => ({
        ...n,
        style: {
          transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
        },
        data: {
          ...n.data,
          isCollapsed: collapsedIds.has(n.id),
          onNodeClick,
          toggleNode,
          selectedNodeId: selectedNodeId ?? null,
          nodeScores,
        },
      }));
  }, [layoutNodes, visibleIds, collapsedIds, onNodeClick, toggleNode, selectedNodeId, nodeScores]);

  const visibleEdges = useMemo(
    () =>
      layoutEdges.filter(
        (e) => visibleIds.has(e.source) && visibleIds.has(e.target)
      ),
    [layoutEdges, visibleIds]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(visibleNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(visibleEdges);

  useEffect(() => {
    setNodes(visibleNodes);
  }, [visibleNodes, setNodes]);

  useEffect(() => {
    setEdges(visibleEdges);
  }, [visibleEdges, setEdges]);

  const handleNodeClick = useCallback(
    (_event: ReactMouseEvent, node: Node<CareerNodeData>) => {
      const d = node.data;
      d.onNodeClick(d.node);
      if (d.hasChildren) d.toggleNode(d.node.id);
    },
    []
  );

  return (
    <>
      <ReactFlow
        style={{ width: '100%', height: '100%' }}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, duration: 480, interpolate: 'smooth' }}
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background color="#E8E4DC" gap={24} size={1} variant={BackgroundVariant.Dots} />
        <FitViewOnChange orientation={orientation} rootId={root.id} />
        <ZoomBridge
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onZoomReset={onZoomReset}
        />
      </ReactFlow>
    </>
  );
}

export default function TreeViewer({
  root,
  onNodeClick,
  onNodeExpand,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  containerWidth,
  containerHeight,
  orientation = 'horizontal',
  nodeScores,
  selectedNodeId,
}: TreeViewerProps) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() =>
    buildInitialCollapsed(root)
  );

  const nodeMap = useMemo(() => buildNodeMap(root), [root]);

  useEffect(() => {
    setCollapsedIds(buildInitialCollapsed(root));
  }, [root.id]);

  const toggleNode = useCallback(
    (nodeId: string) => {
      setCollapsedIds((prev) => {
        const next = new Set(prev);
        if (next.has(nodeId)) {
          next.delete(nodeId);
          const node = nodeMap.get(nodeId);
          if (node && onNodeExpand) {
            onNodeExpand(node);
          }
        } else {
          next.add(nodeId);
        }
        return next;
      });
    },
    [onNodeExpand, nodeMap]
  );

  return (
    <div
      className="tree-canvas"
      style={{ width: containerWidth, height: containerHeight }}
    >
      <ReactFlowProvider>
        <div style={{ width: '100%', height: '100%' }}>
          <TreeFlowInner
            root={root}
            orientation={orientation}
            collapsedIds={collapsedIds}
            onNodeClick={onNodeClick}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onZoomReset={onZoomReset}
            nodeScores={nodeScores}
            selectedNodeId={selectedNodeId}
            toggleNode={toggleNode}
          />
        </div>
      </ReactFlowProvider>
    </div>
  );
}
