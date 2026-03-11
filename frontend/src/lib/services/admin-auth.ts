import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = SupabaseClient<any, any, any>;

export async function getSupabaseAdmin(): Promise<AnySupabase> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL');
  }
  return createClient(url, key);
}

export async function getSupabaseAuth() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {}
        },
      },
    }
  );
}

export async function requireAdmin(): Promise<{ user: User; supabaseAdmin: AnySupabase } | NextResponse> {
  const supabase = await getSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const supabaseAdmin = await getSupabaseAdmin();

  const { data: stats } = await supabaseAdmin
    .from('user_stats')
    .select('is_admin, is_banned')
    .eq('user_id', user.id)
    .single();

  if (!stats?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  if (stats?.is_banned) {
    return NextResponse.json({ error: 'Account banned' }, { status: 403 });
  }

  return { user, supabaseAdmin };
}

export async function logAdminAction(
  supabaseAdmin: AnySupabase,
  adminId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, unknown>,
) {
  await supabaseAdmin.from('admin_logs').insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
  });
}
