import { NextRequest, NextResponse } from 'next/server';
import { calculateMonthlyBudget } from '@/lib/services/prize-pool';

/**
 * GET /api/cron/prize-pool — daily recalculation of monthly prize budget
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await calculateMonthlyBudget();

    return NextResponse.json({
      success: true,
      month: new Date().toISOString().slice(0, 7),
      ...result,
    });
  } catch (e) {
    console.error('Prize pool cron error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
