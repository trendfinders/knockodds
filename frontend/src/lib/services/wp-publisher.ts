import { publishPost, getJWTToken } from '../api/wordpress';
import { optimizeForSEO } from './seo-optimizer';
import type { NewsRewriteResult, PronosticResult } from '../api/openai';

export async function publishNews(article: NewsRewriteResult, sourceUrl: string): Promise<number> {
  const token = await getJWTToken();
  const seo = await optimizeForSEO(article.content, 'news', slugify(article.title));

  const post = await publishPost('news', {
    title: article.title,
    content: article.content,
    excerpt: article.excerpt,
    acf: {
      source_url: sourceUrl,
      original_title: article.title,
      rewrite_status: 'published',
      seo_title: seo.title,
      meta_description: seo.description,
      focus_keyword: seo.focusKeyword,
    },
  }, token);

  return post.id;
}

export async function publishPronostic(
  pronostic: PronosticResult,
  fightApiId: number,
  oddsSnapshot: Record<string, number>,
): Promise<number> {
  const token = await getJWTToken();

  const post = await publishPost('pronostic', {
    title: pronostic.title,
    content: pronostic.content,
    excerpt: pronostic.excerpt,
    acf: {
      fight_api_id: fightApiId,
      predicted_winner_id: pronostic.prediction.winner_id,
      confidence: pronostic.prediction.confidence,
      predicted_method: pronostic.prediction.method,
      value_bets: JSON.stringify([]),
      analysis_data: JSON.stringify(pronostic),
      odds_snapshot: JSON.stringify(oddsSnapshot),
    },
  }, token);

  return post.id;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
