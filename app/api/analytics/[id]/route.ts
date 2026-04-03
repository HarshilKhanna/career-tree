import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { AnalyticsStore, TreeAnalytics } from '@/lib/types';

const DATA_PATH = path.join(process.cwd(), 'data', 'analytics.json');

async function readAnalytics(): Promise<AnalyticsStore> {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(raw) as AnalyticsStore;
  } catch (error) {
    // Return empty if file doesn't exist or is invalid
    return {};
  }
}

async function writeAnalytics(data: AnalyticsStore): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = await readAnalytics();
  
  const treeStats = store[id] || { treeViews: 0, nodes: {} };
  return NextResponse.json(treeStats);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { type, nodeId } = body as { type: string; nodeId?: string };

  const store = await readAnalytics();
  
  // Initialize if missing
  if (!store[id]) {
    store[id] = { treeViews: 0, nodes: {} };
  }

  if (type === 'view') {
    store[id].treeViews += 1;
  } else if ((type === 'click' || type === 'expand') && nodeId) {
    if (!store[id].nodes[nodeId]) {
      store[id].nodes[nodeId] = { clicks: 0, expands: 0 };
    }
    
    if (type === 'click') {
      store[id].nodes[nodeId].clicks += 1;
    } else if (type === 'expand') {
      store[id].nodes[nodeId].expands += 1;
    }
  }

  await writeAnalytics(store);

  return NextResponse.json({ success: true });
}
