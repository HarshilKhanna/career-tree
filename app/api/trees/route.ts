import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CareerTree, CareerNode } from '@/lib/types';
import { countNodes } from '@/lib/treeUtils';

const DATA_PATH = path.join(process.cwd(), 'data', 'trees.json');

async function readTrees(): Promise<CareerTree[]> {
  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(raw) as CareerTree[];
}

async function writeTrees(trees: CareerTree[]): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(trees, null, 2), 'utf-8');
}

export async function GET() {
  const trees = await readTrees();
  const metadata = trees.map((t) => ({
    id: t.id,
    level: t.level,
    degree: t.degree,
    stream: t.stream,
    ugDegree: t.ugDegree ?? null,
    ugStream: t.ugStream ?? null,
    country: t.country,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    nodeCount: countNodes(t.root),
  }));
  return NextResponse.json(metadata);
}

export async function POST(request: Request) {
  const newTree = await request.json() as CareerTree;
  const trees = await readTrees();
  
  const existingIdx = trees.findIndex((t) => t.id === newTree.id);
  if (existingIdx !== -1) {
    trees[existingIdx] = newTree;
  } else {
    trees.push(newTree);
  }
  
  await writeTrees(trees);
  return NextResponse.json(newTree, { status: 201 });
}
