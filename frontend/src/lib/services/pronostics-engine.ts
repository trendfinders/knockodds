import { mmaApi } from '../api/mma-api';
import { generatePronostic } from '../api/openai';
import type { Fighter, FighterRecord, Odds } from '../types/mma-api';
import type { Pronostic, PronosticScore, FighterAnalysis, ValueBet } from '../types/pronostic';

// Weights for scoring factors
const WEIGHTS = {
  winRate: 0.20,
  koRate: 0.15,
  recentForm: 0.20,
  styleMatchup: 0.15,
  oddsMovement: 0.10,
  physicalEdge: 0.10,
  activity: 0.10,
} as const;

function impliedProbability(decimalOdds: number): number {
  return (1 / decimalOdds) * 100;
}

function calcWinRate(record: FighterRecord): number {
  const total = record.total.win + record.total.loss + record.total.draw;
  if (total === 0) return 50;
  return (record.total.win / total) * 100;
}

function calcKoRate(record: FighterRecord): number {
  if (record.total.win === 0) return 0;
  return (record.ko.win / record.total.win) * 100;
}

function calcPhysicalEdge(fighter: Fighter, opponent: Fighter): number {
  // Parse reach in inches (format: "74'")
  const parseReach = (r: string) => parseFloat(r.replace("'", '')) || 0;
  const reachDiff = parseReach(fighter.reach) - parseReach(opponent.reach);

  // Normalize: +5 inches = 100 score, -5 = 0, 0 = 50
  return Math.max(0, Math.min(100, 50 + reachDiff * 10));
}

function calcStyleMatchup(f1: Fighter, f2: Fighter, r1: FighterRecord, r2: FighterRecord): number {
  // Striker vs Grappler heuristic
  const f1StrikerScore = r1.total.win > 0 ? r1.ko.win / r1.total.win : 0;
  const f2GrapplerScore = r2.total.win > 0 ? r2.sub.win / r2.total.win : 0;

  // Orthodox vs Southpaw slight advantage
  let stanceBonus = 0;
  if (f1.stance === 'Orthodox' && f2.stance === 'Southpaw') stanceBonus = 5;
  if (f1.stance === 'Southpaw' && f2.stance === 'Orthodox') stanceBonus = 5;

  return Math.min(100, 50 + (f1StrikerScore - f2GrapplerScore) * 30 + stanceBonus);
}

function findValueBets(odds: Odds[], predictedProb: number, fighterId: number): ValueBet[] {
  const valueBets: ValueBet[] = [];

  for (const odd of odds) {
    for (const bm of odd.bookmakers) {
      const homeAway = bm.bets.find(b => b.name === 'Home/Away');
      if (!homeAway) continue;

      for (const val of homeAway.values) {
        const decOdds = parseFloat(val.odd);
        const implied = impliedProbability(decOdds);
        const edge = predictedProb - implied;

        if (edge > 5) { // 5% minimum edge
          valueBets.push({
            bookmaker: bm.name,
            bookmaker_id: bm.id,
            bet_type: `${val.value} (Home/Away)`,
            odds: decOdds,
            implied_probability: implied,
            our_probability: predictedProb,
            edge,
            affiliate_url: '', // Filled by caller
          });
        }
      }
    }
  }

  return valueBets.sort((a, b) => b.edge - a.edge);
}

