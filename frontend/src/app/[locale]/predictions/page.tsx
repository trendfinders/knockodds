import type { Metadata } from 'next';
import Link from 'next/link';
import { type Locale, i18n, localeHtmlLang, localePrefix } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { getCachedOddsData, groupFightsByDate } from '@/lib/cache/odds-cache';
import { FighterAvatar } from '@/components/common/FighterAvatar';
import { BettingPromoWidget } from '@/components/widgets/BettingPromoWidget';
import { OddsBadge } from '@/components/widgets/OddsBadge';
import { GamblingDisclaimer } from '@/components/gambling/GamblingDisclaimer';
import type { Fight, Odds } from '@/lib/types/mma-api';

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';
  const p = localePrefix(locale);

  const year = String(new Date().getFullYear());
  const title = dict.predictions.metaTitle.replace('{year}', year);

  return {
    title,
    description: dict.predictions.description,
    alternates: {
      canonical: `${p}/predictions`,
      languages: Object.fromEntries(
        i18n.locales.map((l) => [localeHtmlLang[l], `${siteUrl}${localePrefix(l)}/predictions`])
      ),
    },
    openGraph: {
      title,
      description: dict.predictions.description,
      type: 'website',
    },
  };
}

function buildFightSlug(fight: Fight): string {
  const f1 = fight.fighters.first.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const f2 = fight.fighters.second.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${f1}-vs-${f2}`;
}

export default async function PredictionsPage({ params }: Props) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const p = localePrefix(locale);

  const cachedData = await getCachedOddsData();
  const upcoming = cachedData.upcomingFights.filter(f => f.status.short === 'NS');
  const byDate = groupFightsByDate(upcoming);

  // Build odds map
  const oddsMap = new Map<number, Odds>();
  for (const [fightId, odds] of Object.entries(cachedData.odds)) {
    oddsMap.set(Number(fightId), odds);
  }

  return (
    <div className="container-page">
      <div className="lg:flex lg:gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
            {dict.predictions.title}
          </h1>
          <p className="text-gray-500 mb-8 max-w-3xl">
            {dict.predictions.description}
          </p>

          {byDate.size > 0 ? (
            <div className="space-y-10">
              {Array.from(byDate.entries()).map(([date, fights]) => (
                <section key={date}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-heading font-bold">
                      {new Date(date + 'T00:00:00').toLocaleDateString(localeHtmlLang[locale as Locale], {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </h2>
                    <Link href={`${p}/odds/${date}`} className="text-xs text-primary hover:text-primary-dark">
                      {dict.odds.compareOdds} &rarr;
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {fights.map((fight) => {
                      const slug = buildFightSlug(fight);
                      const odds = oddsMap.get(fight.id) || null;

                      return (
                        <FightPredictionCard
                          key={fight.id}
                          fight={fight}
                          odds={odds}
                          slug={slug}
                          date={date}
                          p={p}
                          dict={dict}
                        />
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center text-gray-500 mb-8">
              <p className="text-lg">{dict.predictions.description}</p>
            </div>
          )}

          <div className="mt-12">
            <GamblingDisclaimer dict={dict} />
          </div>
        </div>

        {/* Sidebar — monetization widget + stats */}
        <aside className="w-full lg:w-72 flex-shrink-0 space-y-6 mt-10 lg:mt-16">
          <BettingPromoWidget
            title={dict.odds.bestOdds}
            betNowLabel={dict.odds.betNow}
            context="predictions-sidebar"
          />
          <div className="card p-4">
            <h3 className="text-sm font-heading font-bold text-gray-500 uppercase tracking-wider mb-3">
              {dict.predictions.analysis}
            </h3>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex justify-between">
                <span>{dict.home.upcomingEvents}</span>
                <span className="text-dark font-bold">{byDate.size}</span>
              </div>
              <div className="flex justify-between">
                <span>{dict.home.fights}</span>
                <span className="text-dark font-bold">{upcoming.length}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FightPredictionCard({ fight, odds, slug, date, p, dict }: {
  fight: Fight;
  odds: Odds | null;
  slug: string;
  date: string;
  p: string;
  dict: any;
}) {
  const f1 = fight.fighters.first;
  const f2 = fight.fighters.second;

  return (
    <Link
      href={`${p}/predictions/${date}/${slug}`}
      className="card p-4 md:p-5 hover:border-primary/50 transition-all group block"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Fighter matchup */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FighterAvatar logo={f1.logo} name={f1.name} size={44} />
            <div className="min-w-0">
              <p className="font-heading font-bold text-sm group-hover:text-primary transition-colors truncate">
                {f1.name}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-muted text-gray-500">
                  {fight.category}
                </span>
                {fight.is_main && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold">
                    Main
                  </span>
                )}
              </div>
            </div>
          </div>

          <span className="text-gray-600 text-xs font-bold px-1">VS</span>

          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <div className="min-w-0 text-right">
              <p className="font-heading font-bold text-sm group-hover:text-primary transition-colors truncate">
                {f2.name}
              </p>
              <p className="text-[10px] text-gray-500">{fight.time || 'TBD'}</p>
            </div>
            <FighterAvatar logo={f2.logo} name={f2.name} size={44} />
          </div>
        </div>

        {/* Odds + CTA */}
        <div className="flex items-center gap-3 sm:flex-shrink-0">
          <OddsBadge odds={odds} f1Name={f1.name} f2Name={f2.name} />
          <span className="text-xs text-primary font-semibold whitespace-nowrap">
            {dict.predictions.viewPrediction} &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
