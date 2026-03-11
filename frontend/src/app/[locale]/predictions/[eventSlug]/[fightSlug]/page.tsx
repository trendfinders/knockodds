import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BreadcrumbJsonLd, ArticleJsonLd, SportsEventJsonLd, UGCDiscussionJsonLd } from '@/components/seo/JsonLd';
import { type Locale, i18n, localeHtmlLang, localePrefix } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { mmaApi } from '@/lib/api/mma-api';
import { getCachedPredictionSummary } from '@/lib/cache/content-cache';
import { getCachedOddsData, getFightsForDate } from '@/lib/cache/odds-cache';
import { getBookmakersForCountry, getBookmakerConfig, buildAffiliateUrl, LOCALE_TO_COUNTRY } from '@/lib/config/bookmakers';
import { extractOrganization } from '@/lib/utils/event-helpers';
import { FighterAvatar } from '@/components/common/FighterAvatar';
import { BettingPromoWidget } from '@/components/widgets/BettingPromoWidget';
import { GamblingDisclaimer } from '@/components/gambling/GamblingDisclaimer';
import { FightPredictionsList } from '@/components/predictions/FightPredictionsList';
import { UserStatsCard } from '@/components/user/UserStatsCard';
import { LeaderboardWidget } from '@/components/leaderboard/LeaderboardWidget';
import { FormattedOdd } from '@/components/odds/FormattedOdd';
import type { Fight, FighterRecord, Odds } from '@/lib/types/mma-api';

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

function extractAllMoneylines(odds: Odds | null, configuredIds: number[]): Array<{ apiId: number; name: string; f1: string; f2: string }> {
  if (!odds) return [];
  const result: Array<{ apiId: number; name: string; f1: string; f2: string }> = [];

  // Configured bookmakers first
  for (const targetId of configuredIds) {
    const bm = odds.bookmakers.find(b => b.id === targetId);
    if (!bm) continue;
    const ml = findMoneyline(bm.bets);
    if (ml) result.push({ apiId: bm.id, name: bm.name, ...ml });
  }
  // Remaining
  for (const bm of odds.bookmakers) {
    if (result.some(r => r.apiId === bm.id)) continue;
    const ml = findMoneyline(bm.bets);
    if (ml) result.push({ apiId: bm.id, name: bm.name, ...ml });
  }
  return result;
}

