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
  /** Narrow canvas: slightly smaller cards and tighter dagre spacing. */
  compact: boolean;
};

function textInnerWidth(compact: boolean) {
  const cardMax = compact ? 200 : 220;
  return cardMax - (compact ? 24 : 32);
}

/**
 * Approximate rendered height so dagre spacing matches multi-line labels.
 * (Card padding 12+12, line-height 1.4, chevron row when applicable.)
 */
function estimateDagreHeight(
  name: string,
  depth: number,
  hasChildren: boolean,
  compact: boolean
): number {
  const isRoot = depth === 0;
  const fontPx = isRoot ? (compact ? 14 : 15) : compact ? 12 : 13;
  const lineHeight = 1.4;
  const avgCharW = fontPx * 0.52;
  const innerW = textInnerWidth(compact);
  const charsPerLine = Math.max(8, Math.floor(innerW / avgCharW));
  const textLines = Math.max(1, Math.ceil(name.length / charsPerLine));
  const textBlockH = textLines * fontPx * lineHeight;
  let footer = 0;
  if (hasChildren && !isRoot) {
    footer += 8 + 14;
  }
  const paddingY = compact ? 20 : 24;
  const h = Math.ceil(textBlockH + footer + paddingY + 8);
  return Math.max(isRoot ? (compact ? 48 : 52) : compact ? 58 : 64, h);
}

export function toReactFlowElements(
  root: CareerNode,
  orientation: 'horizontal' | 'vertical',
  compact = false
): { nodes: Node<CareerNodeFlowData>[]; edges: Edge[] } {
  const nodes: Node<CareerNodeFlowData>[] = [];
  const edges: Edge[] = [];
  const dagreGraph = new dagre.graphlib.Graph();

  const dagreNodeWidth = compact ? 180 : 200;
  const halfW = dagreNodeWidth / 2;
  const nodesep = compact
    ? root.children.length > 8
      ? 48
      : 42
    : root.children.length > 8
      ? 56
      : 48;

  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: orientation === 'horizontal' ? 'LR' : 'TB',
    nodesep,
    ranksep: compact ? 80 : 96,
    marginx: compact ? 36 : 48,
    marginy: compact ? 36 : 48,
  });

  function walk(node: CareerNode, parentId: string | null, depth: number) {
    const hasChildren = node.children.length > 0;
    const h = estimateDagreHeight(node.name, depth, hasChildren, compact);
    dagreGraph.setNode(node.id, { width: dagreNodeWidth, height: h });
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
        compact,
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
    node.position = { x: pos.x - halfW, y: pos.y - halfH };
  });

  return { nodes, edges };
}
