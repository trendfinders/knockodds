import type { Metadata } from 'next';
import Link from 'next/link';
import { type Locale, i18n, localeHtmlLang, localePrefix } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { BOOKMAKER_CONFIGS, buildAffiliateUrl } from '@/lib/config/bookmakers';
import { BookmakerBonusBadge } from '@/components/bookmakers/BookmakerBonusBadge';
import { GamblingDisclaimer } from '@/components/gambling/GamblingDisclaimer';

export const revalidate = 86400;

interface Props {
  params: Promise<{ locale: string }>;
}

const bookmakers = [
  { slug: 'bet365', name: 'Bet365', rating: 4.7, markets: 20, liveStreaming: true, app: true },
  { slug: 'unibet', name: 'Unibet', rating: 4.5, markets: 12, liveStreaming: false, app: true },
  { slug: 'betway', name: 'Betway', rating: 4.4, markets: 14, liveStreaming: true, app: true },
  { slug: '888sport', name: '888Sport', rating: 4.3, markets: 10, liveStreaming: false, app: true },
  { slug: 'bwin', name: 'bwin', rating: 4.2, markets: 15, liveStreaming: true, app: true },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';
  const year = new Date().getFullYear();

  return {
    title: dict.bookmakers.metaTitle.replace('{year}', String(year)),
    description: dict.bookmakers.description,
    alternates: {
      canonical: `${localePrefix(locale)}/bookmakers`,
      languages: Object.fromEntries(
        i18n.locales.map((l) => [localeHtmlLang[l], `${siteUrl}${localePrefix(l)}/bookmakers`])
      ),
    },
  };
}

export default async function BookmakersPage({ params }: Props) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <div className="container-page">
      <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
        {dict.bookmakers.title}
      </h1>
      <p className="text-gray-500 mb-8 max-w-3xl">
        {dict.bookmakers.description}
      </p>

      <div className="space-y-6">
        {bookmakers.map((bm, i) => {
          const config = BOOKMAKER_CONFIGS.find(c => c.slug === bm.slug);
          const affiliateUrl = config ? buildAffiliateUrl(config, 'bookmakers-page') : '#';

          return (
            <div key={bm.slug} className="card p-6 md:p-8">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-1/4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl font-heading font-bold text-primary">#{i + 1}</span>
                    <div>
                      <h2 className="text-2xl font-bold">{bm.name}</h2>
                      <div className="text-accent-gold">{'★'.repeat(Math.floor(bm.rating))} <span className="text-gray-500">{bm.rating}/5</span></div>
                    </div>
                  </div>
                  {/* Currency-aware bonus */}
                  <BookmakerBonusBadge
                    slug={bm.slug}
                    template={dict.bookmakers.bonusTemplate}
                    noOfferText={dict.bookmakers.noBonusAvailable}
                  />
                </div>
                <div className="lg:w-1/2">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-surface-alt rounded-lg p-3 text-center">
                      <p className="text-gray-500">{dict.bookmakers.mmaMarkets}</p>
                      <p className="font-bold text-lg">{bm.markets}+</p>
                    </div>
                    <div className="bg-surface-alt rounded-lg p-3 text-center">
                      <p className="text-gray-500">{dict.bookmakers.liveStreaming}</p>
                      <p className="font-bold text-lg">{bm.liveStreaming ? `✓ ${dict.bookmakers.yes}` : `✗ ${dict.bookmakers.no}`}</p>
                    </div>
                    <div className="bg-surface-alt rounded-lg p-3 text-center">
                      <p className="text-gray-500">{dict.bookmakers.mobileApp}</p>
                      <p className="font-bold text-lg">{bm.app ? `✓ ${dict.bookmakers.yes}` : `✗ ${dict.bookmakers.no}`}</p>
                    </div>
                  </div>
                </div>
                <div className="lg:w-1/4 flex flex-col gap-3 justify-center">
                  <Link href={`${localePrefix(locale)}/bookmakers/${bm.slug}`} className="btn-outline text-center">
                    {dict.bookmakers.readReview}
                  </Link>
                  <a
                    href={affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="btn-primary text-center"
                  >
                    {dict.bookmakers.visitSite} &rarr;
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <GamblingDisclaimer dict={dict} />
      </div>
    </div>
  );
}
