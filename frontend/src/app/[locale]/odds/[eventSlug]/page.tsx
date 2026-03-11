import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { type Locale, i18n, localeHtmlLang, localePrefix } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { getCachedOddsData, getFightsForDate } from '@/lib/cache/odds-cache';
import { getBookmakersForCountry, getBookmakerConfig, buildAffiliateUrl, LOCALE_TO_COUNTRY } from '@/lib/config/bookmakers';
import { FormattedOdd } from '@/components/odds/FormattedOdd';
import { GamblingDisclaimer } from '@/components/gambling/GamblingDisclaimer';
import { FighterAvatar } from '@/components/common/FighterAvatar';
import type { Fight, Odds } from '@/lib/types/mma-api';

export const revalidate = 3600; // page revalidates hourly, data comes from cache

interface Props {
  params: Promise<{ locale: string; eventSlug: string }>;
}

function isDateSlug(slug: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(slug);
}

function formatEventName(slug: string, locale: Locale): string {
  if (isDateSlug(slug)) {
    return new Date(slug + 'T00:00:00').toLocaleDateString(localeHtmlLang[locale], {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function buildFightSlug(fight: Fight): string {
  const f1 = fight.fighters.first.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const f2 = fight.fighters.second.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${f1}-vs-${f2}`;
}

function extractMoneylineOdds(odds: Odds | null, topIds: number[]): Array<{
  bookmakerApiId: number;
  bookmakerName: string;
  f1Odd: string;
  f2Odd: string;
}> {
  if (!odds) return [];
  const result: Array<{ bookmakerApiId: number; bookmakerName: string; f1Odd: string; f2Odd: string }> = [];

  for (const targetId of topIds) {
    const bm = odds.bookmakers.find(b => b.id === targetId);
    if (!bm) continue;
    let moneyline = bm.bets.find(bet => {
      const n = bet.name.toLowerCase();
      return n.includes('winner') || n.includes('match') || n.includes('moneyline') || n.includes('home/away') || n.includes('fight');
    });
    if (!moneyline) moneyline = bm.bets.find(b => b.values.length >= 2);
    if (moneyline && moneyline.values.length >= 2) {
      result.push({ bookmakerApiId: targetId, bookmakerName: bm.name, f1Odd: moneyline.values[0].odd, f2Odd: moneyline.values[1].odd });
    }
  }
  if (result.length < 3) {
    for (const bm of odds.bookmakers) {
      if (result.length >= 3) break;
      if (result.some(r => r.bookmakerApiId === bm.id)) continue;
      let moneyline = bm.bets.find(bet => {
        const n = bet.name.toLowerCase();
        return n.includes('winner') || n.includes('match') || n.includes('moneyline') || n.includes('home/away') || n.includes('fight');
      });
      if (!moneyline) moneyline = bm.bets.find(b => b.values.length >= 2);
      if (moneyline && moneyline.values.length >= 2) {
        result.push({ bookmakerApiId: bm.id, bookmakerName: bm.name, f1Odd: moneyline.values[0].odd, f2Odd: moneyline.values[1].odd });
      }
    }
  }
  return result;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, eventSlug } = await params;
  const dict = await getDictionary(locale as Locale);
  const eventName = formatEventName(eventSlug, locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';
  const p = localePrefix(locale);

  return {
    title: dict.odds.eventH1.replace('{event}', eventName),
    description: dict.odds.description,
    alternates: {
      canonical: `${p}/odds/${eventSlug}`,
      languages: Object.fromEntries(
        i18n.locales.map((l) => [localeHtmlLang[l], `${siteUrl}${localePrefix(l)}/odds/${eventSlug}`])
      ),
    },
  };
}

export default async function EventOddsPage({ params }: Props) {
  const { locale, eventSlug } = await params;
  const dict = await getDictionary(locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';
  const p = localePrefix(locale);
  const eventName = formatEventName(eventSlug, locale as Locale);
  const countryCode = LOCALE_TO_COUNTRY[locale] || undefined;
  const topBookmakers = getBookmakersForCountry(countryCode).slice(0, 3);
  const topIds = topBookmakers.map(b => b.apiId);

  // Read from cache — instant, no API calls. Data refreshed by /api/cron/odds every 2h.
  const cachedData = await getCachedOddsData();

  let fights: Fight[] = [];
  if (isDateSlug(eventSlug)) {
    fights = getFightsForDate(cachedData, eventSlug);
  }

  // Build odds map from cached data
  const oddsMap = new Map<number, Odds>();
  for (const fight of fights) {
    const odds = cachedData.odds[String(fight.id)];
    if (odds) oddsMap.set(fight.id, odds);
  }

  // Separate fights with odds from those without
  const fightsWithOdds = fights.filter(f => oddsMap.has(f.id));
  const fightsWithoutOdds = fights.filter(f => !oddsMap.has(f.id));

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: dict.nav.home, url: `${siteUrl}${p}/` },
        { name: dict.odds.title, url: `${siteUrl}${p}/odds` },
        { name: eventName, url: `${siteUrl}${p}/odds/${eventSlug}` },
      ]} />

      <div className="container-page">
        <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
          {dict.odds.eventH1.replace('{event}', eventName)}
        </h1>
        <p className="text-gray-500 mb-8">{dict.odds.description}</p>

        {/* Fights WITH odds */}
        {fightsWithOdds.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-bold mb-4">{dict.odds.compareOdds}</h2>
            <div className="space-y-4">
              {fightsWithOdds.map((fight) => (
                <FightCard
                  key={fight.id}
                  fight={fight}
                  odds={oddsMap.get(fight.id) || null}
                  p={p}
                  eventSlug={eventSlug}
                  dict={dict}
                  topIds={topIds}
                  countryCode={countryCode}
                />
              ))}
            </div>
          </section>
        )}

        {/* Fights WITHOUT odds */}
        {fightsWithoutOdds.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-heading font-bold mb-4 text-gray-500">{dict.odds.fightCard}</h2>
            <div className="space-y-2">
              {fightsWithoutOdds.map((fight) => {
                const slug = buildFightSlug(fight);
                return (
                  <Link
                    key={fight.id}
                    href={`${p}/predictions/${eventSlug}/${slug}`}
                    className="card p-4 hover:border-primary/30 transition-all group block"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs px-2 py-0.5 rounded bg-surface-muted text-gray-500">{fight.category}</span>
                      <span className="text-xs text-gray-500 ml-auto">{fight.time || 'TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <FighterAvatar logo={fight.fighters.first.logo} name={fight.fighters.first.name} size={28} />
                      <span className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                        {fight.fighters.first.name}
                      </span>
                      <span className="text-gray-400 text-xs flex-shrink-0">vs</span>
                      <span className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                        {fight.fighters.second.name}
                      </span>
                      <FighterAvatar logo={fight.fighters.second.logo} name={fight.fighters.second.name} size={28} />
                      <span className="text-xs text-primary flex-shrink-0 ml-auto">{dict.predictions.prediction} &rarr;</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {fights.length === 0 && (
          <div className="card p-8 text-center text-gray-500 mb-8">
            <p className="text-lg">{dict.odds.noOddsAvailable}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-4 mb-8">
          <Link href={`${p}/odds`} className="text-primary hover:text-primary-dark">&larr; {dict.odds.title}</Link>
          <Link href={`${p}/predictions/${eventSlug}`} className="text-primary hover:text-primary-dark">
            {dict.nav.predictions} &rarr;
          </Link>
        </div>

        <GamblingDisclaimer dict={dict} />
      </div>
    </>
  );
}

function FightCard({ fight, odds, p, eventSlug, dict, topIds, countryCode }: {
  fight: Fight;
  odds: Odds | null;
  p: string;
  eventSlug: string;
  dict: any;
  topIds: number[];
  countryCode?: string;
}) {
  const slug = buildFightSlug(fight);
  const isLive = fight.status.short === 'LIVE';
  const isFinished = fight.status.short === 'FT';
  const moneylines = extractMoneylineOdds(odds, topIds);

  const f1Name = fight.fighters.first.name;
  const f2Name = fight.fighters.second.name;

  // Best odds per fighter (highest = best for punter)
  let bestF1Idx = -1;
  let bestF2Idx = -1;
  if (moneylines.length > 1) {
    let maxF1 = 0, maxF2 = 0;
    moneylines.forEach((ml, i) => {
      const f1v = parseFloat(ml.f1Odd);
      const f2v = parseFloat(ml.f2Odd);
      if (f1v > maxF1) { maxF1 = f1v; bestF1Idx = i; }
      if (f2v > maxF2) { maxF2 = f2v; bestF2Idx = i; }
    });
  }

  return (
    <div className="card p-4 md:p-5 hover:border-primary/50 transition-all">
      {/* Header: category + status + link */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded bg-primary/15 text-primary font-medium">{fight.category}</span>
          <span className={`text-xs px-2 py-1 rounded font-semibold ${
            isLive ? 'bg-red-500/20 text-red-600 animate-pulse' :
            isFinished ? 'bg-gray-200 text-gray-500' :
            'bg-surface-muted text-gray-500'
          }`}>
            {isLive ? 'LIVE' : isFinished ? fight.status.long : fight.time || 'TBD'}
          </span>
        </div>
        <Link href={`${p}/odds/${eventSlug}/${slug}`} className="text-sm text-primary hover:text-primary-dark">
          {dict.odds.viewFullOdds} &rarr;
        </Link>
      </div>

      {/* Fighter matchup with photos */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 mb-5">
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <FighterAvatar logo={fight.fighters.first.logo} name={f1Name} size={56} />
          <span className={`text-sm sm:text-base font-heading font-bold text-center truncate w-full ${isFinished && fight.fighters.first.winner ? 'text-green-600' : ''}`}>
            {f1Name}
          </span>
        </div>
        <span className="text-gray-600 text-lg font-bold flex-shrink-0">VS</span>
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <FighterAvatar logo={fight.fighters.second.logo} name={f2Name} size={56} />
          <span className={`text-sm sm:text-base font-heading font-bold text-center truncate w-full ${isFinished && fight.fighters.second.winner ? 'text-green-600' : ''}`}>
            {f2Name}
          </span>
        </div>
      </div>

      {/* Odds table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-surface-alt">
              <th className="text-left p-2 text-gray-500 font-medium text-xs sm:text-sm">{dict.odds.bookmaker}</th>
              <th className="text-center p-2 font-medium text-gray-500 text-xs sm:text-sm max-w-[80px] sm:max-w-none truncate">{f1Name}</th>
              <th className="text-center p-2 font-medium text-gray-500 text-xs sm:text-sm max-w-[80px] sm:max-w-none truncate">{f2Name}</th>
              <th className="p-2 w-16 sm:w-24"></th>
            </tr>
          </thead>
          <tbody>
            {moneylines.map((ml, i) => {
              const config = getBookmakerConfig(ml.bookmakerApiId);
              const isBestF1 = i === bestF1Idx;
              const isBestF2 = i === bestF2Idx;

              return (
                <tr key={ml.bookmakerApiId} className="border-b border-gray-200/50 hover:bg-surface-muted/30">
                  <td className="p-2 text-xs sm:text-sm">
                    {config?.logo ? (
                      <Image src={config.logo} alt={config.name} width={70} height={18} style={{ height: 18 }} />
                    ) : (
                      <span className="font-medium text-gray-600">{config?.name || ml.bookmakerName}</span>
                    )}
                  </td>
                  <td className={`p-2 text-center font-mono font-bold text-xs sm:text-sm ${isBestF1 ? 'text-green-600' : 'text-gray-600'}`}>
                    <FormattedOdd decimalOdd={ml.f1Odd} />
                    {isBestF1 && <span className="ml-1 text-[10px] text-green-500">★</span>}
                  </td>
                  <td className={`p-2 text-center font-mono font-bold text-xs sm:text-sm ${isBestF2 ? 'text-green-600' : 'text-gray-600'}`}>
                    <FormattedOdd decimalOdd={ml.f2Odd} />
                    {isBestF2 && <span className="ml-1 text-[10px] text-green-500">★</span>}
                  </td>
                  <td className="p-2 text-center">
                    {config && (
                      <a
                        href={buildAffiliateUrl(config, `${f1Name} vs ${f2Name}`, countryCode)}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="inline-block bg-primary hover:bg-primary-dark text-white text-xs font-bold py-1.5 px-2 sm:px-3 rounded transition-colors"
                      >
                        {dict.odds.betNow}
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Quick links */}
      <div className="flex gap-4 mt-3 pt-3 border-t border-gray-200/50">
        <Link href={`${p}/predictions/${eventSlug}/${slug}`} className="text-xs text-primary hover:text-primary-dark">
          {dict.predictions.prediction} &rarr;
        </Link>
        <Link href={`${p}/fighters/${fight.fighters.first.id}`} className="text-xs text-gray-500 hover:text-dark">
          {f1Name}
        </Link>
        <Link href={`${p}/fighters/${fight.fighters.second.id}`} className="text-xs text-gray-500 hover:text-dark">
          {f2Name}
        </Link>
      </div>
    </div>
  );
}
