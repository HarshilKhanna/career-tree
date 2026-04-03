import { EducationLevel } from './treeConfig';

export interface CareerNode {
  id: string;          // uuid
  name: string;
  description: string;
  skills?: string[];
  salaryRange?: string; // e.g. "₹8L – ₹25L / yr"
  roadmap?: string;     // free-text or markdown
  depth?: number;       // injected at render time, not stored
  children: CareerNode[];
}

export interface CareerTree {
  id: string;          // composite: e.g. "ug_btech_cs_india"
  level: EducationLevel;
  degree: string;      // e.g. "B.Tech"
  stream: string | null;
  country: string;     // e.g. "India"
  createdAt: string;   // ISO date string
  updatedAt: string;
  root: CareerNode;    // root node (degree itself); its children = level 1 categories
}

export interface TreeMetadata {
  id: string;
  level: EducationLevel;
  degree: string;
  stream: string | null;
  country: string;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
}

export interface NodeAnalytics {
  clicks: number;
  expands: number;
}

export interface TreeAnalytics {
  treeViews: number;
  nodes: Record<string, NodeAnalytics>;
}

export interface AnalyticsStore {
  [treeId: string]: TreeAnalytics;
}

export function scoreNode(a: NodeAnalytics): number {
  return (a.clicks * 2) + a.expands;
}
