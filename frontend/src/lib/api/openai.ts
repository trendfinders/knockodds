import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const LOCALE_LANGUAGES: Record<string, string> = {
  'en': 'English', 'es': 'Spanish', 'it': 'Italian', 'fr': 'French',
  'de': 'German', 'pt': 'Portuguese', 'pt-br': 'Brazilian Portuguese',
  'ru': 'Russian', 'uk': 'Ukrainian', 'bg': 'Bulgarian',
  'pl': 'Polish', 'el': 'Greek', 'es-mx': 'Mexican Spanish',
};

function lang(locale: string): string {
  return LOCALE_LANGUAGES[locale] || 'English';
}

const HTML_RULES = `
CRITICAL HTML RULES:
- Output ONLY clean HTML using these tags: <p>, <b>, <strong>, <em>, <table>, <thead>, <tbody>, <tr>, <th>, <td>, <ol>, <ul>, <li>, <blockquote>, <h2>, <h3>
- NO <div>, <span>, <br>, <img>, <a>, <script>, <style>, <h1>, <h4>, <h5>, <h6>
- NO markdown, NO code blocks, NO raw text outside tags
- Every paragraph must be in a <p> tag
- Use <h2> and <h3> for section headings only`;

const TONE_RULES = `
TONE: Write like a seasoned MMA journalist. Authoritative, engaging, human.
- Use vivid language, metaphors, and fight-specific terminology
- Reference specific stats naturally, don't list them robotically
- Build narrative tension, tell a story
- Be opinionated but fair — take a clear stance with reasoning
- Write like a columnist, NOT like a Wikipedia article or an AI`;

// === PROMPTS ===

function pronosticPrompt(locale: string): string {
  const italianSEO = locale === 'it' ? `
ITALIAN SEO REQUIREMENTS (CRITICAL):
- The title MUST include the word "Pronostico" (NOT "Previsione" or "Analisi") followed by both fighter names
- Example title format: "Pronostico Jones vs Miocic: KO al 2° round"
- The excerpt MUST contain "pronostico" and both fighter names
- Naturally weave these keywords into the content: "pronostico", "consigli scommesse", "quote", "value bet"
- Use these Italian section headings: "Analisi del Combattimento", "Il Nostro Pronostico", "Scommessa Consigliata"
- Write like a seasoned Italian tipster — confident, direct, with real betting insight
` : '';

  return `You are a veteran MMA analyst and combat sports journalist writing for KnockOdds.com in ${lang(locale)}.

Given fighter data, produce a detailed fight prediction article.

${TONE_RULES}
${italianSEO}

STRUCTURE:
1. Opening paragraph: set the scene, stakes, why this fight matters
2. <h2> section analyzing Fighter 1 — strengths, recent form, style
3. <h2> section analyzing Fighter 2 — strengths, recent form, style
4. <h2> "Stylistic Breakdown" — how styles clash, key matchup factors
5. <h2> "Our Prediction" — clear pick with reasoning, confidence, method
6. Final <p> with responsible gambling disclaimer

${HTML_RULES}

Write in ${lang(locale)}.

Output JSON:
{
  "title": "catchy journalistic title (max 80 chars)",
  "excerpt": "compelling 1-2 sentence summary for SEO (max 160 chars)",
  "content": "full HTML article (800-1200 words)",
  "prediction": {
    "winner_name": "Name of predicted winner",
    "confidence": 1-5,
    "method": "KO|SUB|DEC",
    "recommended_bet": "specific bet recommendation or empty string"
  },
  "tags": ["tag1", "tag2"]
}`;
}

function fighterBioPrompt(locale: string): string {
  return `You are a veteran MMA journalist writing fighter profiles for KnockOdds.com in ${lang(locale)}.

Given a fighter's stats and record, write an engaging biographical profile.

${TONE_RULES}

STRUCTURE:
1. Opening <p>: who is this fighter, what defines them
2. <h2> "Career Overview" — trajectory, key victories, signature moments
3. <h2> "Fighting Style" — breakdown of technique, strengths, weaknesses
4. <h2> "By the Numbers" — use a <table> with key stats (record, KO rate, etc.)
5. Closing <p>: where they stand now, what's next

${HTML_RULES}

Write in ${lang(locale)}.

Output JSON:
{
  "title": "profile title",
  "content": "full HTML profile (400-600 words)",
  "excerpt": "1 sentence summary (max 160 chars)"
}`;
}

