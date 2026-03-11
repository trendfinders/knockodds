import type { WPPost, WPNewsPost, WPFighterPost, WPFightPost, WPPronosticPost, WPMedia, WPCategory, WPPaginatedResponse } from '../types/wordpress';

const WP_URL = process.env.WP_URL || 'http://localhost:8080';
const WP_API = `${WP_URL}/wp-json`;

interface FetchOptions {
  revalidate?: number;
  token?: string;
}

async function wpFetch<T>(endpoint: string, params?: Record<string, string>, options: FetchOptions = {}): Promise<T> {
  const url = new URL(`${WP_API}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  url.searchParams.set('_embed', 'true');

  const headers: Record<string, string> = {};
  if (options.token) {
    headers['Authorization'] = options.token;
  }

  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: options.revalidate ?? 300 }
  });

  if (!res.ok) {
    throw new Error(`WordPress API error ${res.status}: ${res.statusText} for ${endpoint}`);
  }

  return res.json();
}

async function wpFetchPaginated<T>(endpoint: string, params?: Record<string, string>, options: FetchOptions = {}): Promise<WPPaginatedResponse<T>> {
  const url = new URL(`${WP_API}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  url.searchParams.set('_embed', 'true');

  const headers: Record<string, string> = {};
  if (options.token) {
    headers['Authorization'] = options.token;
  }

  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: options.revalidate ?? 300 }
  });

  if (!res.ok) {
    throw new Error(`WordPress API error ${res.status}: ${res.statusText}`);
  }

  const data: T[] = await res.json();
  const total = parseInt(res.headers.get('X-WP-Total') || '0', 10);
  const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '0', 10);

  return { data, total, totalPages };
}

// News
export async function getNews(page = 1, perPage = 10): Promise<WPPaginatedResponse<WPNewsPost>> {
  return wpFetchPaginated<WPNewsPost>('/wp/v2/news', { page: String(page), per_page: String(perPage), orderby: 'date', order: 'desc' });
}

export async function getNewsBySlug(slug: string): Promise<WPNewsPost | null> {
  const posts = await wpFetch<WPNewsPost[]>('/wp/v2/news', { slug });
  return posts[0] ?? null;
}

// Fighters
export async function getFighters(page = 1, perPage = 20): Promise<WPPaginatedResponse<WPFighterPost>> {
  return wpFetchPaginated<WPFighterPost>('/wp/v2/fighter', { page: String(page), per_page: String(perPage) });
}

export async function getFighterByApiId(apiId: number): Promise<WPFighterPost | null> {
  const posts = await wpFetch<WPFighterPost[]>('/wp/v2/fighter', { 'meta_key': 'fighter_api_id', 'meta_value': String(apiId) });
  return posts[0] ?? null;
}

// Fights
export async function getUpcomingFights(perPage = 10): Promise<WPFightPost[]> {
  return wpFetch<WPFightPost[]>('/ufc/v1/upcoming-fights', { per_page: String(perPage) }, { revalidate: 60 });
}

export async function getFightByApiId(apiId: number): Promise<WPFightPost | null> {
  const posts = await wpFetch<WPFightPost[]>('/wp/v2/fight', { 'meta_key': 'fight_api_id', 'meta_value': String(apiId) });
  return posts[0] ?? null;
}

// Pronostics
export async function getPronostics(page = 1, perPage = 10): Promise<WPPaginatedResponse<WPPronosticPost>> {
  return wpFetchPaginated<WPPronosticPost>('/wp/v2/pronostic', { page: String(page), per_page: String(perPage), orderby: 'date', order: 'desc' });
}

export async function getPronosticBySlug(slug: string): Promise<WPPronosticPost | null> {
  const posts = await wpFetch<WPPronosticPost[]>('/wp/v2/pronostic', { slug });
  return posts[0] ?? null;
}

export async function getPronosticByFightId(fightApiId: number): Promise<WPPronosticPost | null> {
  const posts = await wpFetch<WPPronosticPost[]>('/wp/v2/pronostic', { 'meta_key': 'fight_api_id', 'meta_value': String(fightApiId) });
  return posts[0] ?? null;
}

// Media
export async function getMedia(id: number): Promise<WPMedia> {
  return wpFetch<WPMedia>(`/wp/v2/media/${id}`);
}

// Categories
export async function getCategories(): Promise<WPCategory[]> {
  return wpFetch<WPCategory[]>('/wp/v2/categories', { per_page: '100' }, { revalidate: 3600 });
}

