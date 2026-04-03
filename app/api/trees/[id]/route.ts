import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { CareerTree, AnalyticsStore } from '@/lib/types';

const DATA_PATH = path.join(process.cwd(), 'data', 'trees.json');
const ANALYTICS_PATH = path.join(process.cwd(), 'data', 'analytics.json');

async function readTrees(): Promise<CareerTree[]> {
  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(raw) as CareerTree[];
}

async function writeTrees(trees: CareerTree[]): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(trees, null, 2), 'utf-8');
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const trees = await readTrees();
  const tree = trees.find((t) => t.id === id);
  if (!tree) {
    return NextResponse.json({ error: 'Tree not found' }, { status: 404 });
  }
  return NextResponse.json(tree);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const updatedTree = (await request.json()) as CareerTree;
  const trees = await readTrees();
  const idx = trees.findIndex((t) => t.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Tree not found' }, { status: 404 });
  }
  trees[idx] = { ...updatedTree, updatedAt: new Date().toISOString() };
  await writeTrees(trees);
  return NextResponse.json(trees[idx]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const trees = await readTrees();
  const filtered = trees.filter((t) => t.id !== id);
  if (filtered.length === trees.length) {
    return NextResponse.json({ error: 'Tree not found' }, { status: 404 });
  }
  await writeTrees(filtered);
  
  // Remove analytics
  try {
    const rawAnalytics = await fs.readFile(ANALYTICS_PATH, 'utf-8');
    const analytics = JSON.parse(rawAnalytics) as AnalyticsStore;
    if (analytics[id]) {
      delete analytics[id];
      await fs.writeFile(ANALYTICS_PATH, JSON.stringify(analytics, null, 2), 'utf-8');
    }
  } catch (e) {
    // Ignore if analytics file doesn't exist
  }

  return NextResponse.json({ success: true });
}
