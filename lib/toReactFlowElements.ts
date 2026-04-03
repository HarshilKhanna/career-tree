import dagre from 'dagre';
import type { Edge, Node } from '@xyflow/react';
import { CareerNode } from './types';

export type CareerNodeFlowData = {
  label: string;
  node: CareerNode;
  depth: number;
  hasChildren: boolean;
  isCollapsed: boolean;
  orientation: 'horizontal' | 'vertical';
  dagreHalfHeight: number;
};

/** Max text width inside card (max-width 220 − horizontal padding). */
const TEXT_INNER_W = 220 - 32;

/**
 * Approximate rendered height so dagre spacing matches multi-line labels.
 * (Card padding 12+12, line-height 1.4, chevron row when applicable.)
 */
function estimateDagreHeight(name: string, depth: number, hasChildren: boolean): number {
  const isRoot = depth === 0;
  const fontPx = isRoot ? 15 : 13;
  const lineHeight = 1.4;
  const avgCharW = fontPx * 0.52;
  const charsPerLine = Math.max(8, Math.floor(TEXT_INNER_W / avgCharW));
  const textLines = Math.max(1, Math.ceil(name.length / charsPerLine));
  const textBlockH = textLines * fontPx * lineHeight;
  let footer = 0;
  if (hasChildren && !isRoot) {
    footer += 8 + 14;
  }
  const paddingY = 24;
  const h = Math.ceil(textBlockH + footer + paddingY + 8);
  return Math.max(isRoot ? 52 : 64, h);
}

export function toReactFlowElements(
  root: CareerNode,
  orientation: 'horizontal' | 'vertical'
): { nodes: Node<CareerNodeFlowData>[]; edges: Edge[] } {
  const nodes: Node<CareerNodeFlowData>[] = [];
  const edges: Edge[] = [];
  const dagreGraph = new dagre.graphlib.Graph();

  const nodesep = root.children.length > 8 ? 56 : 48;

  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: orientation === 'horizontal' ? 'LR' : 'TB',
    nodesep,
    ranksep: 96,
    marginx: 48,
    marginy: 48,
  });

  function walk(node: CareerNode, parentId: string | null, depth: number) {
    const hasChildren = node.children.length > 0;
    const h = estimateDagreHeight(node.name, depth, hasChildren);
    dagreGraph.setNode(node.id, { width: 200, height: h });
    nodes.push({
      id: node.id,
      type: 'careerNode',
      position: { x: 0, y: 0 },
      data: {
        label: node.name,
        node,
        depth,
        hasChildren,
        isCollapsed: false,
        orientation,
        dagreHalfHeight: h / 2,
      },
    });
    if (parentId) {
      dagreGraph.setEdge(parentId, node.id);
      edges.push({
        id: `${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        type: 'smoothCareer',
        sourceHandle: orientation === 'horizontal' ? 'right' : 'bottom',
        targetHandle: orientation === 'horizontal' ? 'left' : 'top',
      });
    }
    node.children.forEach((child) => walk(child, node.id, depth + 1));
  }

  walk(root, null, 0);
  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const pos = dagreGraph.node(node.id) as { x: number; y: number };
    const halfH = node.data.dagreHalfHeight;
    node.position = { x: pos.x - 100, y: pos.y - halfH };
  });

  return { nodes, edges };
}
