import { CareerTree, CareerNode } from './types';
import { EducationLevel } from './treeConfig';
import { buildLegacyTreeId } from './treeUtils';
import { v4 as uuidv4 } from 'uuid';

export interface ParseError {
  line: number;
  message: string;
}

export interface ParseResult {
  success: boolean;
  tree?: CareerTree;
  errors: ParseError[];
}

/**
 * Maps the short text-file keywords for the nine path-detail arrays to the
 * corresponding CareerNode field names.
 */
const ARRAY_KEYWORD_MAP: Record<string, string> = {
  WHAT_IT_IS:       'what_it_is',
  WHO_ITS_NOT_FOR:  'who_its_not_for',
  WORK_LIFESTYLE:   'work_lifestyle',
  ENTRY_ROUTE:      'entry_route',
  TIMELINE:         'timeline',
  SALARY_RANGE:     'salary_range',
  GROWTH:           'growth_and_progression',
  DEMAND:           'demand_and_outlook',
  HONEST_CAVEAT:    'honest_caveat',
};
const REQUIRED_NON_TERMINAL_ARRAY_FIELDS = Object.values(ARRAY_KEYWORD_MAP);
const ARRAY_FIELD_TO_KEYWORD = Object.fromEntries(
  Object.entries(ARRAY_KEYWORD_MAP).map(([keyword, field]) => [field, keyword])
) as Record<string, string>;

/** All keywords that open a multi-line bullet array. */
const ARRAY_KEYWORDS = new Set(Object.keys(ARRAY_KEYWORD_MAP));

/** Structural node keywords and their logical depth. */
const STRUCTURAL_DEPTH: Record<string, number> = {
  CATEGORY: 0,
  PATH:     1,
  SPEC:     2,
  SUB:      3,
};

/** Scalar (single-line) attribute keywords. */
const SCALAR_KEYWORDS = new Set(['DESC', 'SKILLS', 'SALARY', 'ROADMAP']);

