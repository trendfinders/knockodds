import 'dotenv/config';

const WP_URL = process.env.WP_URL || 'http://localhost:8080';
const WP_API = `${WP_URL}/wp-json`;

let jwtToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (jwtToken && Date.now() < tokenExpiry) return jwtToken;

  const res = await fetch(`${WP_API}/jwt-auth/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.WP_API_USER,
      password: process.env.WP_API_PASSWORD,
    }),
  });

  if (!res.ok) throw new Error(`JWT auth failed: ${res.status}`);
  const data = await res.json();
  jwtToken = data.token;
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000; // 23 hours
  return jwtToken!;
}

export async function wpGet<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${WP_API}${endpoint}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`WP GET error ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function wpPost<T>(endpoint: string, data: Record<string, any>): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${WP_API}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`WP POST error ${res.status}: ${error}`);
  }
  return res.json();
}

export async function wpUpdate<T>(endpoint: string, id: number, data: Record<string, any>): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${WP_API}${endpoint}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`WP PUT error ${res.status}: ${error}`);
  }
  return res.json();
}

export async function wpFindByMeta(postType: string, metaKey: string, metaValue: string | number): Promise<any | null> {
  const results = await wpGet<any[]>(`/wp/v2/${postType}`, {
    meta_key: metaKey,
    meta_value: String(metaValue),
    per_page: '1',
  });
  return results[0] ?? null;
}
