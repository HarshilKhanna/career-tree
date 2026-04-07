import { EducationLevel } from './treeConfig';

export interface CareerNode {
  id: string;          // uuid
  name: string;
  description: string;
  skills?: string[];
  salaryRange?: string; // headline line for card, e.g. "₹8L – ₹25L / yr"
  roadmap?: string;     // free-text or markdown
  depth?: number;       // injected at render time, not stored
  children: CareerNode[];

  // Extended detail arrays — present on intermediary (non-leaf) nodes only.
  // Each string is a self-contained bullet line.
  what_it_is?: string[];
  who_its_not_for?: string[];
  work_lifestyle?: string[];
  entry_route?: string[];
  timeline?: string[];
  salary_range?: string[];          // detailed bands (coexists with salaryRange headline)
  growth_and_progression?: string[];
  demand_and_outlook?: string[];
  honest_caveat?: string[];
}

export interface CareerTree {
  id: string;          // composite: e.g. "ug_btech_cs_india"
  level: EducationLevel;
  degree: string;      // e.g. "B.Tech"
  stream: string | null;
  /** UG degree when `level` is masters and the profile encodes UG separately (admin masters flows). */
  ugDegree?: string | null;
  /** UG specialization; same semantics as `ugDegree`. */
  ugStream?: string | null;
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
  ugDegree?: string | null;
  ugStream?: string | null;
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
