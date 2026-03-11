import type { Metadata } from 'next';
import { type Locale, i18n, localeHtmlLang, localePrefix } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { JsonLd } from '@/components/seo/JsonLd';
import { HomeContent } from '@/components/home/HomeContent';
import { getAllArticles } from '@/lib/api/wordpress';

export const revalidate = 60; // 1 min — news freshness

const ARTICLES_PER_PAGE = 20;
const MAX_PAGES = 3;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';

  return {
    title: dict.metadata.defaultTitle,
    description: dict.metadata.defaultDescription,
    openGraph: {
      title: dict.metadata.defaultTitle,
      description: dict.metadata.defaultDescription,
      type: 'website',
      locale: localeHtmlLang[locale as Locale],
    },
    alternates: {
      canonical: localePrefix(locale) || '/',
      languages: Object.fromEntries(
        i18n.locales.map((l) => [localeHtmlLang[l], `${siteUrl}${localePrefix(l)}/`])
      ),
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';

  const { articles, total } = await getAllArticles(1, ARTICLES_PER_PAGE);
  const totalPages = Math.min(Math.ceil(total / ARTICLES_PER_PAGE), MAX_PAGES);

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: dict.metadata.siteName,
        url: siteUrl,
        description: dict.metadata.defaultDescription,
        inLanguage: localeHtmlLang[locale as Locale],
        publisher: { '@type': 'Organization', name: dict.metadata.siteName },
      }} />

      <HomeContent
        articles={articles}
        currentPage={1}
        totalPages={totalPages}
        locale={locale}
        dict={dict}
      />
    </>
  );
}
