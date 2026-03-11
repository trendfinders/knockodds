import type { Metadata } from 'next';
import Link from 'next/link';
import { BreadcrumbJsonLd, SportsEventJsonLd } from '@/components/seo/JsonLd';
import { type Locale, i18n, localeHtmlLang, localePrefix } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { getCachedOddsAnalysis } from '@/lib/cache/content-cache';
import { getCachedOddsData, getFightsForDate } from '@/lib/cache/odds-cache';
import { BOOKMAKER_CONFIGS, getBookmakerConfig } from '@/lib/config/bookmakers';
import { GamblingDisclaimer } from '@/components/gambling/GamblingDisclaimer';
import type { Fight, Odds } from '@/lib/types/mma-api';

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string; eventSlug: string; fightSlug: string }>;
}

function formatName(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function parseFightSlug(slug: string): { fighter1: string; fighter2: string } {
  const parts = slug.split('-vs-');
  return { fighter1: formatName(parts[0] || ''), fighter2: formatName(parts[1] || '') };
}

function isDateSlug(slug: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(slug);
}

function formatEventLabel(slug: string, locale: Locale): string {
  if (isDateSlug(slug)) {
    return new Date(slug + 'T00:00:00').toLocaleDateString(localeHtmlLang[locale], {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }
  return formatName(slug);
}

async function findFightAndOdds(eventSlug: string, fightSlug: string): Promise<{ fight: Fight | null; odds: Odds | null }> {
  if (!isDateSlug(eventSlug)) return { fight: null, odds: null };

  const cachedData = await getCachedOddsData();
  const fights = getFightsForDate(cachedData, eventSlug);
  const { fighter1, fighter2 } = parseFightSlug(fightSlug);
  const f1Lower = fighter1.toLowerCase();
  const f2Lower = fighter2.toLowerCase();

  const fight = fights.find(f =>
    f.fighters.first.name.toLowerCase().includes(f1Lower) &&
    f.fighters.second.name.toLowerCase().includes(f2Lower)
  ) || fights.find(f =>
    f.fighters.first.name.toLowerCase().includes(f2Lower) &&
    f.fighters.second.name.toLowerCase().includes(f1Lower)
  ) || null;

  const odds = fight ? (cachedData.odds[String(fight.id)] || null) : null;
  return { fight, odds };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, eventSlug, fightSlug } = await params;
  const dict = await getDictionary(locale as Locale);
  const { fighter1, fighter2 } = parseFightSlug(fightSlug);
  const event = formatEventLabel(eventSlug, locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';
  const p = localePrefix(locale);

  return {
    title: `${dict.odds.eventOdds.replace('{event}', `${fighter1} vs ${fighter2}`)} | ${event}`,
    description: dict.odds.description,
    alternates: {
      canonical: `${p}/odds/${eventSlug}/${fightSlug}`,
      languages: Object.fromEntries(
        i18n.locales.map((l) => [localeHtmlLang[l], `${siteUrl}${localePrefix(l)}/odds/${eventSlug}/${fightSlug}`])
      ),
    },
  };
}

export default async function FightOddsPage({ params }: Props) {
  const { locale, eventSlug, fightSlug } = await params;
  const dict = await getDictionary(locale as Locale);
  const { fighter1, fighter2 } = parseFightSlug(fightSlug);
  const event = formatEventLabel(eventSlug, locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';
  const p = localePrefix(locale);

  const { fight, odds } = await findFightAndOdds(eventSlug, fightSlug);
  const f1Name = fight?.fighters.first.name || fighter1;
  const f2Name = fight?.fighters.second.name || fighter2;

  // Extract bookmaker moneyline odds — prioritize configured bookmakers
  const bookmakerOdds: Array<{ apiId: number; name: string; f1: string; f2: string }> = [];
  if (odds) {
    // First pass: configured bookmakers in priority order
    const configuredIds = BOOKMAKER_CONFIGS.map(b => b.apiId);
    for (const targetId of configuredIds) {
      const bm = odds.bookmakers.find(b => b.id === targetId);
      if (!bm) continue;
      const moneyline = findMoneylineBet(bm.bets);
      if (moneyline) {
        bookmakerOdds.push({ apiId: bm.id, name: bm.name, f1: moneyline.f1, f2: moneyline.f2 });
      }
    }
    // Second pass: remaining bookmakers
    for (const bm of odds.bookmakers) {
      if (bookmakerOdds.some(bo => bo.apiId === bm.id)) continue;
      const moneyline = findMoneylineBet(bm.bets);
      if (moneyline) {
        bookmakerOdds.push({ apiId: bm.id, name: bm.name, f1: moneyline.f1, f2: moneyline.f2 });
      }
    }
  }

  // Find best odds per fighter
  const f1Values = bookmakerOdds.map(b => parseFloat(b.f1)).filter(v => v > 0);
  const f2Values = bookmakerOdds.map(b => parseFloat(b.f2)).filter(v => v > 0);
  const bestF1 = f1Values.length > 0 ? Math.max(...f1Values) : 0;
  const bestF2 = f2Values.length > 0 ? Math.max(...f2Values) : 0;

  // Cached AI odds analysis
  let analysis = null;
  if (fight && bookmakerOdds.length > 0) {
    const fightData = JSON.stringify({
      fight: { category: fight.category, date: fight.date, status: fight.status.long },
      fighter1: f1Name,
      fighter2: f2Name,
      odds: bookmakerOdds.slice(0, 5),
    });
    const cacheKey = `odds-${eventSlug}-${fightSlug}-${locale}`;
    analysis = await getCachedOddsAnalysis(cacheKey, fightData, locale);
  }

  return (
    <>
      <SportsEventJsonLd
        name={`${f1Name} vs ${f2Name}`}
        startDate={fight?.date || new Date().toISOString()}
        fighter1={f1Name}
        fighter2={f2Name}
      />
      <BreadcrumbJsonLd items={[
        { name: dict.nav.home, url: `${siteUrl}${p}/` },
        { name: dict.nav.odds, url: `${siteUrl}${p}/odds` },
        { name: event, url: `${siteUrl}${p}/odds/${eventSlug}` },
        { name: `${f1Name} vs ${f2Name}`, url: `${siteUrl}${p}/odds/${eventSlug}/${fightSlug}` },
      ]} />

      <div className="container-page max-w-4xl">
        <p className="text-sm text-gray-500 mb-2">{event}</p>
        <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
          {analysis?.title || dict.odds.eventOdds.replace('{event}', `${f1Name} vs ${f2Name}`)}
        </h1>

        {fight && (
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs px-2 py-1 rounded bg-surface-muted text-gray-500">{fight.category}</span>
            <span className={`text-xs px-2 py-1 rounded font-semibold ${
              fight.status.short === 'LIVE' ? 'bg-red-500/20 text-red-600' :
              fight.status.short === 'FT' ? 'bg-gray-200 text-gray-500' :
              'bg-primary/20 text-primary'
            }`}>
              {fight.status.long}
            </span>
            {fight.time && <span className="text-sm text-gray-500">{fight.time}</span>}
          </div>
        )}

        {/* Odds Comparison Table */}
        <section className="mb-8">
          <h2 className="text-2xl font-heading font-bold mb-4">{dict.odds.compareOdds}</h2>
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-surface-alt">
                    <th className="text-left p-2 sm:p-3 text-gray-500 text-xs sm:text-sm">{dict.odds.bookmaker}</th>
                    <th className="text-center p-2 sm:p-3 text-gray-500 text-xs sm:text-sm max-w-[90px] sm:max-w-none truncate">{f1Name}</th>
                    <th className="text-center p-2 sm:p-3 text-gray-500 text-xs sm:text-sm max-w-[90px] sm:max-w-none truncate">{f2Name}</th>
                    <th className="p-2 sm:p-3 w-16 sm:w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {bookmakerOdds.length > 0 ? (
                    bookmakerOdds.map((bm) => {
                      const config = getBookmakerConfig(bm.apiId);
                      const isBestF1 = parseFloat(bm.f1) === bestF1 && bestF1 > 0;
                      const isBestF2 = parseFloat(bm.f2) === bestF2 && bestF2 > 0;

                      return (
                        <tr key={bm.apiId} className="border-b border-gray-200/50 hover:bg-surface-muted/50">
                          <td className="p-2 sm:p-3 font-medium text-xs sm:text-sm">{config?.name || bm.name}</td>
                          <td className={`p-2 sm:p-3 text-center font-mono font-semibold text-xs sm:text-sm ${
                            isBestF1 ? 'text-green-600' : 'text-gray-600'
                          }`}>
                            {bm.f1}
                            {isBestF1 && <span className="ml-1 text-[10px] text-green-500">★<span className="hidden sm:inline"> {dict.odds.bestLine}</span></span>}
                          </td>
                          <td className={`p-2 sm:p-3 text-center font-mono font-semibold text-xs sm:text-sm ${
                            isBestF2 ? 'text-green-600' : 'text-gray-600'
                          }`}>
                            {bm.f2}
                            {isBestF2 && <span className="ml-1 text-[10px] text-green-500">★<span className="hidden sm:inline"> {dict.odds.bestLine}</span></span>}
                          </td>
                          <td className="p-2 sm:p-3 text-center">
                            {config ? (
                              <a
                                href={`${config.affiliateUrl}?ref=${config.affiliateId}&utm_source=knockodds&utm_medium=referral&utm_content=${encodeURIComponent(`${f1Name} vs ${f2Name}`)}`}
                                target="_blank"
                                rel="noopener noreferrer sponsored"
                                className="inline-block bg-primary hover:bg-primary-dark text-white text-xs font-semibold py-1.5 px-2 sm:px-4 rounded transition-colors"
                              >
                                {dict.odds.betNow}
                              </a>
                            ) : (
                              <span className="text-xs text-gray-600">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500">
                        {dict.odds.noOddsAvailable}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {bookmakerOdds.length > 0 && (
              <p className="text-xs text-gray-500 mt-4">{dict.gambling.oddsDisclaimer}</p>
            )}
          </div>
        </section>

        {/* AI Odds Analysis */}
        {analysis && (
          <section className="mb-8">
            <div className="card p-6 md:p-8">
              <div
                className="prose prose-lg max-w-none prose-headings:font-heading prose-a:text-primary"
                dangerouslySetInnerHTML={{ __html: analysis.content }}
              />
            </div>
          </section>
        )}

        {/* Fighter Links */}
        {fight && (
          <section className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href={`${p}/fighters/${fight.fighters.first.id}`}
                className="card p-5 hover:border-primary/50 transition-all group text-center"
              >
                <p className="font-heading font-bold text-lg group-hover:text-primary transition-colors">{f1Name}</p>
                <span className="text-sm text-primary">{dict.fighters.characteristics} &rarr;</span>
              </Link>
              <Link
                href={`${p}/fighters/${fight.fighters.second.id}`}
                className="card p-5 hover:border-primary/50 transition-all group text-center"
              >
                <p className="font-heading font-bold text-lg group-hover:text-primary transition-colors">{f2Name}</p>
                <span className="text-sm text-primary">{dict.fighters.characteristics} &rarr;</span>
              </Link>
            </div>
          </section>
        )}

        {/* Links */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link href={`${p}/odds/${eventSlug}`} className="text-primary hover:text-primary-dark">
            &larr; {dict.odds.backToEvent}
          </Link>
          <Link href={`${p}/predictions/${eventSlug}/${fightSlug}`} className="text-primary hover:text-primary-dark">
            {dict.predictions.prediction} {f1Name} vs {f2Name} &rarr;
          </Link>
        </div>

        <GamblingDisclaimer dict={dict} />
      </div>
    </>
  );
}

/** Find moneyline bet from a bookmaker's bets array */
function findMoneylineBet(bets: { name: string; values: { value: string; odd: string }[] }[]): { f1: string; f2: string } | null {
  // Try named moneyline bets first
  let bet = bets.find(b => {
    const n = b.name.toLowerCase();
    return n.includes('winner') || n.includes('match') || n.includes('moneyline') || n.includes('home/away') || n.includes('fight');
  });
  // Fallback: first bet with 2+ values
  if (!bet) bet = bets.find(b => b.values.length >= 2);
  if (bet && bet.values.length >= 2) {
    return { f1: bet.values[0].odd, f2: bet.values[1].odd };
  }
  return null;
}