function findMoneyline(bets: Odds['bookmakers'][0]['bets']): { f1: string; f2: string } | null {
  let bet = bets.find(b => {
    const n = b.name.toLowerCase();
    return n.includes('winner') || n.includes('match') || n.includes('moneyline') || n.includes('home/away') || n.includes('fight');
  });
  if (!bet) bet = bets.find(b => b.values.length >= 2);
  if (bet && bet.values.length >= 2) {
    return { f1: bet.values[0].odd, f2: bet.values[1].odd };
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, eventSlug, fightSlug } = await params;
  const dict = await getDictionary(locale as Locale);
  const { fighter1, fighter2 } = parseFightSlug(fightSlug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';
  const p = localePrefix(locale);

  // Fetch real data for dynamic metadata
  const { fight } = await findFightAndOdds(eventSlug, fightSlug);
  const f1Name = fight?.fighters.first.name || fighter1;
  const f2Name = fight?.fighters.second.name || fighter2;
  const eventLabel = fight?.slug ? extractOrganization(fight.slug) : formatEventLabel(eventSlug, locale as Locale);
  const fightDate = fight?.date || eventSlug;

  const title = (dict.predictions.fightPageTitle || dict.predictions.fightMetaTitle || '{fighter1} vs {fighter2} — Prediction & Betting Tips')
    .replace('{fighter1}', f1Name)
    .replace('{fighter2}', f2Name)
    .replace('{event}', eventLabel)
    .replace('{date}', fightDate);

  const description = (dict.predictions.fightMetaDesc || dict.predictions.description)
    .replace('{fighter1}', f1Name)
    .replace('{fighter2}', f2Name)
    .replace('{event}', eventLabel);

  return {
    title,
    description,
    alternates: {
      canonical: `${p}/predictions/${eventSlug}/${fightSlug}`,
      languages: Object.fromEntries(
        i18n.locales.map((l) => [localeHtmlLang[l], `${siteUrl}${localePrefix(l)}/predictions/${eventSlug}/${fightSlug}`])
      ),
    },
    openGraph: { title, description, type: 'article' },
  };
}

export default async function FightPredictionPage({ params }: Props) {
  const { locale, eventSlug, fightSlug } = await params;
  const dict = await getDictionary(locale as Locale);
  const { fighter1, fighter2 } = parseFightSlug(fightSlug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';
  const p = localePrefix(locale);
  const countryCode = LOCALE_TO_COUNTRY[locale] || undefined;
  const geoBookmakers = getBookmakersForCountry(countryCode);
  const geoBookmakerIds = geoBookmakers.map(b => b.apiId);

  const { fight, odds } = await findFightAndOdds(eventSlug, fightSlug);
  const f1Name = fight?.fighters.first.name || fighter1;
  const f2Name = fight?.fighters.second.name || fighter2;
  const eventName = fight?.slug || formatEventLabel(eventSlug, locale as Locale);
  const orgName = fight?.slug ? extractOrganization(fight.slug) : 'MMA';
  const eventLabel = fight?.slug ? extractOrganization(fight.slug) : formatEventLabel(eventSlug, locale as Locale);
  const fightDate = fight?.date || eventSlug;

  // Fetch fighter records
  let record1: FighterRecord | null = null;
  let record2: FighterRecord | null = null;
  if (fight) {
    [record1, record2] = await Promise.all([
      mmaApi.getFighterRecords(fight.fighters.first.id).catch(() => null),
      mmaApi.getFighterRecords(fight.fighters.second.id).catch(() => null),
    ]);
  }

  // Get cached AI prediction
  let prediction = null;
  if (fight && (record1 || record2)) {
    const fighterData = JSON.stringify({
      fight: { category: fight.category, date: fight.date },
      fighter1: {
        name: f1Name,
        record: record1 ? `${record1.total.win}-${record1.total.loss}-${record1.total.draw}` : 'Unknown',
        ko_wins: record1?.ko.win ?? 0,
        sub_wins: record1?.sub.win ?? 0,
      },
      fighter2: {
        name: f2Name,
        record: record2 ? `${record2.total.win}-${record2.total.loss}-${record2.total.draw}` : 'Unknown',
        ko_wins: record2?.ko.win ?? 0,
        sub_wins: record2?.sub.win ?? 0,
      },
    });
    const cacheKey = `${eventSlug}-${fightSlug}-${locale}-summary`;
    prediction = await getCachedPredictionSummary(cacheKey, fighterData, locale);
  }

  const stars = prediction?.prediction.confidence ?? 0;
  const winnerName = prediction?.prediction.winner_name || '';
  const moneylines = extractAllMoneylines(odds, geoBookmakerIds);

  // Best odds
  const f1Values = moneylines.map(b => parseFloat(b.f1)).filter(v => v > 0);
  const f2Values = moneylines.map(b => parseFloat(b.f2)).filter(v => v > 0);
  const bestF1 = f1Values.length > 0 ? Math.max(...f1Values) : 0;
  const bestF2 = f2Values.length > 0 ? Math.max(...f2Values) : 0;

  return (
    <>
      <ArticleJsonLd
        title={(dict.predictions.fightPageTitle || '{fighter1} vs {fighter2} — Prediction')
          .replace('{fighter1}', f1Name).replace('{fighter2}', f2Name).replace('{event}', eventLabel).replace('{date}', fightDate)}
        description={prediction?.excerpt || `${dict.predictions.analysis} ${f1Name} vs ${f2Name} - ${eventName}`}
        datePublished={new Date().toISOString()}
        dateModified={new Date().toISOString()}
        image=""
        type="NewsArticle"
      />
      {fight && (
        <SportsEventJsonLd
          name={`${f1Name} vs ${f2Name} - ${eventLabel}`}
          startDate={fight.date}
          fighter1={f1Name}
          fighter2={f2Name}
          organizer={orgName}
          sport="MMA"
          eventStatus={new Date(fight.date) >= new Date() ? 'EventScheduled' : 'EventCompleted'}
          url={`${siteUrl}${p}/predictions/${eventSlug}/${fightSlug}`}
        />
      )}
      <BreadcrumbJsonLd items={[
        { name: dict.nav.home, url: `${siteUrl}${p}/` },
        { name: dict.nav.predictions, url: `${siteUrl}${p}/predictions` },
        { name: eventName, url: `${siteUrl}${p}/predictions/${eventSlug}` },
        { name: `${f1Name} vs ${f2Name}`, url: `${siteUrl}${p}/predictions/${eventSlug}/${fightSlug}` },
      ]} />

      <div className="container-page">
        <div className="lg:flex lg:gap-8">
          <article className="flex-1 min-w-0 max-w-4xl">
            <p className="text-sm text-gray-500 mb-2">{eventName}</p>
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-6">
              {(dict.predictions.fightPageTitle || '{fighter1} vs {fighter2} — Prediction & Betting Tips')
                .replace('{fighter1}', f1Name).replace('{fighter2}', f2Name).replace('{event}', eventLabel).replace('{date}', fightDate)}
            </h1>

            {/* Fighter matchup hero */}
            <div className="card p-6 mb-8 border-primary/20">
              <div className="flex items-center justify-center gap-6 md:gap-10 mb-5">
                <div className="flex flex-col items-center gap-2 flex-1">
                  <FighterAvatar logo={fight?.fighters.first.logo || ''} name={f1Name} size={72} />
                  <span className={`text-lg font-heading font-bold text-center ${winnerName === f1Name ? 'text-primary' : ''}`}>
                    {f1Name}
                  </span>
                  {record1 && (
                    <span className="text-sm font-mono text-gray-500">
                      <span className="text-green-600">{record1.total.win}</span>-
                      <span className="text-red-600">{record1.total.loss}</span>-
                      <span className="text-gray-500">{record1.total.draw}</span>
                    </span>
                  )}
                </div>
                <span className="text-gray-600 text-xl font-bold">VS</span>
                <div className="flex flex-col items-center gap-2 flex-1">
                  <FighterAvatar logo={fight?.fighters.second.logo || ''} name={f2Name} size={72} />
                  <span className={`text-lg font-heading font-bold text-center ${winnerName === f2Name ? 'text-primary' : ''}`}>
                    {f2Name}
                  </span>
                  {record2 && (
                    <span className="text-sm font-mono text-gray-500">
                      <span className="text-green-600">{record2.total.win}</span>-
                      <span className="text-red-600">{record2.total.loss}</span>-
                      <span className="text-gray-500">{record2.total.draw}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Prediction summary */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-gray-500 text-sm mb-1">{dict.predictions.prediction}</p>
                  {prediction ? (
                    <>
                      <p className="text-2xl font-heading font-bold text-primary">{winnerName}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {prediction.prediction.method}
                        {prediction.prediction.recommended_bet && ` | ${prediction.prediction.recommended_bet}`}
                      </p>
                    </>
                  ) : (
                    <p className="text-lg text-gray-500">{dict.predictions.description}</p>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-sm">{dict.predictions.confidence}</p>
                  <p className="text-accent-gold text-2xl">
                    {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
                  </p>
                </div>
              </div>
            </div>

            {/* Odds comparison table */}
            {moneylines.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  {(dict.predictions.oddsH2 || 'Betting Odds {fighter1} vs. {fighter2} {date}')
                    .replace('{fighter1}', f1Name).replace('{fighter2}', f2Name).replace('{date}', fightDate)}
                </h2>
                <div className="card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-surface-alt/50">
                        <th className="text-left p-3 text-gray-500 font-medium">{dict.odds.bookmaker}</th>
                        <th className="text-center p-3 font-medium text-gray-500">{f1Name}</th>
                        <th className="text-center p-3 font-medium text-gray-500">{f2Name}</th>
                        <th className="text-center p-3 w-28"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {moneylines.map((ml) => {
                        const config = getBookmakerConfig(ml.apiId);
                        const isBestF1 = parseFloat(ml.f1) === bestF1 && moneylines.length > 1;
                        const isBestF2 = parseFloat(ml.f2) === bestF2 && moneylines.length > 1;

                        return (
                          <tr key={ml.apiId} className="border-b border-gray-200/50 hover:bg-surface-muted/30">
                            <td className="p-3">
                              {config?.logo ? (
                                <Image src={config.logo} alt={config.name} width={70} height={18} style={{ height: 18 }} />
                              ) : (
                                <span className="font-medium text-gray-600">{config?.name || ml.name}</span>
                              )}
                            </td>
                            <td className={`p-3 text-center font-mono font-bold ${isBestF1 ? 'text-green-600' : 'text-gray-600'}`}>
                              <FormattedOdd decimalOdd={ml.f1} />
                              {isBestF1 && <span className="ml-1 text-[10px] text-green-500">★</span>}
                            </td>
                            <td className={`p-3 text-center font-mono font-bold ${isBestF2 ? 'text-green-600' : 'text-gray-600'}`}>
                              <FormattedOdd decimalOdd={ml.f2} />
                              {isBestF2 && <span className="ml-1 text-[10px] text-green-500">★</span>}
                            </td>
                            <td className="p-3 text-center">
                              {config && (
                                <a
                                  href={buildAffiliateUrl(config, `${f1Name} vs ${f2Name}`, countryCode)}
                                  target="_blank"
                                  rel="noopener noreferrer sponsored"
                                  className="inline-block bg-primary hover:bg-primary-dark text-white text-xs font-bold py-1.5 px-3 rounded transition-colors"
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
              </section>
            )}

            {/* Fighter stats comparison */}
            {(record1 || record2) && (
              <section className="mb-8">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  {(dict.predictions.statsH2 || 'Statistics {fighter1} vs. {fighter2}')
                    .replace('{fighter1}', f1Name).replace('{fighter2}', f2Name)}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: f1Name, record: record1, logo: fight?.fighters.first.logo || '' },
                    { name: f2Name, record: record2, logo: fight?.fighters.second.logo || '' },
                  ].map(({ name, record, logo }) => (
                    <div key={name} className="card p-5">
                      <div className="flex items-center gap-2 mb-3 justify-center">
                        <FighterAvatar logo={logo} name={name} size={32} />
                        <h3 className="font-heading font-bold">{name}</h3>
                      </div>
                      {record ? (
                        <>
                          <p className="text-center text-2xl font-mono mb-3">
                            <span className="text-green-600">{record.total.win}</span>-
                            <span className="text-red-600">{record.total.loss}</span>-
                            <span className="text-gray-500">{record.total.draw}</span>
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-center text-sm">
                            <div className="bg-surface-alt rounded p-2">
                              <p className="text-orange-400 font-bold">{record.ko.win}</p>
                              <p className="text-xs text-gray-500">{dict.fighters.koWins}</p>
                            </div>
                            <div className="bg-surface-alt rounded p-2">
                              <p className="text-blue-400 font-bold">{record.sub.win}</p>
                              <p className="text-xs text-gray-500">{dict.fighters.subWins}</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-center text-gray-500">-</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* AI Quick Analysis */}
            <section className="mb-6">
              <div className="card p-6">
                {prediction ? (
                  <div
                    className="prose max-w-none prose-headings:font-heading prose-a:text-primary prose-p:text-sm"
                    dangerouslySetInnerHTML={{ __html: prediction.content }}
                  />
                ) : (
                  <p className="text-gray-500">{dict.predictions.description}</p>
                )}
              </div>
            </section>

            {/* CTA: Make your prediction */}
            <div className="card p-6 mb-8 border-primary/30 text-center bg-gradient-to-r from-primary/5 to-transparent">
              <p className="text-lg font-heading font-bold mb-1">
                {(dict.gamification as Record<string, string>)?.doYouAgree || 'Do you agree with our AI?'}
              </p>
              <p className="text-sm text-gray-500 mb-0">
                {(dict.gamification as Record<string, string>)?.makeYourOwn || 'Make your own prediction and compete on the leaderboard'}
              </p>
            </div>

            {/* Value Bet */}
            {prediction?.prediction.recommended_bet && (
              <section className="mb-8">
                <h2 className="text-2xl font-heading font-bold mb-4">Value Bet {f1Name} vs. {f2Name}</h2>
                <div className="card p-6 border-primary/30">
                  <p className="text-lg font-semibold text-primary">{prediction.prediction.recommended_bet}</p>
                  <p className="text-sm text-gray-500 mt-2">{dict.gambling.oddsDisclaimer}</p>
                  {moneylines.length > 0 && (() => {
                    const topBm = geoBookmakers[0];
                    const config = topBm ? getBookmakerConfig(topBm.apiId) : null;
                    return config ? (
                      <a
                        href={buildAffiliateUrl(config, `${f1Name} vs ${f2Name} value bet`, countryCode)}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="inline-block mt-3 bg-primary hover:bg-primary-dark text-white text-sm font-bold py-2.5 px-5 rounded transition-colors"
                      >
                        {dict.odds.betNow} &rarr;
                      </a>
                    ) : null;
                  })()}
                </div>
              </section>
            )}

            {/* User Stats (logged-in) */}
            <UserStatsCard
              strings={{
                yourPrediction: (dict.gamification as Record<string, string>)?.yourPrediction || 'Your Stats',
                predictions: (dict.gamification as Record<string, string>)?.predictions || 'Predictions',
                wins: (dict.gamification as Record<string, string>)?.wins || 'Wins',
                winRate: (dict.gamification as Record<string, string>)?.winRate || 'Win Rate',
                currentStreak: (dict.gamification as Record<string, string>)?.currentStreak || 'streak',
                points: (dict.gamification as Record<string, string>)?.points || 'Points',
                rankTitle: (dict.gamification as Record<string, string>)?.rankTitle || 'Rank',
                badges: (dict.gamification as Record<string, string>)?.badges || 'Badges',
              }}
            />

            {/* Community Predictions (UGC) */}
            <UGCDiscussionJsonLd
              name={(dict.predictions.communityH2 || 'Community Predictions {event}: {fighter1} vs. {fighter2}')
                .replace('{fighter1}', f1Name).replace('{fighter2}', f2Name).replace('{event}', eventLabel)}
              url={`${siteUrl}${p}/predictions/${eventSlug}/${fightSlug}#community`}
              commentCount={0}
            />
            <section id="community" data-ugc="true">
            <FightPredictionsList
              fightId={fight?.id || 0}
              fightSlug={fightSlug}
              eventSlug={eventSlug}
              eventDate={fight?.date || eventSlug}
              fighter1={{ name: f1Name, logo: fight?.fighters.first.logo || '' }}
              fighter2={{ name: f2Name, logo: fight?.fighters.second.logo || '' }}
              isFightUpcoming={fight ? new Date(fight.date) >= new Date(new Date().toISOString().split('T')[0]) : true}
              strings={{
                communityPredictions: (dict.predictions.communityH2 || 'Community Predictions {event}: {fighter1} vs. {fighter2}')
                  .replace('{fighter1}', f1Name).replace('{fighter2}', f2Name).replace('{event}', eventLabel),
                noPredictions: (dict.gamification as Record<string, string>)?.noPredictions || 'No predictions yet. Be the first!',
                percentPick: (dict.gamification as Record<string, string>)?.percentPick || '{percent}% pick {fighter}',
                correct: (dict.gamification as Record<string, string>)?.correct || 'Correct',
                incorrect: (dict.gamification as Record<string, string>)?.incorrect || 'Incorrect',
                pending: (dict.gamification as Record<string, string>)?.pending || 'Pending',
                pointsEarned: (dict.gamification as Record<string, string>)?.pointsEarned || '+{points} pts',
                delete: dict.comments?.delete || 'Delete',
                makePrediction: (dict.gamification as Record<string, string>)?.makePrediction || 'Make Your Prediction',
                pickWinner: (dict.gamification as Record<string, string>)?.pickWinner || 'Pick the Winner',
                selectMethod: (dict.gamification as Record<string, string>)?.selectMethod || 'How will they win?',
                selectRound: (dict.gamification as Record<string, string>)?.selectRound || 'Which round?',
                anyRound: (dict.gamification as Record<string, string>)?.anyRound || 'Any',
                confidence: (dict.gamification as Record<string, string>)?.confidence || 'Confidence',
                reasoning: (dict.gamification as Record<string, string>)?.reasoning || 'Quick reasoning (optional)',
                submitPrediction: (dict.gamification as Record<string, string>)?.submitPrediction || 'Submit Prediction',
                updatePrediction: (dict.gamification as Record<string, string>)?.updatePrediction || 'Update Prediction',
                signInToPredict: (dict.gamification as Record<string, string>)?.signInToPredict || 'Sign in to make your prediction and compete on the leaderboard',
                ...dict.auth,
              }}
            />
            </section>

            {/* Links */}
            <div className="flex flex-wrap gap-4 mb-8 mt-8">
              <Link href={`${p}/predictions/${eventSlug}`} className="text-primary hover:text-primary-dark">
                &larr; {dict.predictions.backToEvent}
              </Link>
              <Link href={`${p}/odds/${eventSlug}/${fightSlug}`} className="text-primary hover:text-primary-dark">
                {dict.odds.viewFullOdds} &rarr;
              </Link>
            </div>

            <GamblingDisclaimer dict={dict} />
          </article>

          {/* Sidebar */}
          <aside className="w-full lg:w-72 flex-shrink-0 space-y-6 mt-10 lg:mt-16">
            <LeaderboardWidget
              linkPrefix={p}
              strings={{
                topPredictors: (dict.gamification as Record<string, string>)?.topPredictors || 'Top Predictors',
                allTime: (dict.gamification as Record<string, string>)?.allTime || 'All Time',
                thisMonth: (dict.gamification as Record<string, string>)?.thisMonth || 'This Month',
                points: (dict.gamification as Record<string, string>)?.points || 'Points',
                winRate: (dict.gamification as Record<string, string>)?.winRate || 'Win Rate',
                viewLeaderboard: (dict.gamification as Record<string, string>)?.viewLeaderboard || 'View Leaderboard',
                monthlyPrizes: (dict.gamification as Record<string, string>)?.monthlyPrizes || 'Monthly prizes for top predictors!',
              }}
            />
            <BettingPromoWidget
              title={dict.odds.bestOdds}
              betNowLabel={dict.odds.betNow}
              context={`prediction-${f1Name}-vs-${f2Name}`}
            />
          </aside>
        </div>
      </div>
    </>
  );
}
