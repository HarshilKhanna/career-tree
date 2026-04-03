import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { AnalyticsStore } from '@/lib/types';

const DATA_PATH = path.join(process.cwd(), 'data', 'analytics.json');

export async function GET() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    const store = JSON.parse(raw) as AnalyticsStore;
    return NextResponse.json(store);
  } catch (error) {
    return NextResponse.json({});
  }
}
