import { unstable_cache } from 'next/cache';
import { generatePronostic, generatePronosticSummary, generateFighterBio, generateOddsAnalysis } from '@/lib/api/openai';
import type { PronosticResult, FighterBioResult, OddsAnalysisResult } from '@/lib/api/openai';

/**
 * Content cache using Next.js unstable_cache with revalidate: false (permanent).
 * Content is generated ONCE per unique key and cached forever.
 * To regenerate, call revalidateTag('predictions') / revalidateTag('fighter-bios') / revalidateTag('odds-analysis').
 */

export const getCachedPrediction = unstable_cache(
  async (fightKey: string, fighterData: string, locale: string): Promise<PronosticResult | null> => {
    console.log(`[CACHE] Generating prediction for: ${fightKey} (${locale})`);
    try {
      const result = await generatePronostic(fighterData, locale);
      console.log(`[CACHE] Prediction generated for: ${fightKey}`);
      return result;
    } catch (e) {
      console.error(`[CACHE] Failed to generate prediction for ${fightKey}:`, e);
      return null;
    }
  },
  ['predictions'],
  { revalidate: false, tags: ['predictions'] }
);

export const getCachedFighterBio = unstable_cache(
  async (fighterKey: string, fighterData: string, locale: string): Promise<FighterBioResult | null> => {
    console.log(`[CACHE] Generating fighter bio for: ${fighterKey} (${locale})`);
    try {
      const result = await generateFighterBio(fighterData, locale);
      console.log(`[CACHE] Fighter bio generated for: ${fighterKey}`);
      return result;
    } catch (e) {
      console.error(`[CACHE] Failed to generate fighter bio for ${fighterKey}:`, e);
      return null;
    }
  },
  ['fighter-bios'],
  { revalidate: false, tags: ['fighter-bios'] }
);

export const getCachedPredictionSummary = unstable_cache(
  async (fightKey: string, fighterData: string, locale: string): Promise<PronosticResult | null> => {
    console.log(`[CACHE] Generating prediction summary for: ${fightKey} (${locale})`);
    try {
      const result = await generatePronosticSummary(fighterData, locale);
      console.log(`[CACHE] Prediction summary generated for: ${fightKey}`);
      return result;
    } catch (e) {
      console.error(`[CACHE] Failed to generate prediction summary for ${fightKey}:`, e);
      return null;
    }
  },
  ['prediction-summaries'],
  { revalidate: false, tags: ['prediction-summaries'] }
);

export const getCachedOddsAnalysis = unstable_cache(
  async (fightKey: string, fightData: string, locale: string): Promise<OddsAnalysisResult | null> => {
    console.log(`[CACHE] Generating odds analysis for: ${fightKey} (${locale})`);
    try {
      const result = await generateOddsAnalysis(fightData, locale);
      console.log(`[CACHE] Odds analysis generated for: ${fightKey}`);
      return result;
    } catch (e) {
      console.error(`[CACHE] Failed to generate odds analysis for ${fightKey}:`, e);
      return null;
    }
  },
  ['odds-analysis'],
  { revalidate: false, tags: ['odds-analysis'] }
);
