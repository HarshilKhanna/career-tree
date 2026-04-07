import { CareerNode, CareerTree } from './types';
import {
  formatLevelLabel,
  profileSpecialisations,
  type EducationLevel,
} from './treeConfig';

export interface TreeSelections {
  profile: 'inschool' | 'bachelors' | 'bachelors_exp' | 'masters' | 'masters_exp' | 'exp2plus';
  stream?: string;
  ugDegree?: string;
  ugSpec?: string;
  mastersDegree?: string;
  mastersSpec?: string;
  domain?: string;
  role?: string;
}

export function slugTreePart(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

/** Profile-based tree id for the landing flow and admin create form. */
export function buildTreeId(selections: TreeSelections): string {
  const parts: string[] = [];
  const slug = slugTreePart;

  switch (selections.profile) {
    case 'inschool':
      parts.push('inschool', slug(selections.stream!));
      break;
    case 'bachelors':
      parts.push('bachelors', slug(selections.ugDegree!));
      if (selections.ugSpec) parts.push(slug(selections.ugSpec));
      break;
    case 'bachelors_exp':
      parts.push('bachelors_exp', slug(selections.ugDegree!));
      if (selections.ugSpec) parts.push(slug(selections.ugSpec));
      parts.push(slug(selections.domain!));
      break;
    case 'masters':
      parts.push('masters', slug(selections.ugDegree!));
      if (selections.ugSpec) parts.push(slug(selections.ugSpec));
      parts.push(slug(selections.mastersDegree!));
      if (selections.mastersSpec) parts.push(slug(selections.mastersSpec));
      break;
    case 'masters_exp':
      parts.push('masters_exp', slug(selections.ugDegree!));
      if (selections.ugSpec) parts.push(slug(selections.ugSpec));
      parts.push(slug(selections.mastersDegree!));
      if (selections.mastersSpec) parts.push(slug(selections.mastersSpec));
      parts.push(slug(selections.domain!));
      break;
    case 'exp2plus':
      parts.push('exp2plus', slug(selections.ugDegree!));
      if (selections.ugSpec) parts.push(slug(selections.ugSpec));
      if (selections.mastersDegree) parts.push(slug(selections.mastersDegree));
      if (selections.mastersSpec) parts.push(slug(selections.mastersSpec));
      parts.push(slug(selections.role!));
      break;
  }

  return parts.join('_');
}

export function profileToCareerTreeFields(
  selections: TreeSelections
): Pick<
  CareerTree,
  'id' | 'level' | 'degree' | 'stream' | 'country' | 'ugDegree' | 'ugStream'
> {
  const id = buildTreeId(selections);
  const country = '';

  switch (selections.profile) {
    case 'inschool':
      return {
        id,
        level: 'school',
        degree: 'In-School',
        stream: selections.stream!,
        country,
        ugDegree: null,
        ugStream: null,
      };
    case 'bachelors':
    case 'bachelors_exp':
      return {
        id,
        level: 'undergraduate',
        degree: selections.ugDegree!,
        stream: selections.ugSpec ?? null,
        country,
        ugDegree: null,
        ugStream: null,
      };
    case 'masters':
    case 'masters_exp':
      return {
        id,
        level: 'masters',
        degree: selections.mastersDegree!,
        stream: selections.mastersSpec ?? null,
        country,
        ugDegree: selections.ugDegree!,
        ugStream: selections.ugSpec ?? null,
      };
    case 'exp2plus': {
      const hasM = Boolean(selections.mastersDegree?.trim());
      const degree = hasM
        ? `${selections.ugDegree} → ${selections.mastersDegree}`
        : selections.ugDegree!;
      const stream =
        [selections.ugSpec, selections.mastersSpec, selections.role].filter(Boolean).join(' — ') ||
        selections.role ||
        null;
      return {
        id,
        level: hasM ? 'masters' : 'undergraduate',
        degree,
        stream,
        country,
        ugDegree: null,
        ugStream: null,
      };
    }
  }
}

/** For profile `exp2plus` only: whether the user stopped at bachelor's or completed a master's. */
export type Exp2PlusEducation = 'bachelors_only' | 'masters';

export interface ProfileFormState {
  profile: TreeSelections['profile'] | null;
  stream: string | null;
  ugDegree: string | null;
  ugSpec: string | null;
  mastersDegree: string | null;
  mastersSpec: string | null;
  domain: string | null;
  role: string | null;
  /** Set when profile is exp2plus; null until they answer the education question. */
  exp2plusEducation: Exp2PlusEducation | null;
}

function formDegreeNeedsSpec(degree: string): boolean {
  const sp = profileSpecialisations(degree);
  return Array.isArray(sp) && sp.length > 0;
}

/** Shared by landing flow and admin create — returns null until the profile path is complete. */
export function treeSelectionsFromForm(s: ProfileFormState): TreeSelections | null {
  const { profile } = s;
  if (!profile) return null;

  const ugOk =
    Boolean(s.ugDegree?.trim()) &&
    (!formDegreeNeedsSpec(s.ugDegree!) ||
      Boolean(s.ugSpec?.trim()));

  const mastersOk =
    Boolean(s.mastersDegree?.trim()) &&
    (!formDegreeNeedsSpec(s.mastersDegree!) ||
      Boolean(s.mastersSpec?.trim()));

  switch (profile) {
    case 'inschool':
      if (!s.stream?.trim()) return null;
      return { profile, stream: s.stream.trim() };
    case 'bachelors':
      if (!ugOk || !s.ugDegree) return null;
      return {
        profile,
        ugDegree: s.ugDegree,
        ugSpec: s.ugSpec ?? undefined,
      };
    case 'bachelors_exp':
      if (!ugOk || !s.ugDegree || !s.domain?.trim()) return null;
      return {
        profile,
        ugDegree: s.ugDegree,
        ugSpec: s.ugSpec ?? undefined,
        domain: s.domain.trim(),
      };
    case 'masters':
      if (!ugOk || !s.ugDegree || !mastersOk || !s.mastersDegree) return null;
      return {
        profile,
        ugDegree: s.ugDegree,
        ugSpec: s.ugSpec ?? undefined,
        mastersDegree: s.mastersDegree,
        mastersSpec: s.mastersSpec ?? undefined,
      };
    case 'masters_exp':
      if (!ugOk || !s.ugDegree || !mastersOk || !s.mastersDegree || !s.domain?.trim()) {
        return null;
      }
      return {
        profile,
        ugDegree: s.ugDegree,
        ugSpec: s.ugSpec ?? undefined,
        mastersDegree: s.mastersDegree,
        mastersSpec: s.mastersSpec ?? undefined,
        domain: s.domain.trim(),
      };
    case 'exp2plus': {
      if (!ugOk || !s.ugDegree) return null;
      if (s.exp2plusEducation == null) return null;
      if (s.exp2plusEducation === 'bachelors_only') {
        if (!s.role?.trim()) return null;
        return {
          profile,
          ugDegree: s.ugDegree,
          ugSpec: s.ugSpec ?? undefined,
          role: s.role.trim(),
        };
      }
      if (!mastersOk || !s.mastersDegree) return null;
      if (!s.role?.trim()) return null;
      return {
        profile,
        ugDegree: s.ugDegree,
        ugSpec: s.ugSpec ?? undefined,
        mastersDegree: s.mastersDegree,
        mastersSpec: s.mastersSpec ?? undefined,
        role: s.role.trim(),
      };
    }
    default:
      return null;
  }
}

export function applyProfileMetadata(tree: CareerTree, selections: TreeSelections): void {
  const f = profileToCareerTreeFields(selections);
  tree.id = f.id;
  tree.level = f.level as EducationLevel;
  tree.degree = f.degree;
  tree.stream = f.stream;
  tree.country = f.country;
  tree.ugDegree = f.ugDegree ?? null;
  tree.ugStream = f.ugStream ?? null;
  tree.root.name = f.stream ?? f.degree;
  tree.root.description = `Career paths for ${f.degree}${f.stream ? ` — ${f.stream}` : ''}`;
}

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
  const NON_TERMINAL_ARRAYS: Array<{
    key: keyof CareerNode;
    label: string;
    fallback: string;
  }> = [
    { key: 'what_it_is', label: 'WHAT_IT_IS', fallback: 'Core scope and purpose of this branch.' },
    { key: 'who_its_not_for', label: 'WHO_ITS_NOT_FOR', fallback: 'Not ideal without sustained interest in this work.' },
    { key: 'work_lifestyle', label: 'WORK_LIFESTYLE', fallback: 'Mix of focused execution and cross-team collaboration.' },
    { key: 'entry_route', label: 'ENTRY_ROUTE', fallback: 'Build projects, gain internships, and demonstrate fundamentals.' },
    { key: 'timeline', label: 'TIMELINE', fallback: 'Typical progression over three to six years.' },
    { key: 'salary_range', label: 'SALARY_RANGE', fallback: 'Compensation grows with role depth and performance.' },
    { key: 'growth_and_progression', label: 'GROWTH', fallback: 'Progression from execution to ownership and leadership.' },
    { key: 'demand_and_outlook', label: 'DEMAND', fallback: 'Steady demand across technology and services sectors.' },
    { key: 'honest_caveat', label: 'HONEST_CAVEAT', fallback: 'Requires continuous upskilling and consistent effort.' },
  ];
  
  lines.push(`TREE: ${tree.degree} — ${tree.stream || 'None'} | ${formatLevelLabel(tree.level)}`);
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

      // Parser rule: every non-terminal node must include all nine path-detail blocks.
      if (node.children.length > 0) {
        for (const { key, label, fallback } of NON_TERMINAL_ARRAYS) {
          const arr = node[key];
          const value =
            Array.isArray(arr) && arr.length > 0
              ? arr[0]
              : fallback;
          lines.push(`${indent}  ${label}:`);
          lines.push(`${indent}  - ${value}`);
        }
      }
      
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

/** Legacy composite ID from TREE header fields (parser, older trees). */
export function buildLegacyTreeId(level: string, degree: string, stream: string | null, country: string): string {
  const sanitize = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  const parts = [
    level === 'undergraduate' ? 'ug' : level,
    degree,
    stream,
    country,
  ].filter(Boolean) as string[];

  return parts.map(sanitize).join('_');
}
