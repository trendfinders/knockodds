import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { type Locale, i18n, localeHtmlLang, localePrefix } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { BOOKMAKER_CONFIGS, buildAffiliateUrl } from '@/lib/config/bookmakers';
import { BookmakerBonusCard } from '@/components/bookmakers/BookmakerBonusBadge';
import { GamblingDisclaimer } from '@/components/gambling/GamblingDisclaimer';

export const revalidate = 86400;

// Static bookmaker metadata (non-translatable)
const bookmakerMeta: Record<string, { name: string; rating: number; slug: string }> = {
  bet365:   { name: 'Bet365', rating: 4.7, slug: 'bet365' },
  unibet:   { name: 'Unibet', rating: 4.5, slug: 'unibet' },
  betway:   { name: 'Betway', rating: 4.4, slug: 'betway' },
  '888sport': { name: '888Sport', rating: 4.3, slug: '888sport' },
  bwin:     { name: 'bwin', rating: 4.2, slug: 'bwin' },
};

// MMA betting markets (universal terms, not translated)
const bookmakerMarkets: Record<string, string[]> = {
  bet365: ['Match Winner', 'Method of Victory', 'Over/Under Rounds', 'Round Betting', 'Round Group Betting', 'Fight to Distance', 'Double Chance', 'Fighter Specials'],
  unibet: ['Match Winner', 'Method of Victory', 'Over/Under Rounds', 'Round Betting', 'Fight to Distance', 'Total Rounds'],
  betway: ['Match Winner', 'Method of Victory', 'Over/Under Rounds', 'Round Betting', 'Fight to Distance', 'Will Fight End in Round 1'],
  '888sport': ['Match Winner', 'Method of Victory', 'Over/Under Rounds', 'Round Betting', 'Fight to Distance'],
  bwin: ['Match Winner', 'Method of Victory', 'Over/Under Rounds', 'Round Betting', 'Round Group Betting', 'Fight to Distance', 'Handicap'],
};

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale as Locale);
  const bm = bookmakerMeta[slug];
  if (!bm) return { title: dict.common.notFound };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';

  return {
    title: `${bm.name} UFC: ${dict.bookmakers.readReview} ${new Date().getFullYear()}`,
    description: `${bm.name} - ${dict.bookmakers.description}`,
    alternates: {
      canonical: `${localePrefix(locale)}/bookmakers/${slug}`,
      languages: Object.fromEntries(
        i18n.locales.map((l) => [localeHtmlLang[l], `${siteUrl}${localePrefix(l)}/bookmakers/${slug}`])
      ),
    },
  };
}

export default async function BookmakerPage({ params }: Props) {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale as Locale);
  const bm = bookmakerMeta[slug];

  if (!bm) notFound();

  const config = BOOKMAKER_CONFIGS.find(c => c.slug === slug);
  const affiliateUrl = config ? buildAffiliateUrl(config, `bookmaker-review-${slug}`) : '#';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';
  const p = localePrefix(locale);
  const markets = bookmakerMarkets[slug] || [];

  // Get bookmaker-specific translated content from dictionary
  const bmDict = (dict.bookmakers as any).reviews?.[slug];
  const description = bmDict?.description || dict.bookmakers.description;
  const pros = bmDict?.pros || [];
  const cons = bmDict?.cons || [];
  const verdict = bmDict?.verdict || '';

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: dict.nav.home, url: `${siteUrl}${p}/` },
        { name: dict.nav.bookmakers, url: `${siteUrl}${p}/bookmakers` },
        { name: bm.name, url: `${siteUrl}${p}/bookmakers/${slug}` },
      ]} />

      <div className="container-page max-w-4xl">
        {/* Header */}
        <div className="card p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
                {bm.name}: {dict.bookmakers.readReview}
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-accent-gold text-lg">{'★'.repeat(Math.floor(bm.rating))}</span>
                <span className="text-gray-500">{bm.rating}/5</span>
              </div>
            </div>
            <a href={affiliateUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn-primary">
              {dict.bookmakers.visitSite} &rarr;
            </a>
          </div>
          {/* Currency-aware bonus card */}
          <div className="mt-4">
            <BookmakerBonusCard
              slug={slug}
              template={dict.bookmakers.bonusTemplate}
              wageringTemplate={dict.bookmakers.bonusWagering}
              termsText={dict.bookmakers.bonusTerms}
            />
          </div>
        </div>

        {/* Description */}
        {description && (
          <div className="card p-6 mb-8">
            <h2 className="text-2xl font-heading font-bold mb-4">{bm.name} - {dict.bookmakers.title}</h2>
            <p className="text-gray-600">{description}</p>
          </div>
        )}

        {/* Pros and Cons */}
        {(pros.length > 0 || cons.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {pros.length > 0 && (
              <div className="card p-6">
                <h3 className="text-xl font-heading font-bold mb-4 text-green-600">&#10003; {dict.bookmakers.pros}</h3>
                <ul className="space-y-2">
                  {pros.map((pro: string) => (
                    <li key={pro} className="text-gray-600 flex items-start gap-2">
                      <span className="text-green-600 mt-1">&bull;</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {cons.length > 0 && (
              <div className="card p-6">
                <h3 className="text-xl font-heading font-bold mb-4 text-red-600">&#10007; {dict.bookmakers.cons}</h3>
                <ul className="space-y-2">
                  {cons.map((con: string) => (
                    <li key={con} className="text-gray-600 flex items-start gap-2">
                      <span className="text-red-600 mt-1">&bull;</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Markets */}
        {markets.length > 0 && (
          <div className="card p-6 mb-8">
            <h2 className="text-2xl font-heading font-bold mb-4">{dict.bookmakers.mmaMarketsAvailable} - {bm.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {markets.map((market: string) => (
                <div key={market} className="bg-surface-alt rounded-lg p-3 text-center text-sm">
                  {market}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verdict */}
        {verdict && (
          <div className="card p-6 mb-8 border-primary/30">
            <h2 className="text-2xl font-heading font-bold mb-4">{dict.bookmakers.verdict}</h2>
            <p className="text-gray-600">{verdict}</p>
            <a href={affiliateUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn-primary mt-4 inline-block">
              {dict.bookmakers.visitSite} - {bm.name} &rarr;
            </a>
          </div>
        )}

        {/* Related links */}
        <div className="flex gap-4 mb-8">
          <Link href={`${p}/bookmakers`} className="text-primary hover:text-primary-dark">&larr; {dict.nav.bookmakers}</Link>
          <Link href={`${p}/odds`} className="text-primary hover:text-primary-dark">{dict.nav.odds} &rarr;</Link>
        </div>

        <GamblingDisclaimer dict={dict} />
      </div>
    </>
  );
}

export async function generateStaticParams() {
  return Object.keys(bookmakerMeta).map((slug) => ({ slug }));
}
