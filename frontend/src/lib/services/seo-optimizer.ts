import { generateSEOMeta } from '../api/openai';

export interface SEOData {
  title: string;
  description: string;
  focusKeyword: string;
  keywords: string[];
  canonicalUrl: string;
  ogImage: string;
  jsonLd: Record<string, any>;
}

export async function optimizeForSEO(content: string, type: 'news' | 'fight' | 'fighter' | 'pronostic', slug: string, locale = 'en'): Promise<SEOData> {
  const seo = await generateSEOMeta(content, locale);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';

  const pathMap = {
    news: '/news',
    fight: '/odds',
    fighter: '/fighters',
    pronostic: '/predictions',
  };

  return {
    title: seo.seo_title,
    description: seo.meta_description,
    focusKeyword: seo.focus_keyword,
    keywords: seo.keywords,
    canonicalUrl: `${baseUrl}${pathMap[type]}/${slug}`,
    ogImage: `${baseUrl}/api/og?title=${encodeURIComponent(seo.seo_title)}&type=${type}`,
    jsonLd: buildJsonLd(type, seo.seo_title, seo.meta_description, slug),
  };
}

function buildJsonLd(type: string, title: string, description: string, slug: string): Record<string, any> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';

  if (type === 'news' || type === 'pronostic') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      author: { '@type': 'Organization', name: 'KnockOdds' },
      publisher: {
        '@type': 'Organization',
        name: 'KnockOdds',
        logo: { '@type': 'ImageObject', url: `${baseUrl}/logo.png` },
      },
    };
  }

  if (type === 'fighter') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: title,
      description,
      url: `${baseUrl}/fighters/${slug}`,
    };
  }

  if (type === 'fight') {
    return {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: title,
      description,
      organizer: { '@type': 'Organization', name: 'UFC' },
    };
  }

  return {};
}
