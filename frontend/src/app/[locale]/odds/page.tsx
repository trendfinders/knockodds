import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { type Locale, i18n, localeHtmlLang, localePrefix } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { getCachedOddsData, groupFightsByDate } from '@/lib/cache/odds-cache';
import { getBookmakersForCountry, getBookmakerConfig, buildAffiliateUrl, LOCALE_TO_COUNTRY } from '@/lib/config/bookmakers';
import { FormattedOddPair } from '@/components/odds/FormattedOdd';
import { GamblingDisclaimer } from '@/components/gambling/GamblingDisclaimer';
import { FighterAvatar } from '@/components/common/FighterAvatar';
import type { Fight, Odds } from '@/lib/types/mma-api';

export const revalidate = 3600; // page itself revalidates hourly, data comes from cache

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';
  const p = localePrefix(locale);
  const year = new Date().getFullYear();

  return {
    title: dict.odds.metaTitle.replace('{year}', String(year)),
    description: dict.odds.description,
    alternates: {
      canonical: `${p}/odds`,
      languages: Object.fromEntries(
        i18n.locales.map((l) => [localeHtmlLang[l], `${siteUrl}${localePrefix(l)}/odds`])
      ),
    },
  };
}

function buildFightSlug(fight: Fight): string {
  const f1 = fight.fighters.first.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const f2 = fight.fighters.second.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${f1}-vs-${f2}`;
}

function extractMoneyline(odds: Odds | null, topIds: number[]): Array<{ apiId: number; name: string; f1: string; f2: string }> {
  if (!odds) return [];
  const result: Array<{ apiId: number; name: string; f1: string; f2: string }> = [];

  for (const targetId of topIds) {
    const bm = odds.bookmakers.find(b => b.id === targetId);
    if (!bm) continue;
    let ml = bm.bets.find(bet => {
      const n = bet.name.toLowerCase();
      return n.includes('winner') || n.includes('match') || n.includes('moneyline') || n.includes('home/away') || n.includes('fight');
    });
    if (!ml) ml = bm.bets.find(b => b.values.length >= 2);
    if (ml && ml.values.length >= 2) {
      result.push({ apiId: targetId, name: bm.name, f1: ml.values[0].odd, f2: ml.values[1].odd });
    }
  }
  if (result.length < 3) {
    for (const bm of odds.bookmakers) {
      if (result.length >= 3) break;
      if (result.some(r => r.apiId === bm.id)) continue;
      let ml = bm.bets.find(bet => {
        const n = bet.name.toLowerCase();
        return n.includes('winner') || n.includes('match') || n.includes('moneyline') || n.includes('home/away') || n.includes('fight');
      });
      if (!ml) ml = bm.bets.find(b => b.values.length >= 2);
      if (ml && ml.values.length >= 2) {
        result.push({ apiId: bm.id, name: bm.name, f1: ml.values[0].odd, f2: ml.values[1].odd });
      }
    }
  }
  return result;
}

export default async function OddsPage({ params }: Props) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const p = localePrefix(locale);
  const countryCode = LOCALE_TO_COUNTRY[locale] || undefined;
  const topBookmakers = getBookmakersForCountry(countryCode).slice(0, 3);
  const topIds = topBookmakers.map(b => b.apiId);

  // Read from cache — instant, no API calls. Data is refreshed by /api/cron/odds every 2h.
  const cachedData = await getCachedOddsData();

  const upcomingByDate = groupFightsByDate(cachedData.upcomingFights);
  const recentByDate = groupFightsByDate(cachedData.recentResults);

  // Build a Map from the cached odds record for component compatibility
  const oddsMap = new Map<number, Odds>();
  for (const [fightId, odds] of Object.entries(cachedData.odds)) {
    oddsMap.set(Number(fightId), odds);
  }

  return (
    <div className="container-page">
      <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
        {dict.odds.title}
      </h1>
      <p className="text-gray-500 mb-8 max-w-3xl">{dict.odds.description}</p>

      {/* Upcoming Events — only fights WITH odds */}
      <section className="mb-12">
        <h2 className="text-2xl font-heading font-bold mb-6">{dict.home.upcomingEvents}</h2>
        {upcomingByDate.size > 0 ? (
          <div className="space-y-8">
            {Array.from(upcomingByDate.entries()).map(([date, fights]) => {
              const fightsWithOdds = fights.filter(f => oddsMap.has(f.id));
              const fightsWithoutOddsCount = fights.length - fightsWithOdds.length;

              return (
                <EventCard
                  key={date}
                  date={date}
                  fightsWithOdds={fightsWithOdds}
                  fightsWithoutOddsCount={fightsWithoutOddsCount}
                  totalFights={fights.length}
                  oddsMap={oddsMap}
                  p={p}
                  dict={dict}
                  locale={locale as Locale}
                  topIds={topIds}
                  countryCode={countryCode}
                />
              );
            })}
          </div>
        ) : (
          <div className="card p-8 text-center text-gray-500">
            <p className="text-lg">{dict.odds.noOddsAvailable}</p>
          </div>
        )}
      </section>

      {/* Recent Results — always shown */}
      {recentByDate.size > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-heading font-bold mb-6">{dict.odds.recentResults}</h2>
          <div className="space-y-4">
            {Array.from(recentByDate.entries()).slice(0, 3).map(([date, fights]) => (
              <div key={date} className="card p-5">
                <h3 className="text-lg font-heading font-bold mb-3">
                  {new Date(date + 'T00:00:00').toLocaleDateString(localeHtmlLang[locale as Locale], {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </h3>
                <div className="space-y-2">
                  {fights.slice(0, 5).map((fight) => (
                    <div key={fight.id} className="p-3 bg-surface-alt rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 flex-shrink-0">{fight.category}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-auto">{fight.status.long}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <FighterAvatar logo={fight.fighters.first.logo} name={fight.fighters.first.name} size={24} />
                        <span className={`text-sm font-medium truncate ${fight.fighters.first.winner ? 'text-green-600' : 'text-gray-500'}`}>
                          {fight.fighters.first.name}
                        </span>
                        <span className="text-gray-400 text-xs flex-shrink-0">vs</span>
                        <span className={`text-sm font-medium truncate ${fight.fighters.second.winner ? 'text-green-600' : 'text-gray-500'}`}>
                          {fight.fighters.second.name}
                        </span>
                        <FighterAvatar logo={fight.fighters.second.logo} name={fight.fighters.second.name} size={24} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <GamblingDisclaimer dict={dict} />
    </div>
  );
}


function EventCard({ date, fightsWithOdds, fightsWithoutOddsCount, totalFights, oddsMap, p, dict, locale, topIds, countryCode }: {
  date: string;
  fightsWithOdds: Fight[];
  fightsWithoutOddsCount: number;
  totalFights: number;
  oddsMap: Map<number, Odds>;
  p: string;
  dict: any;
  locale: Locale;
  topIds: number[];
  countryCode?: string;
}) {
  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString(localeHtmlLang[locale], {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-to-r from-surface-muted to-surface-alt p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200">
        <div>
          <h3 className="text-lg sm:text-xl font-heading font-bold">{dateLabel}</h3>
          <p className="text-sm text-gray-500">{totalFights} {dict.home.fights}</p>
        </div>
        <Link href={`${p}/odds/${date}`} className="btn-primary text-sm py-2 px-5 text-center flex-shrink-0">
          {dict.odds.viewFightOdds} &rarr;
        </Link>
      </div>

      {fightsWithOdds.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {fightsWithOdds.map((fight) => (
            <FightOddsRow
              key={fight.id}
              fight={fight}
              odds={oddsMap.get(fight.id) || null}
              p={p}
              date={date}
              dict={dict}
              topIds={topIds}
              countryCode={countryCode}
            />
          ))}
        </div>
      ) : (
        <div className="p-6 text-center text-gray-500">
          <p>{dict.odds.oddsComingSoon}</p>
          <Link href={`${p}/odds/${date}`} className="text-sm text-primary hover:text-primary-dark mt-2 inline-block">
            {dict.odds.viewFightOdds} &rarr;
          </Link>
        </div>
      )}

      {fightsWithoutOddsCount > 0 && fightsWithOdds.length > 0 && (
        <Link
          href={`${p}/odds/${date}`}
          className="block text-center text-sm text-primary hover:text-primary-dark py-3 bg-surface-alt/50 hover:bg-surface-muted/30 transition-colors border-t border-gray-200/50"
        >
          +{fightsWithoutOddsCount} more fights &rarr;
        </Link>
      )}
    </div>
  );
}

function FightOddsRow({ fight, odds, p, date, dict, topIds, countryCode }: {
  fight: Fight;
  odds: Odds | null;
  p: string;
  date: string;
  dict: any;
  topIds: number[];
  countryCode?: string;
}) {
  const slug = buildFightSlug(fight);
  const moneylines = extractMoneyline(odds, topIds);

  let bestF1Idx = -1;
  let bestF2Idx = -1;
  if (moneylines.length > 1) {
    let maxF1 = 0, maxF2 = 0;
    moneylines.forEach((ml, i) => {
      const f1v = parseFloat(ml.f1);
      const f2v = parseFloat(ml.f2);
      if (f1v > maxF1) { maxF1 = f1v; bestF1Idx = i; }
      if (f2v > maxF2) { maxF2 = f2v; bestF2Idx = i; }
    });
  }

  const bestBm = moneylines[0];
  const bestConfig = bestBm ? getBookmakerConfig(bestBm.apiId) : null;

  return (
    <div className="p-4 md:p-5 hover:bg-surface-muted/20 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs px-2 py-0.5 rounded bg-primary/15 text-primary font-medium">
          {fight.category}
        </span>
        <span className="text-xs text-gray-500">
          {fight.status.short === 'NS' ? fight.time || 'TBD' : fight.status.long}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Fighters with photos */}
        <Link href={`${p}/odds/${date}/${slug}`} className="group flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
              <FighterAvatar logo={fight.fighters.first.logo} name={fight.fighters.first.name} size={32} />
              <span className="text-sm sm:text-base font-heading font-bold group-hover:text-primary transition-colors truncate">
                {fight.fighters.first.name}
              </span>
            </div>
            <span className="text-gray-400 text-xs sm:text-sm font-bold flex-shrink-0">VS</span>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 justify-end">
              <span className="text-sm sm:text-base font-heading font-bold group-hover:text-primary transition-colors truncate text-right">
                {fight.fighters.second.name}
              </span>
              <FighterAvatar logo={fight.fighters.second.logo} name={fight.fighters.second.name} size={32} />
            </div>
          </div>
        </Link>

        {/* Bookmaker odds + Bet Now */}
        <div className="flex items-center gap-2 flex-shrink-0 overflow-x-auto">
          {moneylines.map((ml, i) => {
            const config = getBookmakerConfig(ml.apiId);
            return (
              <div key={ml.apiId} className={`text-center min-w-[70px] ${i > 0 ? 'hidden sm:block' : ''}`}>
                {config?.logo ? (
                  <Image src={config.logo} alt={config.name} width={60} height={16} className="mx-auto mb-1 opacity-70" style={{ height: 16 }} />
                ) : (
                  <p className="text-[10px] text-gray-500 mb-1 truncate">{config?.name || ml.name}</p>
                )}
                <FormattedOddPair
                  f1={ml.f1}
                  f2={ml.f2}
                  bestF1={i === bestF1Idx}
                  bestF2={i === bestF2Idx}
                />
              </div>
            );
          })}
          {bestConfig && (
            <a
              href={buildAffiliateUrl(bestConfig, `${fight.fighters.first.name} vs ${fight.fighters.second.name}`, countryCode)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="bg-primary hover:bg-primary-dark text-white text-xs font-bold py-2 px-3 sm:py-2.5 sm:px-4 rounded transition-colors whitespace-nowrap"
            >
              {dict.odds.betNow}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
