import { CareerNode, CareerTree } from './types';
import { formatLevelLabel } from './treeConfig';

/** Find a node by ID — returns null if not found */
export function findNodeById(root: CareerNode, id: string): CareerNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

/** Insert a new node as a child of the node with `parentId` */
export function insertNode(
  root: CareerNode,
  parentId: string,
  newNode: CareerNode
): CareerNode {
  if (root.id === parentId) {
    return { ...root, children: [...root.children, newNode] };
  }
  return {
    ...root,
    children: root.children.map((child) =>
      insertNode(child, parentId, newNode)
    ),
  };
}

/** Update a node's fields by ID — returns a new tree root */
export function updateNode(
  root: CareerNode,
  id: string,
  updates: Partial<CareerNode>
): CareerNode {
  if (root.id === id) {
    return { ...root, ...updates };
  }
  return {
    ...root,
    children: root.children.map((child) => updateNode(child, id, updates)),
  };
}

/** Remove a node (and all its children) by ID */
export function deleteNode(root: CareerNode, id: string): CareerNode {
  return {
    ...root,
    children: root.children
      .filter((child) => child.id !== id)
      .map((child) => deleteNode(child, id)),
  };
}

/** Count all nodes in the tree (including root) */
export function countNodes(root: CareerNode): number {
  return 1 + root.children.reduce((sum, child) => sum + countNodes(child), 0);
}

/** Flatten all nodes into a single array (BFS order) */
export function flattenNodes(root: CareerNode): CareerNode[] {
  const result: CareerNode[] = [];
  const queue: CareerNode[] = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);
    queue.push(...node.children);
  }
  return result;
}

/** Calculate max depth of the tree rooted at this node */
export function maxDepth(root: CareerNode): number {
  if (root.children.length === 0) return 0;
  return 1 + Math.max(...root.children.map(maxDepth));
}

/** Reverse render a CareerTree back back to the .txt format */
export function treeToText(tree: CareerTree): string {
  const lines: string[] = [];
  
  lines.push(
    `TREE: ${tree.degree} — ${tree.stream || 'None'} | ${tree.country} | ${formatLevelLabel(tree.level)}`
  );
  lines.push('');

  function traverse(node: CareerNode, depth: number) {
    if (depth > 0) { // Don't print the root node itself
      const indent = '  '.repeat(depth - 1);
      
      let prefix = 'CATEGORY';
      if (depth === 2) prefix = 'PATH';
      if (depth === 3) prefix = 'SPEC';
      if (depth === 4) prefix = 'SUB';
      
      lines.push(`${indent}${prefix}: ${node.name}`);
      lines.push(`${indent}  DESC: ${node.description}`);
      
      if (node.skills && node.skills.length > 0) {
        lines.push(`${indent}  SKILLS: ${node.skills.join(', ')}`);
      }
      if (node.salaryRange) {
        lines.push(`${indent}  SALARY: ${node.salaryRange}`);
      }
      if (node.roadmap) {
        lines.push(`${indent}  ROADMAP: ${node.roadmap}`);
      }
      
      // Blank line after node content, except if it's deeply nested children?
      // Just keep it clean. Let's add a blank line after categories and paths.
      if (depth <= 2) {
        lines.push('');
      } else if (node.children.length > 0) {
        lines.push('');
      }
    }
    
    for (const child of node.children) {
      traverse(child, depth + 1);
    }
  }

  traverse(tree.root, 0);

  return lines.join('\n');
}

/** Build composite ID */
export function buildTreeId(level: string, degree: string, stream: string | null, country: string): string {
  const sanitize = (str: string) => 
    str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  
  const parts = [
    level === 'undergraduate' ? 'ug' : level,
    degree,
    stream,
    country
  ].filter(Boolean) as string[];
  
  return parts.map(sanitize).join('_');
}
