import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options as never));
          } catch {}
        },
      },
    }
  );
}

/**
 * GET /api/comments?page_type=prediction&page_slug=2025-03-15/fighter1-vs-fighter2
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pageType = searchParams.get('page_type');
  const pageSlug = searchParams.get('page_slug');

  if (!pageType || !pageSlug) {
    return NextResponse.json({ error: 'page_type and page_slug required' }, { status: 400 });
  }

  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('page_type', pageType)
    .eq('page_slug', pageSlug)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: data || [] });
}

/**
 * POST /api/comments
 * Body: { page_type, page_slug, content, parent_id? }
 */
export async function POST(request: NextRequest) {
  const supabase = await getSupabase();

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await request.json();
  const { page_type, page_slug, content, parent_id } = body;

  if (!page_type || !page_slug || !content?.trim()) {
    return NextResponse.json({ error: 'page_type, page_slug, and content required' }, { status: 400 });
  }

  // Validate page_type
  if (!['prediction', 'news'].includes(page_type)) {
    return NextResponse.json({ error: 'page_type must be prediction or news' }, { status: 400 });
  }

  // Content length check
  if (content.trim().length > 2000) {
    return NextResponse.json({ error: 'Comment too long (max 2000 chars)' }, { status: 400 });
  }

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
  const avatarUrl = user.user_metadata?.avatar_url || null;

  const { data, error } = await supabase
    .from('comments')
    .insert({
      user_id: user.id,
      user_name: displayName,
      user_avatar_url: avatarUrl,
      page_type,
      page_slug,
      content: content.trim(),
      parent_id: parent_id || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comment: data }, { status: 201 });
}

/**
 * DELETE /api/comments?id=<comment_id>
 */
export async function DELETE(request: NextRequest) {
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Comment id required' }, { status: 400 });
  }

  // Only allow deleting own comments
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
