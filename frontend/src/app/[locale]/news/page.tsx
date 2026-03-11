import type { Metadata } from 'next';
import Link from 'next/link';
import { type Locale, i18n, localeHtmlLang, localePrefix } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';

export const revalidate = 300;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';

  return {
    title: dict.news.metaTitle,
    description: dict.news.description,
    alternates: {
      canonical: `${localePrefix(locale)}/news`,
      languages: Object.fromEntries(
        i18n.locales.map((l) => [localeHtmlLang[l], `${siteUrl}${localePrefix(l)}/news`])
      ),
    },
  };
}

export default async function NewsPage({ params }: Props) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <div className="container-page">
      <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">{dict.news.title}</h1>
      <p className="text-gray-400 mb-8">
        {dict.news.description}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card p-6 text-center text-gray-500">
          <p>{dict.news.description}</p>
        </div>
      </div>
    </div>
  );
}
