import { NextRequest, NextResponse } from 'next/server';
import { rewriteNews, generateSEOMeta } from '@/lib/api/openai';
import { getJWTToken } from '@/lib/api/wordpress';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 min

const WP_URL = process.env.WP_URL || 'http://localhost:8080';
const WP_API = `${WP_URL}/wp-json`;

const RSS_FEEDS = [
  { url: 'https://www.mmafighting.com/rss/current', name: 'MMA Fighting' },
  { url: 'https://mmajunkie.usatoday.com/feed', name: 'MMA Junkie' },
];

const MAX_ARTICLES_PER_RUN = 3;
const LOCALES_TO_PUBLISH = ['it', 'en', 'es', 'fr', 'de', 'pt'];

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  imageUrl: string | null;
}

function parseRSSItems(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] ?? block.match(/<title>(.*?)<\/title>/)?.[1] ?? '';
    const link = block.match(/<link>(.*?)<\/link>/)?.[1] ?? '';
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? '';
    const description = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/)?.[1] ?? '';

    // Try multiple image sources: media:content, media:thumbnail, enclosure, og:image in description
    const imageUrl =
      block.match(/<media:content[^>]+url="([^"]+)"/)?.[1] ??
      block.match(/<media:thumbnail[^>]+url="([^"]+)"/)?.[1] ??
      block.match(/<enclosure[^>]+url="([^"]+)"[^>]+type="image/)?.[1] ??
      block.match(/<img[^>]+src="([^"]+)"/)?.[1] ??
      null;

    if (title && link) {
      items.push({ title: decodeHTML(title), link, pubDate, description: decodeHTML(description), imageUrl });
    }
  }

  return items;
}

function decodeHTML(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .trim();
}

async function scrapeArticleContent(url: string): Promise<{ text: string; imageUrl: string | null }> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KnockOddsBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { text: '', imageUrl: null };

    const html = await res.text();

    // Extract first large image (og:image or content image)
    const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)?.[1] ?? null;

    // Extract article text — strip tags, get paragraphs
    // Remove scripts, styles, navs
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<aside[\s\S]*?<\/aside>/gi, '');

    // Try to get article body
    const articleMatch = cleaned.match(/<article[\s\S]*?<\/article>/i)?.[0] ??
      cleaned.match(/class="[^"]*article-body[^"]*"[\s\S]*?<\/div>/i)?.[0] ??
      cleaned.match(/class="[^"]*entry-content[^"]*"[\s\S]*?<\/div>/i)?.[0] ?? '';

    const textSource = articleMatch || cleaned;
    // Get paragraphs
    const paragraphs: string[] = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let pMatch;
    while ((pMatch = pRegex.exec(textSource)) !== null) {
      const text = pMatch[1].replace(/<[^>]*>/g, '').trim();
      if (text.length > 30) paragraphs.push(text);
    }

    const text = paragraphs.join('\n\n').substring(0, 5000);
    return { text, imageUrl: ogImage };
  } catch {
    return { text: '', imageUrl: null };
  }
}

async function isAlreadyPublished(sourceUrl: string, token: string): Promise<boolean> {
  try {
    const url = new URL(`${WP_API}/wp/v2/news`);
    url.searchParams.set('meta_key', 'source_url');
    url.searchParams.set('meta_value', sourceUrl);
    url.searchParams.set('per_page', '1');
    const res = await fetch(url.toString(), {
      headers: { 'Authorization': token },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

async function publishToWP(
  token: string,
  data: {
    title: string;
    content: string;
    excerpt: string;
    seo_title: string;
    meta_description: string;
    focus_keyword: string;
    source_url: string;
    original_title: string;
    featured_image_cdn: string;
    locale: string;
  }
) {
  const res = await fetch(`${WP_API}/wp/v2/news`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify({
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      status: 'publish',
      acf: {
        source_url: data.source_url,
        original_title: data.original_title,
        rewrite_status: 'published',
        seo_title: data.seo_title,
        meta_description: data.meta_description,
        focus_keyword: data.focus_keyword,
        featured_image_cdn: data.featured_image_cdn,
        locale: data.locale,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WP publish failed (${res.status}): ${err}`);
  }
  return res.json();
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const results: string[] = [];
  let published = 0;
  let skipped = 0;

  try {
    // Get WP JWT token
    let token: string;
    try {
      token = await getJWTToken();
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: 'Failed to authenticate with WordPress. Check WP_API_USER and WP_API_PASSWORD env vars.',
        detail: e instanceof Error ? e.message : String(e),
      }, { status: 500 });
    }

    // Fetch and parse all RSS feeds
    const allItems: Array<RSSItem & { source: string }> = [];
    for (const feed of RSS_FEEDS) {
      try {
        const res = await fetch(feed.url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KnockOddsBot/1.0)' },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) {
          results.push(`RSS ${feed.name}: HTTP ${res.status}`);
          continue;
        }
        const xml = await res.text();
        const items = parseRSSItems(xml);
        results.push(`RSS ${feed.name}: ${items.length} items`);
        for (const item of items.slice(0, 5)) {
          allItems.push({ ...item, source: feed.name });
        }
      } catch (e) {
        results.push(`RSS ${feed.name}: error - ${e instanceof Error ? e.message : 'unknown'}`);
      }
    }

    // Sort by date (newest first) and limit
    allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    const toProcess = allItems.slice(0, MAX_ARTICLES_PER_RUN);

    // Process each article
    for (const item of toProcess) {
      try {
        // Skip if already published
        if (await isAlreadyPublished(item.link, token)) {
          skipped++;
          continue;
        }

        // Scrape full content
        const scraped = await scrapeArticleContent(item.link);
        const content = scraped.text || item.description;
        if (content.length < 100) {
          results.push(`Skip "${item.title}": insufficient content`);
          continue;
        }

        const imageUrl = item.imageUrl || scraped.imageUrl || '';

        // Rewrite in Italian (primary locale)
        const rewritten = await rewriteNews(
          `Source: ${item.source}\nTitle: ${item.title}\nDate: ${item.pubDate}\n\nContent:\n${content}`,
          'it'
        );
        const seo = await generateSEOMeta(rewritten.content, 'it');

        // Publish Italian version
        await publishToWP(token, {
          title: rewritten.title,
          content: rewritten.content,
          excerpt: rewritten.excerpt,
          seo_title: seo.seo_title,
          meta_description: seo.meta_description,
          focus_keyword: seo.focus_keyword,
          source_url: item.link,
          original_title: item.title,
          featured_image_cdn: imageUrl,
          locale: 'it',
        });

        published++;
        results.push(`Published: "${rewritten.title}"`);

        // Rate limit between articles
        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        results.push(`Error "${item.title}": ${e instanceof Error ? e.message : 'unknown'}`);
      }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    return NextResponse.json({
      success: true,
      elapsed: `${elapsed}s`,
      published,
      skipped,
      results,
    });
  } catch (e) {
    return NextResponse.json({
      success: false,
      elapsed: `${((Date.now() - start) / 1000).toFixed(1)}s`,
      error: e instanceof Error ? e.message : 'Unknown error',
      results,
    }, { status: 500 });
  }
}
