import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { type Locale, i18n, localeHtmlLang, localePrefix } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { HomeContent } from '@/components/home/HomeContent';
import { getAllArticles } from '@/lib/api/wordpress';

export const revalidate = 60;

const ARTICLES_PER_PAGE = 20;
const MAX_PAGES = 3;

interface Props {
  params: Promise<{ locale: string; page: string }>;
}

export function generateStaticParams() {
  return [{ page: '2' }, { page: '3' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, page } = await params;
  const pageNum = Number(page);
  if (isNaN(pageNum) || pageNum < 2 || pageNum > MAX_PAGES) return {};

  const dict = await getDictionary(locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';

  return {
    title: `${dict.metadata.siteName} - ${dict.common.page} ${pageNum}`,
    description: dict.metadata.defaultDescription,
    alternates: {
      canonical: `${localePrefix(locale)}/page/${pageNum}`,
      languages: Object.fromEntries(
        i18n.locales.map((l) => [localeHtmlLang[l], `${siteUrl}${localePrefix(l)}/page/${pageNum}`])
      ),
    },
  };
}

export default async function PaginatedHomePage({ params }: Props) {
  const { locale, page } = await params;
  const pageNum = Number(page);

  if (isNaN(pageNum) || pageNum < 2 || pageNum > MAX_PAGES) {
    notFound();
  }

  const dict = await getDictionary(locale as Locale);
  const { articles, total } = await getAllArticles(pageNum, ARTICLES_PER_PAGE);
  const totalPages = Math.min(Math.ceil(total / ARTICLES_PER_PAGE), MAX_PAGES);

  if (pageNum > totalPages) {
    notFound();
  }

  return (
    <HomeContent
      articles={articles}
      currentPage={pageNum}
      totalPages={totalPages}
      locale={locale}
      dict={dict}
    />
  );
}
