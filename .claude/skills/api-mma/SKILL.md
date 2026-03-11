---
name: api-mma
description: Use when writing code that fetches MMA data from API-Sports, including fighters, fights, odds, results, statistics, categories, teams, seasons, or timezones
---

# API-Sports MMA Integration

## Overview

Reference for the API-Sports MMA API (v1). All MMA data flows through this API. Base URL: `https://v1.mma.api-sports.io/`

## Authentication

All requests require header: `x-apisports-key: YOUR_KEY`
Only GET requests allowed. No extra headers (some JS frameworks add them — remove them).

## Rate Limits

Response headers provide quota info:
- `x-ratelimit-requests-limit` — daily quota
- `x-ratelimit-requests-remaining` — remaining daily
- `X-Rate-Limit-Limit` — max calls/minute
- `X-Rate-Limit-Remaining` — remaining calls/minute

## TypeScript Client Pattern

```typescript
const MMA_BASE = 'https://v1.mma.api-sports.io';

interface MMAResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: any[];
  results: number;
  response: T;
}

async function mmaFetch<T>(endpoint: string, params?: Record<string, string>): Promise<MMAResponse<T>> {
  const url = new URL(`${MMA_BASE}/${endpoint}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { 'x-apisports-key': process.env.API_SPORTS_KEY! },
    next: { revalidate: 300 }
  });
  if (!res.ok) throw new Error(`MMA API ${res.status}`);
  return res.json();
}
```

## Endpoints Quick Reference

| Endpoint | Required Params | Key Params | Update Freq |
|---|---|---|---|
| `timezone` | none | — | Static |
| `seasons` | none | — | Static |
| `categories` | none | `search` | Static |
| `teams` | none | `id`, `search` | Static |
| `fighters` | ≥1 of: id,team,name,category,search | `id`, `team`, `name`, `category`, `search` | Daily |
| `fighters/records` | `id` (required) | `id` | Daily |
| `fights` | ≥1 of: id,date,season,fighter | `id`, `date`, `season`, `fighter`, `category`, `timezone` | 30s |
| `fights/results` | ≥1 of: id,ids,date | `id`, `ids`, `date` | 30s |
| `fights/statistics/fighters` | ≥1 of: id,ids,date | `id`, `ids`, `date` | 30s |
| `odds` | ≥1 of: fight,date | `fight`, `date`, `bookmaker`, `bet` | 4x daily |
| `odds/bets` | none | `id`, `search` | Static |
| `odds/bookmakers` | none | `id`, `search` | Static |
| `status` | none | — | Free |

## Fight Statuses

`NS` Not Started, `IN` Intros, `PF` Pre-fight, `LIVE` In Progress, `EOR` End of Round, `FT` Finished, `WO` Walkouts, `CANC` Cancelled, `PST` Postponed

## Key Response Types

```typescript
interface Fighter {
  id: number; name: string; nickname: string | null; photo: string;
  gender: string; birth_date: string; age: number;
  height: string; weight: string; reach: string; stance: string;
  category: string; team: { id: number; name: string };
}

interface FighterRecord {
  fighter: { id: number; name: string; photo: string };
  total: { win: number; loss: number; draw: number };
  ko: { win: number; loss: number };
  sub: { win: number; loss: number };
}

interface Fight {
  id: number; date: string; time: string; timestamp: number;
  timezone: string; slug: string; is_main: boolean; category: string;
  status: { long: string; short: string };
  fighters: {
    first: { id: number; name: string; logo: string; winner: boolean | null };
    second: { id: number; name: string; logo: string; winner: boolean | null };
  };
}

interface FightResult {
  fight: { id: number }; won_type: string; round: number; minute: string;
  ko_type: string | null; sub_type: string | null; score: string[];
}

interface Odds {
  fight: { id: number };
  bookmakers: Array<{
    id: number; name: string;
    bets: Array<{ id: number; name: string; values: Array<{ value: string; odd: string }> }>;
  }>;
}
```

## Usage Examples

```typescript
// Fighter by ID
const mcgregor = await mmaFetch<Fighter[]>('fighters', { id: '691' });
// Fights by date
const fights = await mmaFetch<Fight[]>('fights', { date: '2024-03-15' });
// Multiple fight results (dash-separated IDs)
const results = await mmaFetch<FightResult[]>('fights/results', { ids: '865-878-879' });
// Odds for a fight from specific bookmaker
const odds = await mmaFetch<Odds[]>('odds', { fight: '878', bookmaker: '2' });
```

## Common Mistakes

- Adding extra headers (Content-Type, Accept) — API rejects them
- Using POST instead of GET
- Calling `fighters` without parameters — requires at least one
- `ids` param uses dash separator `"865-878-879"` not comma
- Images/logos are free but rate-limited — cache locally
