---
name: content-generation
description: Use when generating or rewriting MMA news articles, fight previews, or pronostic content using OpenAI 4o-mini for the UFC Best Site platform
---

# AI Content Generation for MMA

## Overview

Uses OpenAI GPT-4o-mini to generate original MMA content in Italian: news rewrites, fight previews, pronostics, and SEO metadata. All content must be unique, SEO-optimized, and factually accurate.

## Client Pattern

```typescript
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generate(systemPrompt: string, userPrompt: string, maxTokens = 1500): Promise<string> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
    max_tokens: maxTokens, temperature: 0.7,
    response_format: { type: 'json_object' }
  });
  return res.choices[0].message.content ?? '{}';
}
```

## System Prompts

**News Rewrite**: "Sei un esperto giornalista MMA per pubblico italiano. Riscrivi con parole tue. Mantieni fatti esatti. Tono professionale. JSON output: title, excerpt, content, tags."

**Pronostic**: "Sei un analista MMA esperto. Analizza forze/debolezze, stats specifiche, forma recente, matchup stilistico. Previsione con confidenza 1-5. Menziona rischi scommesse. JSON: title, excerpt, content, prediction, tags."

**SEO Meta**: "Specialista SEO per sito MMA italiano. Title max 60 chars, description max 155. JSON: seo_title, meta_description, focus_keyword, keywords."

## Content Length

| Type | Words | Tokens |
|---|---|---|
| News rewrite | 400-800 | 2000 |
| Pronostic | 600-1200 | 3000 |
| SEO meta | ~50 | 400 |

## Anti-Plagiarism Rules

1. Never copy sentences verbatim
2. Restructure paragraph order
3. Replace quotes with paraphrases
4. Add original analysis
5. Use different headline angle

## Cost Estimate

GPT-4o-mini: ~$0.15/1M input, ~$0.60/1M output. ~$1.76/day for 30 articles + 5 pronostics.
