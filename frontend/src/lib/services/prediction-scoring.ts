export interface PredictionResult {
  winnerName: string;
  method: 'KO' | 'SUB' | 'DEC';
  round: number | null;
}

export interface ScoringInput {
  pick: string;
  method: 'KO' | 'SUB' | 'DEC';
  round: number | null;
  confidence: number;
  currentStreak: number;
}

export interface ScoringOutput {
  won: boolean;
  points: number;
  newStreak: number;
}

const STREAK_MULTIPLIERS: [number, number][] = [
  [10, 2.0],
  [5, 1.5],
  [3, 1.25],
];

function getStreakMultiplier(streak: number): number {
  for (const [threshold, mult] of STREAK_MULTIPLIERS) {
    if (streak >= threshold) return mult;
  }
  return 1;
}

export function scorePrediction(input: ScoringInput, result: PredictionResult): ScoringOutput {
  const correctWinner = input.pick.toLowerCase() === result.winnerName.toLowerCase();

  if (!correctWinner) {
    return { won: false, points: 0, newStreak: Math.min(input.currentStreak, 0) - 1 };
  }

  let base = 10; // correct winner

  const correctMethod = input.method === result.method;
  if (correctMethod) base += 5;

  const correctRound = input.round != null && result.round != null && input.round === result.round;
  if (correctRound) base += 10;

  // Perfect prediction bonus
  if (correctMethod && correctRound) base += 5;

  // High conviction bonus
  if (input.confidence >= 4) base += 2;

  const newStreak = Math.max(input.currentStreak, 0) + 1;
  const multiplier = getStreakMultiplier(newStreak);
  const points = Math.round(base * multiplier);

  return { won: true, points, newStreak };
}

const RANK_THRESHOLDS: [number, string][] = [
  [1500, 'Champion'],
  [700, 'Master'],
  [350, 'Expert'],
  [150, 'Veteran'],
  [50, 'Contender'],
  [1, 'Amateur'],
];

export function getRankTitle(totalPoints: number): string {
  for (const [threshold, title] of RANK_THRESHOLDS) {
    if (totalPoints >= threshold) return title;
  }
  return 'Rookie';
}

/** Map API-Sports won_type to our method format */
export function normalizeMethod(wonType: string): 'KO' | 'SUB' | 'DEC' {
  const t = wonType.toLowerCase();
  if (t.includes('ko') || t.includes('tko')) return 'KO';
  if (t.includes('sub')) return 'SUB';
  return 'DEC';
}
