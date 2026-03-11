/**
 * One-time dictionary translation script
 *
 * Reads en.json as the source of truth and translates to all target locales
 * using OpenAI GPT-4o-mini.
 *
 * Usage:
 *   npx tsx scripts/translate-dictionaries.ts              # Translate all
 *   npx tsx scripts/translate-dictionaries.ts --locale es   # Single locale
 *   npx tsx scripts/translate-dictionaries.ts --dry-run     # Preview only
 */

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const DICTIONARIES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'dictionaries');

const TARGET_LOCALES = ['es', 'it', 'fr', 'de', 'pt', 'pt-br', 'ru', 'uk', 'bg', 'pl', 'el', 'es-mx'] as const;

const LOCALE_LANGUAGE_NAMES: Record<string, string> = {
  'es': 'Spanish (Spain)',
  'it': 'Italian',
  'fr': 'French',
  'de': 'German',
  'pt': 'Portuguese (Portugal)',
  'pt-br': 'Brazilian Portuguese',
  'ru': 'Russian',
  'uk': 'Ukrainian',
  'bg': 'Bulgarian',
  'pl': 'Polish',
  'el': 'Greek',
  'es-mx': 'Mexican Spanish',
};

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const localeIdx = args.indexOf('--locale');
  const singleLocale = localeIdx !== -1 ? args[localeIdx + 1] : null;

  if (singleLocale && !TARGET_LOCALES.includes(singleLocale as any)) {
    console.error(`Invalid locale: ${singleLocale}`);
    console.error(`Valid locales: ${TARGET_LOCALES.join(', ')}`);
    process.exit(1);
  }

  // Read source dictionary
  const sourcePath = path.join(DICTIONARIES_DIR, 'en.json');
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
  console.log(`Source: en.json (${Object.keys(source).length} sections)`);

  // Init OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }
  const openai = new OpenAI({ apiKey });

  const localesToTranslate = singleLocale
    ? [singleLocale as typeof TARGET_LOCALES[number]]
    : [...TARGET_LOCALES];

  console.log(`\nTranslating to: ${localesToTranslate.join(', ')}${dryRun ? ' (DRY RUN)' : ''}\n`);

  for (const locale of localesToTranslate) {
    const languageName = LOCALE_LANGUAGE_NAMES[locale];
    console.log(`Translating to ${languageName} (${locale})...`);

    try {
      const translated = await translateDictionary(openai, source, languageName);

      // Validate structure matches source
      const valid = validateStructure(source, translated);
      if (!valid) {
        console.error(`  ✗ Structure mismatch for ${locale}, skipping`);
        continue;
      }

      if (dryRun) {
        console.log(`  ✓ Would write ${locale}.json (dry run)`);
        // Show a sample
        console.log(`    Sample: metadata.siteName = "${translated.metadata?.siteName}"`);
        console.log(`    Sample: nav.home = "${translated.nav?.home}"`);
      } else {
        const outputPath = path.join(DICTIONARIES_DIR, `${locale}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(translated, null, 2) + '\n', 'utf-8');
        console.log(`  ✓ Written ${locale}.json`);
      }
    } catch (err: any) {
      console.error(`  ✗ Error translating ${locale}: ${err.message}`);
    }
  }

  console.log('\nDone!');
}

async function translateDictionary(
  openai: OpenAI,
  source: Record<string, any>,
  targetLanguage: string,
): Promise<Record<string, any>> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a professional translator. Translate the JSON values from English to ${targetLanguage}.

Rules:
- Translate ONLY the values, never the keys
- Keep the brand name "KnockOdds" unchanged in ALL languages
- Keep technical terms unchanged: KO, SUB, MMA, UFC, Bellator, PFL, ONE Championship
- Keep placeholders unchanged: {year}, {event}
- Keep HTML entities unchanged: &larr; &rarr; etc.
- Keep currency codes, symbols, and format examples unchanged (e.g. "Decimal (1.50)")
- Translate naturally for the target audience, not word-for-word
- Return valid JSON with the exact same structure`,
      },
      {
        role: 'user',
        content: JSON.stringify(source, null, 2),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');

  return JSON.parse(content);
}

function validateStructure(source: Record<string, any>, translated: Record<string, any>): boolean {
  const sourceKeys = getAllKeys(source);
  const translatedKeys = getAllKeys(translated);

  const missing = sourceKeys.filter(k => !translatedKeys.includes(k));
  const extra = translatedKeys.filter(k => !sourceKeys.includes(k));

  if (missing.length > 0) {
    console.error(`    Missing keys: ${missing.join(', ')}`);
  }
  if (extra.length > 0) {
    console.warn(`    Extra keys (ignored): ${extra.join(', ')}`);
  }

  // Allow if at least 90% of keys are present
  return missing.length <= Math.ceil(sourceKeys.length * 0.1);
}

function getAllKeys(obj: Record<string, any>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
