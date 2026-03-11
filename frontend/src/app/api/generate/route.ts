import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

/**
 * POST /api/generate?action=revalidate&tag=predictions
 * Revalidates cached content by tag.
 *
 * Tags: 'predictions', 'fighter-bios', 'odds-analysis'
 *
 * This forces regeneration on next page visit.
 * Content is generated lazily (on first visit after revalidation).
 */
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const tag = searchParams.get('tag');
  const secret = searchParams.get('secret');

  // Simple auth
  if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET !== 'your_cron_secret') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (action === 'revalidate' && tag) {
    revalidateTag(tag, 'default');
    return NextResponse.json({ ok: true, message: `Revalidated tag: ${tag}` });
  }

  if (action === 'revalidate-all') {
    revalidateTag('predictions', 'default');
    revalidateTag('fighter-bios', 'default');
    revalidateTag('odds-analysis', 'default');
    return NextResponse.json({ ok: true, message: 'Revalidated all content tags' });
  }

  return NextResponse.json({
    error: 'Invalid action',
    usage: {
      revalidate: 'POST /api/generate?action=revalidate&tag=predictions&secret=xxx',
      revalidateAll: 'POST /api/generate?action=revalidate-all&secret=xxx',
      tags: ['predictions', 'fighter-bios', 'odds-analysis'],
    }
  }, { status: 400 });
}