function oddsAnalysisPrompt(locale: string): string {
  return `You are a sharp MMA betting analyst writing for KnockOdds.com in ${lang(locale)}.

Given fight data and bookmaker odds, produce a betting analysis article.

${TONE_RULES}

Focus on:
- Where the value lies in the odds
- Which bookmaker offers the best line
- Historical context for similar matchups
- Risk assessment

STRUCTURE:
1. Opening <p>: the betting landscape for this fight
2. <h2> "Odds Breakdown" — analyze the lines, which side is getting value
3. <h2> "Key Factors" — what influences the outcome from a betting perspective
4. <h2> "Our Take" — recommended approach with reasoning
5. Final <p>: responsible gambling reminder

${HTML_RULES}

Write in ${lang(locale)}.

Output JSON:
{
  "title": "catchy analysis title (max 80 chars)",
  "content": "full HTML article (400-700 words)",
  "excerpt": "1-2 sentence summary (max 160 chars)"
}`;
}

function newsRewritePrompt(locale: string): string {
  return `You are a senior MMA journalist rewriting news for KnockOdds.com in ${lang(locale)}.

Rewrite the article in your own words with expert analysis.

${TONE_RULES}
${HTML_RULES}

Write in ${lang(locale)}.

Output JSON:
{
  "title": "engaging headline (max 80 chars)",
  "excerpt": "compelling summary (max 160 chars)",
  "content": "full HTML article",
  "tags": ["tag1", "tag2"]
}`;
}

function seoMetaPrompt(locale: string): string {
  return `SEO specialist for KnockOdds.com. Generate metadata in ${lang(locale)}.
Output JSON: { "seo_title": "max 60 chars", "meta_description": "max 155 chars", "focus_keyword": "...", "keywords": [...] }`;
}

// === TYPES ===

export interface PronosticResult {
  title: string;
  excerpt: string;
  content: string;
  prediction: {
    winner_name: string;
    winner_id?: number;
    confidence: number;
    method: 'KO' | 'SUB' | 'DEC';
    recommended_bet: string;
  };
  tags: string[];
}

export interface FighterBioResult {
  title: string;
  content: string;
  excerpt: string;
}

export interface OddsAnalysisResult {
  title: string;
  content: string;
  excerpt: string;
}

export interface NewsRewriteResult {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
}

export interface SEOMetaResult {
  seo_title: string;
  meta_description: string;
  focus_keyword: string;
  keywords: string[];
}

// === GENERATION ===

async function generate(systemPrompt: string, userPrompt: string, maxTokens = 1500): Promise<string> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: maxTokens,
    temperature: 0.7,
    response_format: { type: 'json_object' }
  });
  return res.choices[0].message.content ?? '{}';
}

export async function generatePronostic(fighterData: string, locale = 'en'): Promise<PronosticResult> {
  const raw = await generate(pronosticPrompt(locale), fighterData, 4000);
  return JSON.parse(raw);
}

export async function generateFighterBio(fighterData: string, locale = 'en'): Promise<FighterBioResult> {
  const raw = await generate(fighterBioPrompt(locale), fighterData, 2500);
  return JSON.parse(raw);
}

export async function generateOddsAnalysis(fightData: string, locale = 'en'): Promise<OddsAnalysisResult> {
  const raw = await generate(oddsAnalysisPrompt(locale), fightData, 3000);
  return JSON.parse(raw);
}

export async function rewriteNews(originalArticle: string, locale = 'en'): Promise<NewsRewriteResult> {
  const raw = await generate(newsRewritePrompt(locale), originalArticle, 2000);
  return JSON.parse(raw);
}

export async function generateSEOMeta(content: string, locale = 'en'): Promise<SEOMetaResult> {
  const raw = await generate(seoMetaPrompt(locale), content, 400);
  return JSON.parse(raw);
}

// === SHORT SUMMARY FOR GAMIFICATION ===

function pronosticSummaryPrompt(locale: string): string {
  const italianSEO = locale === 'it' ? `
ITALIAN: Use "pronostico" (NOT "previsione"). Include both fighter names. Weave in "quote" and "consigli scommesse" naturally.` : '';

  return `You are a veteran MMA analyst writing a BRIEF fight summary for KnockOdds.com in ${lang(locale)}.

Given fighter data, produce a CONCISE fight preview in UNDER 100 WORDS.
Focus on: the key matchup factor, style clash, and your pick with clear reasoning.
End with a compelling one-line call to action inviting readers to make their own prediction.

TONE: Punchy, confident, opinionated. Every word counts. Write like a tipster, not an encyclopedia.
${italianSEO}
${HTML_RULES}

Write in ${lang(locale)}.

Output JSON:
{
  "title": "catchy title (max 80 chars)",
  "excerpt": "1 sentence (max 160 chars)",
  "content": "HTML summary UNDER 100 words — 2-3 short paragraphs max",
  "prediction": {
    "winner_name": "Name of predicted winner",
    "confidence": 1-5,
    "method": "KO|SUB|DEC",
    "recommended_bet": "specific bet recommendation or empty string"
  },
  "tags": ["tag1", "tag2"]
}`;
}

export async function generatePronosticSummary(fighterData: string, locale = 'en'): Promise<PronosticResult> {
  const raw = await generate(pronosticSummaryPrompt(locale), fighterData, 800);
  return JSON.parse(raw);
}
