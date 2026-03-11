import type { Metadata } from 'next';
import Link from 'next/link';
import { type Locale, i18n, localeHtmlLang, localePrefix } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { LatestNewsWidget } from '@/components/widgets/LatestNewsWidget';
import { weightClasses } from '@/lib/config/weight-classes';

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';
  const p = localePrefix(locale);

  return {
    title: dict.rankings.metaTitle,
    description: dict.rankings.description,
    alternates: {
      canonical: `${p}/rankings`,
      languages: Object.fromEntries(
        i18n.locales.map((l) => [localeHtmlLang[l], `${siteUrl}${localePrefix(l)}/rankings`])
      ),
    },
  };
}

export default async function RankingsPage({ params }: Props) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const p = localePrefix(locale);

  const mensDivisions = weightClasses.filter((wc) => wc.gender === 'male');
  const womensDivisions = weightClasses.filter((wc) => wc.gender === 'female');

  return (
    <div className="container-page">
      <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
        {dict.rankings.title}
      </h1>
      <p className="text-gray-400 mb-10 max-w-3xl">
        {dict.rankings.description}
      </p>

      {/* Men's Divisions */}
      <section className="mb-12">
        <h2 className="text-2xl font-heading font-bold mb-6">{dict.rankings.mensDivisions}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mensDivisions.map((wc) => (
            <Link
              key={wc.slug}
              href={`${p}/rankings/${wc.slug}`}
              className="card p-6 hover:border-primary/50 transition-all group"
            >
              <h3 className="text-lg font-heading font-bold group-hover:text-primary transition-colors">
                {wc.name}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {wc.weightLbs} / {wc.weightKg}
              </p>
              <span className="inline-block mt-3 text-xs text-primary font-semibold uppercase tracking-wider">
                {dict.rankings.viewRanking} &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Women's Divisions */}
      <section className="mb-12">
        <h2 className="text-2xl font-heading font-bold mb-6">{dict.rankings.womensDivisions}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {womensDivisions.map((wc) => (
            <Link
              key={wc.slug}
              href={`${p}/rankings/${wc.slug}`}
              className="card p-6 hover:border-primary/50 transition-all group"
            >
              <h3 className="text-lg font-heading font-bold group-hover:text-primary transition-colors">
                {wc.name}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {wc.weightLbs} / {wc.weightKg}
              </p>
              <span className="inline-block mt-3 text-xs text-primary font-semibold uppercase tracking-wider">
                {dict.rankings.viewRanking} &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      <LatestNewsWidget
        locale={locale}
        title={dict.home.latestNews}
        viewAllLabel={dict.common.viewAll}
      />
    </div>
  );
}