export function parseTreeFile(text: string): ParseResult {
  const errors: ParseError[] = [];
  const lines = text.split('\n');

  // Filter comments and blank lines, keep original line numbers
  const meaningful = lines
    .map((content, idx) => ({ content, num: idx + 1 }))
    .filter(({ content }) => {
      const t = content.trim();
      return t.length > 0 && !t.startsWith('#') && !t.startsWith('```') && !t.startsWith('---');
    });

  if (meaningful.length === 0) {
    return { success: false, errors: [{ line: 1, message: 'File is empty or contains only comments.' }] };
  }

  // ── 1. TREE header ────────────────────────────────────────────────────────
  const headerLine = meaningful[0];
  if (!headerLine.content.trim().startsWith('TREE:')) {
    errors.push({ line: headerLine.num, message: "First non-comment line must start with 'TREE: '" });
    return { success: false, errors };
  }

  const headerContent = headerLine.content.substring(5).trim();
  const parts = headerContent.split('|').map(p => p.trim());

  if (parts.length < 2) {
    errors.push({
      line: headerLine.num,
      message: 'TREE header format invalid. Expected: [Degree] — [Stream] | [Level]',
    });
    return { success: false, errors };
  }

  const identityPart = parts[0];
  let degree = identityPart;
  let stream: string | null = null;

  const dashMatch = identityPart.match(/^(.*?)\s*(?:—|–|-)\s*(.*)$/);
  if (dashMatch) {
    degree = dashMatch[1].trim();
    const ps = dashMatch[2].trim();
    stream = ps.toLowerCase() === 'none' ? null : ps;
  }

  // Backward compatible headers:
  // New: [Degree] — [Stream] | [Level]
  // Old: [Degree] — [Stream] | [Country] | [Level]
  const hasCountry = parts.length >= 3;
  const country = hasCountry ? parts[1] : '';
  const levelStr = (hasCountry ? parts[2] : parts[1]).toLowerCase();

  let level: EducationLevel = 'undergraduate';
  if (['school', 'undergraduate', 'masters'].includes(levelStr)) {
    level = levelStr as EducationLevel;
  } else {
    errors.push({ line: headerLine.num, message: `Invalid level '${levelStr}'. Must be 'school', 'undergraduate', or 'masters'.` });
  }

  const treeId = buildLegacyTreeId(levelStr, degree, stream, country);

  const rootNode: CareerNode = {
    id: uuidv4(),
    name: stream ?? degree,
    description: `Career paths for ${stream ?? degree}`,
    children: [],
  };

  const tree: CareerTree = {
    id: treeId,
    level,
    degree,
    stream,
    country,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    root: rootNode,
  };

  // ── 2. Node body ──────────────────────────────────────────────────────────
  // Stack entries track the current node at each structural depth.
  const stack: { node: CareerNode; depth: number }[] = [];

  /**
   * When non-null, every subsequent `- <text>` line is appended to the named
   * array field on the current stack-top node.
   */
  let collectingField: string | null = null;

  for (let i = 1; i < meaningful.length; i++) {
    const l = meaningful[i];
    const trimmed = l.content.trim();

    if (trimmed.startsWith('```') || trimmed.startsWith('---')) continue;

    // ── Bullet line (multi-line array item) ──────────────────────────────
    if (trimmed.startsWith('- ') && collectingField !== null) {
      if (stack.length === 0) {
        errors.push({ line: l.num, message: `Bullet line found outside of any node.` });
        continue;
      }
      const currentNode = stack[stack.length - 1].node as unknown as Record<string, unknown>;
      const field = collectingField;
      if (!Array.isArray(currentNode[field])) {
        currentNode[field] = [];
      }
      (currentNode[field] as string[]).push(trimmed.substring(2).trim());
      continue;
    }

    // Lenient mode: while inside an array section, accept plain text lines
    // (without `- ` and without `KEYWORD:`) as bullet content.
    if (
      collectingField !== null &&
      !trimmed.includes(':') &&
      stack.length > 0
    ) {
      const currentNode = stack[stack.length - 1].node as unknown as Record<string, unknown>;
      const field = collectingField;
      if (!Array.isArray(currentNode[field])) {
        currentNode[field] = [];
      }
      (currentNode[field] as string[]).push(trimmed);
      continue;
    }

    // Any non-bullet line ends array collection mode.
    collectingField = null;

    // ── Parse keyword : value ─────────────────────────────────────────────
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) {
      errors.push({ line: l.num, message: `Line missing colon ':' separator: "${trimmed}"` });
      continue;
    }

    const keyword = trimmed.substring(0, colonIdx).trim().toUpperCase();
    const value   = trimmed.substring(colonIdx + 1).trim();

    // ── Structural node ──────────────────────────────────────────────────
    if (keyword in STRUCTURAL_DEPTH) {
      if (!value.length) {
        errors.push({ line: l.num, message: `Node name cannot be empty.` });
      }

      const depth = STRUCTURAL_DEPTH[keyword];
      const newNode: CareerNode = { id: uuidv4(), name: value, description: '', children: [] };

      if (depth === 0) {
        tree.root.children.push(newNode);
        stack.length = 0;
        stack.push({ node: newNode, depth: 0 });
      } else {
        while (stack.length > 0 && stack[stack.length - 1].depth >= depth) stack.pop();

        if (stack.length === 0) {
          errors.push({ line: l.num, message: `Orphaned ${keyword} node — missing parent.` });
        } else {
          const parent = stack[stack.length - 1].node;
          if (parent.children.some(c => c.name.toLowerCase() === value.toLowerCase())) {
            errors.push({ line: l.num, message: `Duplicate node name '${value}' under '${parent.name}'.` });
          }
          parent.children.push(newNode);
          stack.push({ node: newNode, depth });
        }
      }

      continue;
    }

    // ── Scalar attributes ────────────────────────────────────────────────
    if (SCALAR_KEYWORDS.has(keyword)) {
      if (stack.length === 0) {
        errors.push({ line: l.num, message: `${keyword} found outside of any node.` });
        continue;
      }
      const n = stack[stack.length - 1].node;

      if (keyword === 'DESC') {
        if (!value) errors.push({ line: l.num, message: 'DESC value cannot be empty.' });
        n.description = value;
      } else if (keyword === 'SKILLS') {
        if (!value) errors.push({ line: l.num, message: 'SKILLS value cannot be empty.' });
        n.skills = value.split(',').map(s => s.trim()).filter(Boolean);
      } else if (keyword === 'SALARY') {
        n.salaryRange = value;
      } else if (keyword === 'ROADMAP') {
        n.roadmap = value;
      }

      continue;
    }

    // ── Array attribute header (opens bullet collection) ─────────────────
    if (ARRAY_KEYWORDS.has(keyword)) {
      if (stack.length === 0) {
        errors.push({ line: l.num, message: `${keyword} found outside of any node.` });
        continue;
      }
      // value should be empty; if someone wrote "WHAT_IT_IS: some text" inline, accept it
      // as the first bullet for backwards-compat
      collectingField = ARRAY_KEYWORD_MAP[keyword];
      if (value.length) {
        const n = stack[stack.length - 1].node as unknown as Record<string, unknown>;
        if (!Array.isArray(n[collectingField])) n[collectingField] = [];
        (n[collectingField] as string[]).push(value);
      }
      continue;
    }

    // ── Unknown keyword ──────────────────────────────────────────────────
    const all = [...Object.keys(STRUCTURAL_DEPTH), ...SCALAR_KEYWORDS, ...ARRAY_KEYWORDS];
    let suggested = '';
    for (const k of all) {
      if (k.startsWith(keyword[0]) && Math.abs(k.length - keyword.length) <= 2) {
        suggested = ` Did you mean '${k}'?`;
        break;
      }
    }
    errors.push({ line: l.num, message: `Unknown keyword '${keyword}'.${suggested}` });
  }

  // ── 3. Post-processing ────────────────────────────────────────────────────
  // If a node has no DESC but has what_it_is bullets, synthesise description
  // from the first bullet so the UI always has something to show.
  function fillMissingDescriptions(node: CareerNode) {
    if (node !== rootNode && !node.description) {
      const wi = (node as unknown as Record<string, string[]>).what_it_is;
      if (Array.isArray(wi) && wi.length > 0) {
        node.description = wi[0];
      }
    }
    node.children.forEach(fillMissingDescriptions);
  }
  fillMissingDescriptions(tree.root);

  // Validate that every non-root node has at least a description.
  function checkDescription(node: CareerNode) {
    if (node !== rootNode && !node.description) {
      errors.push({
        line: 0,
        message: `Node '${node.name}' is missing a REQUIRED 'DESC:' or 'WHAT_IT_IS:' field.`,
      });
    }
    node.children.forEach(checkDescription);
  }
  tree.root.children.forEach(checkDescription);

  // Validate that every non-root non-terminal node includes all nine array blocks.
  function checkNonTerminalArrays(node: CareerNode) {
    const isNonRoot = node !== rootNode;
    const isNonTerminal = node.children.length > 0;
    if (isNonRoot && isNonTerminal) {
      const rec = node as unknown as Record<string, unknown>;
      for (const field of REQUIRED_NON_TERMINAL_ARRAY_FIELDS) {
        const val = rec[field];
        if (!Array.isArray(val) || val.length === 0) {
          const keyword = ARRAY_FIELD_TO_KEYWORD[field] ?? field.toUpperCase();
          errors.push({
            line: 0,
            message: `Non-terminal node '${node.name}' must include '${keyword}:' with at least one bullet.`,
          });
        }
      }
    }
    node.children.forEach(checkNonTerminalArrays);
  }
  tree.root.children.forEach(checkNonTerminalArrays);

  return {
    success: errors.length === 0,
    tree:    errors.length === 0 ? tree : undefined,
    errors,
  };
}
