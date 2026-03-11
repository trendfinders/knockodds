import 'dotenv/config';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function aiGenerate(systemPrompt: string, userPrompt: string, maxTokens = 1500): Promise<string> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = res.choices[0].message.content ?? '{}';
  console.log(`[OpenAI] Used ${res.usage?.total_tokens ?? 0} tokens`);
  return content;
}

export async function aiRewriteNews(originalArticle: string): Promise<{
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
}> {
  const systemPrompt = `Sei un esperto giornalista MMA che scrive per un pubblico italiano. Riscrivi il seguente articolo con parole tue. Regole:
- Scrivi in italiano
- Mantieni tutti i fatti, nomi, date e statistiche esattamente
- Aggiungi analisi esperta e contesto dove appropriato
- Usa un tono coinvolgente e professionale
- Struttura: titolo accattivante, paragrafo introduttivo, corpo con sottotitoli H2/H3, conclusione
- Includi keywords rilevanti naturalmente per la SEO
- Il contenuto deve essere tra 400-800 parole
- Formato output: JSON { "title": "...", "excerpt": "...", "content": "...", "tags": [...] }`;

  const raw = await aiGenerate(systemPrompt, originalArticle, 2000);
  return JSON.parse(raw);
}

export async function aiGeneratePronostic(fighterData: string): Promise<{
  title: string;
  excerpt: string;
  content: string;
  prediction: { winner_id: number; confidence: number; method: string; recommended_bet: string };
  tags: string[];
}> {
  const systemPrompt = `Sei un analista MMA esperto che scrive pronostici per un pubblico italiano. Date le statistiche dei fighter, record e quote, crea un pronostico dettagliato. Regole:
- Scrivi in italiano
- Analizza punti di forza e debolezza di entrambi i fighter
- Fai riferimento a statistiche specifiche (tasso KO, submission, reach, stance)
- Considera la forma recente e il matchup stilistico
- Dai una previsione chiara con livello di confidenza (1-5 stelle)
- Includi il tipo di scommessa consigliata se le quote offrono valore
- Sii responsabile: menziona sempre che le scommesse comportano rischi
- Il contenuto deve essere tra 600-1200 parole
- Formato output: JSON { "title": "...", "excerpt": "...", "content": "...", "prediction": { "winner_id": N, "confidence": N, "method": "KO|SUB|DEC", "recommended_bet": "..." }, "tags": [...] }`;

  const raw = await aiGenerate(systemPrompt, fighterData, 3000);
  return JSON.parse(raw);
}

export async function aiGenerateSEO(content: string): Promise<{
  seo_title: string;
  meta_description: string;
  focus_keyword: string;
  keywords: string[];
}> {
  const systemPrompt = `Sei uno specialista SEO per un sito web MMA italiano. Genera metadata ottimizzati. Regole:
- Title: max 60 caratteri, includi keyword principale, accattivante
- Meta description: max 155 caratteri, includi CTA, keyword primaria + secondaria
- Focus keyword e 3-5 keyword correlate
- Formato output: JSON { "seo_title": "...", "meta_description": "...", "focus_keyword": "...", "keywords": [...] }`;

  const raw = await aiGenerate(systemPrompt, `Genera SEO per:\n${content.substring(0, 1000)}`, 400);
  return JSON.parse(raw);
}
