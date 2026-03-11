import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { aiRewriteNews, aiGenerateSEO } from '../shared/openai-client.js';
import { wpPost, wpGet } from '../shared/wp-client.js';
import { createLogger } from '../shared/logger.js';

const log = createLogger('scrape-news');

const RSS_FEEDS = [
  { url: 'https://www.mmafighting.com/rss/current', name: 'MMA Fighting' },
  { url: 'https://www.sherdog.com/rss/news.xml', name: 'Sherdog' },
];

const parser = new Parser();

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

async function isAlreadyPublished(sourceUrl: string): Promise<boolean> {
  try {
    const existing = await wpGet<any[]>('/wp/v2/news', {
      meta_key: 'source_url',
      meta_value: sourceUrl,
      per_page: '1',
    });
    return existing.length > 0;
  } catch {
    return false;
  }
}

async function scrapeArticleContent(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UFCBestSiteBot/1.0)' },
    });
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove scripts, styles, nav, footer
    $('script, style, nav, footer, header, aside, .ad, .advertisement').remove();

    // Try common article selectors
    const selectors = ['article', '.article-body', '.entry-content', '.post-content', 'main'];
    for (const sel of selectors) {
      const text = $(sel).text().trim();
      if (text.length > 200) return text.substring(0, 5000);
    }

    return $('body').text().trim().substring(0, 5000);
  } catch (err) {
    log.error(`Failed to scrape ${url}`, { error: String(err) });
    return null;
  }
}

async function processArticle(item: Parser.Item, source: string) {
  const sourceUrl = item.link || '';
  if (!sourceUrl) return;

  if (await isAlreadyPublished(sourceUrl)) {
    log.debug(`Already published: ${item.title}`);
    return;
  }

  log.info(`Processing: ${item.title}`);

  // Scrape full content
  const content = await scrapeArticleContent(sourceUrl);
  if (!content || content.length < 200) {
    log.warn(`Insufficient content for: ${item.title}`);
    return;
  }

  // AI rewrite
  const rewritten = await aiRewriteNews(
    `Source: ${source}\nTitle: ${item.title}\nDate: ${item.pubDate}\n\nContent:\n${content}`
  );

  // Generate SEO meta
  const seo = await aiGenerateSEO(rewritten.content);

  // Publish to WordPress
  await wpPost('/wp/v2/news', {
    title: rewritten.title,
    content: rewritten.content,
    excerpt: rewritten.excerpt,
    status: 'publish',
    acf: {
      source_url: sourceUrl,
      original_title: item.title || '',
      rewrite_status: 'published',
      seo_title: seo.seo_title,
      meta_description: seo.meta_description,
      focus_keyword: seo.focus_keyword,
    },
  });

  log.info(`Published: ${rewritten.title}`);
}

async function main() {
  log.info('Starting news scraping job');

  for (const feed of RSS_FEEDS) {
    try {
      log.info(`Fetching RSS: ${feed.name}`);
      const rss = await parser.parseURL(feed.url);

      // Process latest 5 items per feed
      const items = rss.items.slice(0, 5);
      for (const item of items) {
        try {
          await processArticle(item, feed.name);
        } catch (err) {
          log.error(`Failed to process article: ${item.title}`, { error: String(err) });
        }
        await new Promise(r => setTimeout(r, 2000)); // Rate limit OpenAI
      }
    } catch (err) {
      log.error(`Failed to fetch RSS: ${feed.name}`, { error: String(err) });
    }
  }

  log.info('News scraping job completed');
}

main().catch((err) => {
  log.error('Job failed', { error: String(err) });
  process.exit(1);
});
