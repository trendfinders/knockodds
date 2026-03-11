import { NextResponse } from 'next/server';
import { mmaApi } from '@/lib/api/mma-api';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, any> = {};

  // Test 1: API Status
  try {
    const status = await mmaApi.getStatus();
    results.status = { ok: true, data: status };
  } catch (e: any) {
    results.status = { ok: false, error: e.message };
  }

  // Test 2: Get fights for today
  try {
    const today = new Date().toISOString().split('T')[0];
    const fights = await mmaApi.getFightsByDate(today);
    results.fightsToday = { ok: true, count: fights.length, date: today, sample: fights.slice(0, 2) };
  } catch (e: any) {
    results.fightsToday = { ok: false, error: e.message };
  }

  // Test 3: Get fighters (lightweight)
  try {
    const fighters = await mmaApi.getFighters({ category: 'Lightweight' });
    results.fighters = { ok: true, count: fighters.length, sample: fighters.slice(0, 2).map(f => f.name) };
  } catch (e: any) {
    results.fighters = { ok: false, error: e.message };
  }

  // Test 4: Get categories
  try {
    const cats = await mmaApi.getCategories();
    results.categories = { ok: true, count: cats.length, data: cats };
  } catch (e: any) {
    results.categories = { ok: false, error: e.message };
  }

  // Test 5: Get upcoming fights
  try {
    const upcoming = await mmaApi.getUpcomingFights();
    results.upcoming = { ok: true, count: upcoming.length, sample: upcoming.slice(0, 3).map(f => `${f.fighters.first.name} vs ${f.fighters.second.name} (${f.date})`) };
  } catch (e: any) {
    results.upcoming = { ok: false, error: e.message };
  }

  return NextResponse.json(results, { status: 200 });
}
