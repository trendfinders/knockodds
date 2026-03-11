// API-Sports MMA API Response Types

export interface MMAResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: any[];
  results: number;
  response: T;
}

// Fighter
export interface Fighter {
  id: number;
  name: string;
  nickname: string | null;
  photo: string;
  gender: string;
  birth_date: string;
  age: number;
  height: string;
  weight: string;
  reach: string;
  stance: string;
  category: string;
  team: { id: number; name: string };
  last_update: string;
}

export interface FighterRecord {
  fighter: { id: number; name: string; photo: string };
  total: { win: number; loss: number; draw: number };
  ko: { win: number; loss: number };
  sub: { win: number; loss: number };
}

// Fights
export interface FightStatus {
  long: string;
  short: 'NS' | 'IN' | 'PF' | 'LIVE' | 'EOR' | 'FT' | 'WO' | 'CANC' | 'PST';
}

export interface FightFighter {
  id: number;
  name: string;
  logo: string;
  winner: boolean | null;
}

export interface Fight {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  slug: string;
  is_main: boolean;
  category: string;
  status: FightStatus;
  fighters: {
    first: FightFighter;
    second: FightFighter;
  };
}

export interface FightResult {
  fight: { id: number };
  won_type: 'KO' | 'SUB' | 'Points' | 'DQ' | string;
  round: number;
  minute: string;
  ko_type: string | null;
  target: string | null;
  sub_type: string | null;
  score: string[];
}

export interface FighterStatistics {
  fight: { id: number };
  fighter: { id: number };
  strikes: {
    total: { head: number; body: number; legs: number };
    power: { head: number; body: number; legs: number };
    takedowns: { attempt: number; landed: number };
    submissions: number;
    control_time: string;
    knockdowns: number;
  };
}

// Odds
export interface OddValue {
  value: string;
  odd: string;
}

export interface Bet {
  id: number;
  name: string;
  values: OddValue[];
}

export interface Bookmaker {
  id: number;
  name: string;
  bets: Bet[];
}

export interface Odds {
  fight: { id: number };
  bookmakers: Bookmaker[];
}

export interface BetType {
  id: number;
  name: string;
}

export interface BookmakerInfo {
  id: number;
  name: string;
}

// Teams & Categories
export interface Team {
  id: number;
  name: string;
}

// Status
export interface APIStatus {
  account: {
    firstname: string;
    lastname: string;
    email: string;
  };
  subscription: {
    plan: string;
    end: string;
    active: boolean;
  };
  requests: {
    current: number;
    limit_day: number;
  };
}
