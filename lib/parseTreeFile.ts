import { CareerTree, CareerNode } from './types';
import { EducationLevel } from './treeConfig';
import { buildTreeId } from './treeUtils';
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

export function parseTreeFile(text: string): ParseResult {
  const errors: ParseError[] = [];
  const lines = text.split('\n');

  // Filter out comments and blanks, tracking original line numbers
  const meaningfulLines = lines
    .map((content, idx) => ({ content, num: idx + 1 }))
    .filter(l => {
      const trimmed = l.content.trim();
      return trimmed.length > 0 && !trimmed.startsWith('#') && !trimmed.startsWith('```') && !trimmed.startsWith('---');
    });

  if (meaningfulLines.length === 0) {
    return { success: false, errors: [{ line: 1, message: "File is empty or contains only comments." }] };
  }

  // 1. Process TREE header line
  const headerLine = meaningfulLines[0];
  if (!headerLine.content.trim().startsWith('TREE:')) {
    errors.push({ line: headerLine.num, message: "First non-comment line must start with 'TREE: '" });
    return { success: false, errors };
  }

  // Parse: TREE: [Degree] — [Stream] | [Country] | [Level]
  const headerContent = headerLine.content.substring(5).trim();
  const parts = headerContent.split('|').map(p => p.trim());
  
  if (parts.length < 3) {
    errors.push({ line: headerLine.num, message: "TREE header format invalid. Expected: [Degree] — [Stream] | [Country] | [Level]" });
    return { success: false, errors };
  }

  const identityPart = parts[0];
  let degree = identityPart;
  let stream: string | null = null;
  
  // Split on md-dash, em-dash, or regular dash
  const dashMatch = identityPart.match(/^(.*?)\s*(?:—|–|-)\s*(.*)$/);
  if (dashMatch) {
    degree = dashMatch[1].trim();
    const parsedStream = dashMatch[2].trim();
    stream = parsedStream.toLowerCase() === 'none' ? null : parsedStream;
  }

  const country = parts[1];
  const levelStr = parts[2].toLowerCase();
  
  let level: EducationLevel = 'undergraduate';
  if (['school', 'undergraduate', 'masters'].includes(levelStr)) {
    level = levelStr as EducationLevel;
  } else {
    errors.push({ line: headerLine.num, message: `Invalid level '${levelStr}'. Must be 'school', 'undergraduate', or 'masters'.` });
  }

  const treeId = buildTreeId(levelStr, degree, stream, country);

  const rootNode: CareerNode = {
    id: uuidv4(),
    name: stream ? stream : degree,
    description: `Career paths for ${stream ? stream : degree} in ${country}`,
    children: []
  };

  const tree: CareerTree = {
    id: treeId,
    level,
    degree,
    stream,
    country,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    root: rootNode
  };

  // Stack of nodes by indent depth
  // depth 0: CATEGORY (children of root)
  // depth 1: PATH
  // depth 2: SPEC
  // depth 3: SUB
  const stack: { node: CareerNode, depth: number }[] = [];

  for (let i = 1; i < meaningfulLines.length; i++) {
    const l = meaningfulLines[i];
    
    const trimmed = l.content.trim();
    
    // Ignore markdown ticks or rules that somehow made it through
    if (trimmed.startsWith('```') || trimmed.startsWith('---')) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) {
      errors.push({ line: l.num, message: `Line missing colon ':' separator: "${trimmed}"` });
      continue;
    }

    const keyword = trimmed.substring(0, colonIdx).trim().toUpperCase();
    const value = trimmed.substring(colonIdx + 1).trim();

    // structural nodes
    if (['CATEGORY', 'PATH', 'SPEC', 'SUB'].includes(keyword)) {
      if (value.length === 0) {
        errors.push({ line: l.num, message: `Node name cannot be empty.` });
      }
      
      const depth: number = {
        'CATEGORY': 0,
        'PATH': 1,
        'SPEC': 2,
        'SUB': 3
      }[keyword as string] || 0;

      const newNode: CareerNode = {
        id: uuidv4(),
        name: value,
        description: '', // Will be filled
        children: []
      };

      if (depth === 0) {
        // Direct child of root
        tree.root.children.push(newNode);
        stack.length = 0; // Clear stack
        stack.push({ node: newNode, depth: 0 });
      } else {
        // Find parent in stack
        while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
          stack.pop();
        }
        
        if (stack.length === 0) {
          errors.push({ line: l.num, message: `Orphaned ${keyword} node. Missing parent node.` });
        } else {
          // Check for duplicate names?
          const parent = stack[stack.length - 1].node;
          if (parent.children.some(c => c.name.toLowerCase() === value.toLowerCase())) {
            errors.push({ line: l.num, message: `Duplicate node name '${value}' under parent '${parent.name}'.` });
          }
          
          parent.children.push(newNode);
          stack.push({ node: newNode, depth });
        }
      }
    } 
    // metadata nodes
    else if (['DESC', 'SKILLS', 'SALARY', 'ROADMAP'].includes(keyword)) {
      if (stack.length === 0) {
        errors.push({ line: l.num, message: `${keyword} attribute found outside of any node.` });
        continue;
      }
      
      const currentNode = stack[stack.length - 1].node;
      
      if (keyword === 'DESC') {
        if (!value) errors.push({ line: l.num, message: 'DESC value cannot be empty.' });
        currentNode.description = value;
      } else if (keyword === 'SKILLS') {
        if (!value) errors.push({ line: l.num, message: 'SKILLS value cannot be empty.' });
        currentNode.skills = value.split(',').map(s => s.trim()).filter(Boolean);
      } else if (keyword === 'SALARY') {
        currentNode.salaryRange = value;
      } else if (keyword === 'ROADMAP') {
        currentNode.roadmap = value;
      }
    } else {
      // Typo detection
      const validKeywords = ['CATEGORY', 'PATH', 'SPEC', 'SUB', 'DESC', 'SKILLS', 'SALARY', 'ROADMAP'];
      // Simple levenshtein or just naive check
      let suggested = '';
      for (const k of validKeywords) {
        if (k.startsWith(keyword[0]) && Math.abs(k.length - keyword.length) <= 2) {
          suggested = ` Did you mean '${k}'?`;
          break;
        }
      }
      errors.push({ line: l.num, message: `Unknown keyword '${keyword}'.${suggested}` });
    }
  }

  // Final validation pass to check missing DESC
  function checkDesc(node: CareerNode) {
    if (node !== rootNode && !node.description) {
      // Find line number roughly... we can't easily here, let's just add generic error
      // Actually we should have tracked the line of the node.
      errors.push({ line: 0, message: `Node '${node.name}' is missing a REQUIRED 'DESC:' field.` });
    }
    node.children.forEach(checkDesc);
  }
  
  tree.root.children.forEach(checkDesc);

  return {
    success: errors.length === 0,
    tree: errors.length === 0 ? tree : undefined,
    errors
  };
}
