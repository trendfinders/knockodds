import 'dotenv/config';

const MMA_BASE = 'https://v1.mma.api-sports.io';
const API_KEY = process.env.API_SPORTS_KEY!;

interface MMAResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: any[];
  results: number;
  response: T;
}

export async function mmaFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T[]> {
  const url = new URL(`${MMA_BASE}/${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') url.searchParams.set(k, v);
    });
  }

  const res = await fetch(url.toString(), {
    headers: { 'x-apisports-key': API_KEY },
  });

  if (!res.ok) {
    throw new Error(`MMA API error ${res.status}: ${res.statusText} for ${endpoint}`);
  }

  const data: MMAResponse<T[]> = await res.json();

  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(`MMA API errors: ${JSON.stringify(data.errors)}`);
  }

  console.log(`[MMA API] ${endpoint} — ${data.results} results`);
  return data.response;
}
