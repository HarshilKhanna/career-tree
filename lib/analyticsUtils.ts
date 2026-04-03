import { CareerNode, TreeAnalytics, NodeAnalytics } from './types';

const EMPTY_ANALYTICS: TreeAnalytics = { treeViews: 0, nodes: {} };

/**
 * Returns the total interaction score for a single node.
 * score = clicks + expands
 */
function nodeScore(analytics: TreeAnalytics, nodeId: string): number {
  const a: NodeAnalytics = analytics.nodes[nodeId] ?? { clicks: 0, expands: 0 };
  return a.clicks + a.expands;
}

/**
 * Recursively sums interaction scores across an entire subtree.
 * This is the branch score used for sorting siblings at each level.
 */
export function subtreeScore(node: CareerNode, analytics: TreeAnalytics): number {
  const self = nodeScore(analytics, node.id);
  const childSum = node.children.reduce(
    (acc, child) => acc + subtreeScore(child, analytics),
    0
  );
  return self + childSum;
}

/**
 * Sorts a node's children by their subtree score (descending).
 * Applied recursively so every level is sorted by its own subtree sums.
 * Uses stable sort — zero-score siblings preserve their original order.
 */
export function sortTreeByAnalytics(
  node: CareerNode,
  analytics: TreeAnalytics | undefined
): CareerNode {
  const a = analytics ?? EMPTY_ANALYTICS;

  if (node.children.length === 0) return node;

  const scored = node.children.map((child, originalIndex) => ({
    child,
    score: subtreeScore(child, a),
    originalIndex,
  }));

  scored.sort((x, y) =>
    x.score !== y.score ? y.score - x.score : x.originalIndex - y.originalIndex
  );

  return {
    ...node,
    children: scored.map(({ child }) => sortTreeByAnalytics(child, a)),
  };
}
