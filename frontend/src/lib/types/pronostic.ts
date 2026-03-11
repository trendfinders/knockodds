// Pronostic Engine Types

export interface PronosticScore {
  winRate: number;       // 0-100
  koRate: number;        // 0-100
  recentForm: number;    // 0-100
  styleMatchup: number;  // 0-100
  oddsMovement: number;  // 0-100
  physicalEdge: number;  // 0-100
  activity: number;      // 0-100
  weighted: number;      // Final weighted score
}

export interface FighterAnalysis {
  id: number;
  name: string;
  score: PronosticScore;
  probability: number;   // 0-100
  strengths: string[];
  weaknesses: string[];
}

export interface ValueBet {
  bookmaker: string;
  bookmaker_id: number;
  bet_type: string;
  odds: number;
  implied_probability: number;
  our_probability: number;
  edge: number;           // our_probability - implied_probability
  affiliate_url: string;
}

export interface Pronostic {
  fight_id: number;
  event_slug: string;
  fighter1: FighterAnalysis;
  fighter2: FighterAnalysis;
  predicted_winner_id: number;
  confidence: 1 | 2 | 3 | 4 | 5;
  predicted_method: 'KO' | 'SUB' | 'DEC';
  value_bets: ValueBet[];
  ai_analysis: string;    // AI-generated narrative in Italian
  generated_at: string;
  odds_snapshot: Record<string, number>; // bookmaker -> decimal odds at time of analysis
}
