import type { MMAResponse, Fighter, FighterRecord, Fight, FightResult, FighterStatistics, Odds, BetType, BookmakerInfo, Team, APIStatus } from '../types/mma-api';

const MMA_BASE = 'https://v1.mma.api-sports.io';

class MMAApiClient {
  private get apiKey(): string {
    const key = process.env.API_SPORTS_KEY;
    if (!key) throw new Error('API_SPORTS_KEY environment variable is required');
    return key;
  }

  private async fetch<T>(endpoint: string, params?: Record<string, string>, revalidate = 300): Promise<MMAResponse<T>> {
    const url = new URL(`${MMA_BASE}/${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') url.searchParams.set(k, v);
      });
    }

    console.log(`[MMA-API] Fetching: ${endpoint}`, params || '');

    const res = await fetch(url.toString(), {
      headers: { 'x-apisports-key': this.apiKey },
      next: { revalidate }
    });

    if (!res.ok) {
      const errMsg = `MMA API error ${res.status}: ${res.statusText} for ${endpoint}`;
      console.error(`[MMA-API] ${errMsg}`);
      throw new Error(errMsg);
    }

    const data: MMAResponse<T> = await res.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      const errMsg = `MMA API errors for ${endpoint}: ${JSON.stringify(data.errors)}`;
      console.error(`[MMA-API] ${errMsg}`);
      throw new Error(errMsg);
    }

    console.log(`[MMA-API] ${endpoint} returned ${data.results} results`);
    return data;
  }

  // Status (free, no quota)
  async getStatus(): Promise<APIStatus> {
    const res = await this.fetch<APIStatus>('status', undefined, 0);
    return res.response;
  }

  // Timezones
  async getTimezones(): Promise<string[]> {
    const res = await this.fetch<string[]>('timezone', undefined, 86400);
    return res.response;
  }

  // Seasons
  async getSeasons(): Promise<number[]> {
    const res = await this.fetch<number[]>('seasons', undefined, 86400);
    return res.response;
  }

  // Categories
  async getCategories(search?: string): Promise<string[]> {
    const res = await this.fetch<string[]>('categories', search ? { search } : undefined, 86400);
    return res.response;
  }

  // Teams
  async getTeams(params?: { id?: number; search?: string }): Promise<Team[]> {
    const p: Record<string, string> = {};
    if (params?.id) p.id = String(params.id);
    if (params?.search) p.search = params.search;
    const res = await this.fetch<Team[]>('teams', Object.keys(p).length ? p : undefined, 86400);
    return res.response;
  }

  // Fighters
  async getFighters(params: { id?: number; team?: number; name?: string; category?: string; search?: string }): Promise<Fighter[]> {
    const p: Record<string, string> = {};
    if (params.id) p.id = String(params.id);
    if (params.team) p.team = String(params.team);
    if (params.name) p.name = params.name;
    if (params.category) p.category = params.category;
    if (params.search) p.search = params.search;
    const res = await this.fetch<Fighter[]>('fighters', p, 3600);
    return res.response;
  }

  async getFighterById(id: number): Promise<Fighter | null> {
    const fighters = await this.getFighters({ id });
    return fighters[0] ?? null;
  }

  // Fighter Records
  async getFighterRecords(fighterId: number): Promise<FighterRecord | null> {
    const res = await this.fetch<FighterRecord[]>('fighters/records', { id: String(fighterId) }, 3600);
    return res.response[0] ?? null;
  }

  // Fights
  async getFights(params: { id?: number; date?: string; season?: number; fighter?: number; category?: string; timezone?: string }): Promise<Fight[]> {
    const p: Record<string, string> = {};
    if (params.id) p.id = String(params.id);
    if (params.date) p.date = params.date;
    if (params.season) p.season = String(params.season);
    if (params.fighter) p.fighter = String(params.fighter);
    if (params.category) p.category = params.category;
    if (params.timezone) p.timezone = params.timezone;
    const res = await this.fetch<Fight[]>('fights', p, 300);
    return res.response;
  }

  async getFightById(id: number): Promise<Fight | null> {
    const fights = await this.getFights({ id });
    return fights[0] ?? null;
  }

  // Fight Results
  async getFightResults(params: { id?: number; ids?: string; date?: string }): Promise<FightResult[]> {
    const p: Record<string, string> = {};
    if (params.id) p.id = String(params.id);
    if (params.ids) p.ids = params.ids;
    if (params.date) p.date = params.date;
    const res = await this.fetch<FightResult[]>('fights/results', p, 60);
    return res.response;
  }

  // Fighter Statistics per fight
  async getFighterStats(params: { id?: number; ids?: string; date?: string }): Promise<FighterStatistics[]> {
    const p: Record<string, string> = {};
    if (params.id) p.id = String(params.id);
    if (params.ids) p.ids = params.ids;
    if (params.date) p.date = params.date;
    const res = await this.fetch<FighterStatistics[]>('fights/statistics/fighters', p, 60);
    return res.response;
  }

  // Odds
  async getOdds(params: { fight?: number; date?: string; bookmaker?: number; bet?: number }): Promise<Odds[]> {
    const p: Record<string, string> = {};
    if (params.fight) p.fight = String(params.fight);
    if (params.date) p.date = params.date;
    if (params.bookmaker) p.bookmaker = String(params.bookmaker);
    if (params.bet) p.bet = String(params.bet);
    const res = await this.fetch<Odds[]>('odds', p, 900);
    return res.response;
  }

  // Bet Types
  async getBetTypes(params?: { id?: number; search?: string }): Promise<BetType[]> {
    const p: Record<string, string> = {};
    if (params?.id) p.id = String(params.id);
    if (params?.search) p.search = params.search;
    const res = await this.fetch<BetType[]>('odds/bets', Object.keys(p).length ? p : undefined, 86400);
    return res.response;
  }

  // Bookmakers
  async getBookmakers(params?: { id?: number; search?: string }): Promise<BookmakerInfo[]> {
    const p: Record<string, string> = {};
    if (params?.id) p.id = String(params.id);
    if (params?.search) p.search = params.search;
    const res = await this.fetch<BookmakerInfo[]>('odds/bookmakers', Object.keys(p).length ? p : undefined, 86400);
    return res.response;
  }
  // === Convenience methods ===

  /** Helper: generate date strings */
  private dateStr(offset: number): string {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  }

  /** Wait ms — used between API batches to avoid rate limits */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /** Get upcoming fights — checks next 14 days, 2 at a time with delays */
  async getUpcomingFights(): Promise<Fight[]> {
    const dates = Array.from({ length: 14 }, (_, i) => this.dateStr(i));
    const fights: Fight[] = [];
    for (let i = 0; i < dates.length; i += 2) {
      if (i > 0) await this.delay(1200); // 1.2s pause between batches
      const batch = dates.slice(i, i + 2);
      const results = await Promise.allSettled(
        batch.map(date => this.getFights({ date }))
      );
      for (const r of results) {
        if (r.status === 'fulfilled') fights.push(...r.value);
      }
    }
    return fights
      .filter(f => f.status.short !== 'FT' && f.status.short !== 'CANC')
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, 50);
  }

  /** Get fights by date string (YYYY-MM-DD) */
  async getFightsByDate(date: string): Promise<Fight[]> {
    try {
      return await this.getFights({ date });
    } catch (e) {
      console.error(`[MMA-API] getFightsByDate(${date}) failed:`, e);
      return [];
    }
  }

  /** Get recent results — checks last 7 days, 2 at a time with delays */
  async getRecentResults(): Promise<Fight[]> {
    const dates = Array.from({ length: 7 }, (_, i) => this.dateStr(-(i + 1)));
    const fights: Fight[] = [];
    for (let i = 0; i < dates.length; i += 2) {
      if (i > 0) await this.delay(1200);
      const batch = dates.slice(i, i + 2);
      const results = await Promise.allSettled(
        batch.map(date => this.getFights({ date }))
      );
      for (const r of results) {
        if (r.status === 'fulfilled') {
          fights.push(...r.value.filter(f => f.status.short === 'FT'));
        }
      }
    }
    return fights
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 30);
  }

  /** Search fighters with fallback */
  async searchFighters(query: string): Promise<Fighter[]> {
    try {
      return await this.getFighters({ search: query });
    } catch (e) {
      console.error(`[MMA-API] searchFighters failed:`, e);
      return [];
    }
  }

  /** Get fighters by weight class */
  async getFightersByCategory(category: string): Promise<Fighter[]> {
    try {
      return await this.getFighters({ category });
    } catch (e) {
      console.error(`[MMA-API] getFightersByCategory(${category}) failed:`, e);
      return [];
    }
  }
}

// Singleton
export const mmaApi = new MMAApiClient();