export async function generateFightPronostic(
  fightId: number,
  fighter1Id: number,
  fighter2Id: number,
  eventSlug: string,
  locale = 'en',
): Promise<Pronostic> {
  // Fetch all data in parallel
  const [f1, f2, r1, r2, odds] = await Promise.all([
    mmaApi.getFighterById(fighter1Id),
    mmaApi.getFighterById(fighter2Id),
    mmaApi.getFighterRecords(fighter1Id),
    mmaApi.getFighterRecords(fighter2Id),
    mmaApi.getOdds({ fight: fightId }).catch(() => [] as Odds[]),
  ]);

  if (!f1 || !f2) throw new Error(`Fighters not found: ${fighter1Id}, ${fighter2Id}`);
  if (!r1 || !r2) throw new Error(`Records not found for fighters`);

  // Calculate scores for fighter 1
  const score1: PronosticScore = {
    winRate: calcWinRate(r1),
    koRate: calcKoRate(r1),
    recentForm: 50, // Would need recent fights data
    styleMatchup: calcStyleMatchup(f1, f2, r1, r2),
    oddsMovement: 50, // Would need historical odds
    physicalEdge: calcPhysicalEdge(f1, f2),
    activity: 50, // Would need fights/year data
    weighted: 0,
  };
  score1.weighted = Object.entries(WEIGHTS).reduce(
    (sum, [key, weight]) => sum + score1[key as keyof typeof WEIGHTS] * weight, 0
  );

  // Calculate scores for fighter 2
  const score2: PronosticScore = {
    winRate: calcWinRate(r2),
    koRate: calcKoRate(r2),
    recentForm: 50,
    styleMatchup: calcStyleMatchup(f2, f1, r2, r1),
    oddsMovement: 50,
    physicalEdge: calcPhysicalEdge(f2, f1),
    activity: 50,
    weighted: 0,
  };
  score2.weighted = Object.entries(WEIGHTS).reduce(
    (sum, [key, weight]) => sum + score2[key as keyof typeof WEIGHTS] * weight, 0
  );

  // Normalize to probabilities
  const totalScore = score1.weighted + score2.weighted;
  const prob1 = (score1.weighted / totalScore) * 100;
  const prob2 = (score2.weighted / totalScore) * 100;

  const winnerId = prob1 >= prob2 ? fighter1Id : fighter2Id;
  const winnerScore = prob1 >= prob2 ? score1 : score2;
  const winnerRecord = prob1 >= prob2 ? r1 : r2;

  // Predict method
  let method: 'KO' | 'SUB' | 'DEC' = 'DEC';
  const koRatio = winnerRecord.ko.win / Math.max(winnerRecord.total.win, 1);
  const subRatio = winnerRecord.sub.win / Math.max(winnerRecord.total.win, 1);
  if (koRatio > 0.5) method = 'KO';
  else if (subRatio > 0.3) method = 'SUB';

  // Confidence (1-5)
  const scoreDiff = Math.abs(prob1 - prob2);
  let confidence: 1 | 2 | 3 | 4 | 5 = 3;
  if (scoreDiff > 25) confidence = 5;
  else if (scoreDiff > 15) confidence = 4;
  else if (scoreDiff > 5) confidence = 3;
  else confidence = 2;

  // Find value bets
  const valueBets = findValueBets(odds, Math.max(prob1, prob2), winnerId);

  // Generate AI analysis
  const fighterDataPrompt = `
Fight: ${f1.name} vs ${f2.name}
Event: ${eventSlug}
Category: ${f1.category}

${f1.name}: ${r1.total.win}W-${r1.total.loss}L, KO rate ${Math.round(koRatio * 100)}%, ${f1.stance}, reach ${f1.reach}
${f2.name}: ${r2.total.win}W-${r2.total.loss}L, KO rate ${Math.round(calcKoRate(r2))}%, ${f2.stance}, reach ${f2.reach}

Our analysis: ${winnerId === fighter1Id ? f1.name : f2.name} favored at ${Math.round(Math.max(prob1, prob2))}% probability.
Predicted method: ${method}. Confidence: ${confidence}/5.
${valueBets.length > 0 ? `Value bets found: ${valueBets.map(v => `${v.bookmaker} ${v.bet_type} @ ${v.odds}`).join(', ')}` : 'No significant value bets.'}
`;

  const aiResult = await generatePronostic(fighterDataPrompt, locale);

  // Build odds snapshot
  const oddsSnapshot: Record<string, number> = {};
  for (const o of odds) {
    for (const bm of o.bookmakers) {
      const ha = bm.bets.find(b => b.name === 'Home/Away');
      if (ha && ha.values[0]) {
        oddsSnapshot[bm.name] = parseFloat(ha.values[0].odd);
      }
    }
  }

  const analysis1: FighterAnalysis = {
    id: fighter1Id,
    name: f1.name,
    score: score1,
    probability: prob1,
    strengths: [],
    weaknesses: [],
  };

  const analysis2: FighterAnalysis = {
    id: fighter2Id,
    name: f2.name,
    score: score2,
    probability: prob2,
    strengths: [],
    weaknesses: [],
  };

  return {
    fight_id: fightId,
    event_slug: eventSlug,
    fighter1: analysis1,
    fighter2: analysis2,
    predicted_winner_id: winnerId,
    confidence,
    predicted_method: method,
    value_bets: valueBets,
    ai_analysis: aiResult.content,
    generated_at: new Date().toISOString(),
    odds_snapshot: oddsSnapshot,
  };
}