// Publishing (server-side only, requires auth)
export async function publishPost(type: string, data: Record<string, any>, token: string): Promise<WPPost> {
  const res = await fetch(`${WP_API}/wp/v2/${type}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    },
    body: JSON.stringify({ ...data, status: 'publish' })
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`WordPress publish error ${res.status}: ${error}`);
  }

  return res.json();
}

// All Articles (for homepage — mixed categories, sorted by date)
export interface HomeArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image?: string;
}

export async function getAllArticles(page = 1, perPage = 20): Promise<{ articles: HomeArticle[]; total: number }> {
  try {
    const data = await wpFetchPaginated<WPNewsPost>('/wp/v2/news', {
      page: String(page),
      per_page: String(perPage),
      orderby: 'date',
      order: 'desc',
    });
    const articles: HomeArticle[] = data.data.map((post) => ({
      slug: post.slug,
      title: post.title.rendered,
      excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, '').slice(0, 200),
      category: 'News',
      date: new Date(post.date).toISOString().split('T')[0],
      readTime: `${Math.ceil(post.content.rendered.split(/\s+/).length / 200)} min`,
      image: post.acf?.featured_image_cdn,
    }));
    return { articles, total: data.total };
  } catch {
    // Fallback mock data when WP is not available
    return getMockArticles(page, perPage);
  }
}

function getMockArticles(page: number, perPage: number): { articles: HomeArticle[]; total: number } {
  const allMock: HomeArticle[] = [
    { slug: 'ufc-310-main-event-preview', title: 'UFC 310: Main Event Preview and Full Card Analysis', excerpt: 'Everything you need to know about the upcoming UFC 310 pay-per-view event, including full card breakdown and expert analysis.', category: 'Events', date: '2026-03-09', readTime: '8 min' },
    { slug: 'jon-jones-retirement-update', title: 'Jon Jones Addresses Retirement Rumors After UFC 310 Announcement', excerpt: 'The heavyweight champion breaks his silence on retirement speculation following the latest UFC announcement.', category: 'News', date: '2026-03-09', readTime: '4 min' },
    { slug: 'islam-makhachev-training-camp', title: 'Islam Makhachev Opens New Training Camp Ahead of Title Defense', excerpt: 'The lightweight champion reveals his preparation strategy for his upcoming title defense.', category: 'News', date: '2026-03-08', readTime: '5 min' },
    { slug: 'ufc-lightweight-rankings-shake-up', title: 'UFC Lightweight Rankings: Major Shake-Up After Fight Night Results', excerpt: 'Several fighters move up and down the rankings following a dramatic Fight Night event.', category: 'Rankings', date: '2026-03-08', readTime: '6 min' },
    { slug: 'alex-pereira-move-to-heavyweight', title: 'Alex Pereira Confirms Intentions to Move to Heavyweight Division', excerpt: 'The light heavyweight champion discusses his plans to challenge for a second belt.', category: 'News', date: '2026-03-07', readTime: '3 min' },
    { slug: 'bellator-champions-series-card', title: 'Bellator Champions Series: Full Card Announced for April Event', excerpt: 'A stacked card featuring multiple title fights has been announced for the upcoming Bellator event.', category: 'Bellator', date: '2026-03-07', readTime: '5 min' },
    { slug: 'pfl-2026-season-format-changes', title: 'PFL Announces Major Format Changes for 2026 Season', excerpt: 'The Professional Fighters League reveals significant changes to its tournament format.', category: 'PFL', date: '2026-03-06', readTime: '4 min' },
    { slug: 'ufc-310-fight-breakdown', title: 'UFC 310: Complete Fight-by-Fight Breakdown', excerpt: 'Our analysts break down every fight on the UFC 310 card with detailed statistical analysis.', category: 'Analysis', date: '2026-03-06', readTime: '12 min' },
    { slug: 'mma-weight-class-evolution', title: 'The Evolution of MMA Weight Classes: A Statistical Deep Dive', excerpt: 'How weight classes have changed over the past decade and what it means for modern fighters.', category: 'Analysis', date: '2026-03-05', readTime: '10 min' },
    { slug: 'grappling-vs-striking-2026', title: 'Grappling vs Striking in Modern MMA: What the Numbers Say', excerpt: 'A data-driven look at the effectiveness of different fighting styles in today\'s MMA landscape.', category: 'Analysis', date: '2026-03-04', readTime: '9 min' },
    { slug: 'ilia-topuria-featherweight-reign', title: 'Ilia Topuria\'s Featherweight Reign: What\'s Next for the Champion', excerpt: 'Examining the unbeaten champion\'s reign and potential matchups for his next title defense.', category: 'News', date: '2026-03-04', readTime: '6 min' },
    { slug: 'dricus-du-plessis-middleweight', title: 'Dricus Du Plessis: The Middleweight Division\'s Most Dangerous Fighter', excerpt: 'A deep dive into the South African champion\'s fighting style and winning record.', category: 'Fighters', date: '2026-03-03', readTime: '7 min' },
    { slug: 'one-championship-us-expansion', title: 'ONE Championship Announces US Expansion with New Event Series', excerpt: 'The Asian MMA promotion reveals plans for a regular US event series starting this summer.', category: 'ONE', date: '2026-03-03', readTime: '4 min' },
    { slug: 'ufc-fight-night-london-preview', title: 'UFC Fight Night London: Full Preview and Predictions', excerpt: 'Everything you need to know about the upcoming UFC Fight Night card in London.', category: 'Events', date: '2026-03-02', readTime: '8 min' },
    { slug: 'merab-dvalishvili-bantamweight', title: 'Merab Dvalishvili: Breaking Down the Bantamweight Champion\'s Style', excerpt: 'How the Georgian champion uses relentless pressure to dominate his opponents.', category: 'Fighters', date: '2026-03-02', readTime: '6 min' },
    { slug: 'womens-mma-rising-stars', title: 'Women\'s MMA: 5 Rising Stars to Watch in 2026', excerpt: 'The next generation of women\'s MMA talent is ready to take center stage this year.', category: 'News', date: '2026-03-01', readTime: '7 min' },
    { slug: 'ufc-performance-institute-tech', title: 'Inside the UFC Performance Institute: New Technology for Fighter Training', excerpt: 'A look at the cutting-edge technology being used to train the next generation of UFC fighters.', category: 'News', date: '2026-03-01', readTime: '5 min' },
    { slug: 'mma-judging-controversy', title: 'MMA Judging Under Fire: Controversial Decisions in 2026', excerpt: 'An analysis of the most controversial judging decisions this year and calls for reform.', category: 'Analysis', date: '2026-02-28', readTime: '8 min' },
    { slug: 'conor-mcgregor-comeback-update', title: 'Conor McGregor Comeback: Latest Updates on the Irishman\'s Return', excerpt: 'The latest on McGregor\'s potential return to the octagon and who he might face.', category: 'News', date: '2026-02-28', readTime: '4 min' },
    { slug: 'ufc-310-betting-guide', title: 'UFC 310 Complete Betting Guide: Best Value Picks', excerpt: 'Our comprehensive betting guide for UFC 310 with value picks across every fight.', category: 'Analysis', date: '2026-02-27', readTime: '10 min' },
    { slug: 'bellator-heavyweight-tournament', title: 'Bellator Heavyweight Tournament: Bracket and Predictions', excerpt: 'A full preview of the Bellator heavyweight tournament with our predictions for each round.', category: 'Bellator', date: '2026-02-27', readTime: '7 min' },
    { slug: 'pfl-champions-vs-ufc-rankings', title: 'PFL Champions vs UFC Rankings: How Would They Match Up?', excerpt: 'A hypothetical comparison of PFL champions against the UFC\'s top-ranked fighters.', category: 'Analysis', date: '2026-02-26', readTime: '9 min' },
    { slug: 'mma-injury-prevention-2026', title: 'MMA Injury Prevention: New Protocols Being Adopted in 2026', excerpt: 'The latest advances in sports science being used to keep fighters healthy and active.', category: 'News', date: '2026-02-26', readTime: '5 min' },
    { slug: 'ufc-apex-expansion-plans', title: 'UFC APEX Expansion: New State-of-the-Art Facility Planned', excerpt: 'The UFC announces plans to expand its Las Vegas APEX facility with new training and production capabilities.', category: 'News', date: '2026-02-25', readTime: '4 min' },
    { slug: 'flyweight-division-resurgence', title: 'The Flyweight Division\'s Resurgence: Why 125lbs Is Must-Watch MMA', excerpt: 'How the flyweight division has become one of the most exciting weight classes in modern MMA.', category: 'Analysis', date: '2026-02-25', readTime: '6 min' },
    { slug: 'ufc-fight-pass-exclusive-events', title: 'UFC Fight Pass: Exclusive Events Calendar for Spring 2026', excerpt: 'A complete guide to all the UFC Fight Pass exclusive events coming this spring.', category: 'Events', date: '2026-02-24', readTime: '5 min' },
    { slug: 'mma-nutritionist-interview', title: 'Interview: Top MMA Nutritionist on Weight Cutting in 2026', excerpt: 'An exclusive interview with one of MMA\'s top nutritionists about modern weight cutting practices.', category: 'News', date: '2026-02-24', readTime: '8 min' },
    { slug: 'ufc-rankings-pound-for-pound', title: 'UFC Pound-for-Pound Rankings: Who Deserves the Top Spot?', excerpt: 'Our analysts debate the current pound-for-pound rankings and who should be number one.', category: 'Rankings', date: '2026-02-23', readTime: '7 min' },
    { slug: 'cage-warriors-european-talent', title: 'Cage Warriors: European Talent Pipeline Producing Future Stars', excerpt: 'How Cage Warriors continues to develop European MMA talent for the global stage.', category: 'News', date: '2026-02-23', readTime: '5 min' },
    { slug: 'mma-referee-spotlight', title: 'Inside the Mind of an MMA Referee: Decision Making Under Pressure', excerpt: 'A fascinating look at how MMA referees make split-second decisions that can change fights.', category: 'Analysis', date: '2026-02-22', readTime: '6 min' },
  ];

  const total = allMock.length;
  const start = (page - 1) * perPage;
  const articles = allMock.slice(start, start + perPage);

  return { articles, total };
}

// Related news (exclude current, latest 4)
export async function getRelatedNews(excludeSlug: string, limit = 4): Promise<WPNewsPost[]> {
  try {
    const { data } = await wpFetchPaginated<WPNewsPost>('/wp/v2/news', {
      per_page: String(limit + 1),
      orderby: 'date',
      order: 'desc',
    });
    return data.filter(p => p.slug !== excludeSlug).slice(0, limit);
  } catch {
    return [];
  }
}

// Latest news (for widgets)
export async function getLatestNews(limit = 10): Promise<WPNewsPost[]> {
  try {
    const { data } = await wpFetchPaginated<WPNewsPost>('/wp/v2/news', {
      per_page: String(limit),
      orderby: 'date',
      order: 'desc',
    }, { revalidate: 300 });
    return data;
  } catch {
    return [];
  }
}

// Bookmaker review (custom endpoint)
export interface BookmakerReview {
  id: number;
  bookmaker_slug: string;
  seo_title: string;
  meta_description: string;
  custom_h1: string;
  intro_text: string;
  review_h2: string;
  review_content: string;
  pros: string[];
  cons: string[];
  verdict_text: string;
  cta_text: string;
  rating: number;
  featured_image_url: string;
}

export async function getBookmakerReview(slug: string): Promise<BookmakerReview | null> {
  try {
    const data = await wpFetch<BookmakerReview | null>(`/ufc/v1/bookmaker-review/${slug}`, undefined, { revalidate: 3600 });
    return data;
  } catch {
    return null;
  }
}

// Site settings (header/footer nav from WP)
export interface SiteNavItem {
  href: string;
  label: string;
}

export interface SiteFooterColumn {
  title: string;
  links: SiteNavItem[];
}

export interface SiteSettings {
  header_nav: SiteNavItem[];
  footer_col1: SiteFooterColumn | null;
  footer_col2: SiteFooterColumn | null;
  footer_col3: SiteFooterColumn | null;
  footer_disclaimer: string;
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    return await wpFetch<SiteSettings>('/ufc/v1/site-settings', undefined, { revalidate: 300 });
  } catch {
    return null;
  }
}

// Auth — uses WordPress Application Passwords (built-in WP 5.6+, no plugin needed)
// WP_API_USER = WordPress username, WP_API_PASSWORD = Application Password (from WP admin > Users > Application Passwords)
export function getAuthHeader(): string {
  const user = process.env.WP_API_USER;
  const pass = process.env.WP_API_PASSWORD;
  if (!user || !pass) throw new Error('WP_API_USER and WP_API_PASSWORD environment variables are required');
  return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
}

// Legacy compat — crons call getJWTToken() but we return Basic auth header instead
export async function getJWTToken(): Promise<string> {
  return getAuthHeader();
}
