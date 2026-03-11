import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { type Locale, i18n, localeHtmlLang, localePrefix } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { getCachedOddsData, getFightsForDate } from '@/lib/cache/odds-cache';
import { getBookmakersForCountry, getBookmakerConfig, buildAffiliateUrl, LOCALE_TO_COUNTRY } from '@/lib/config/bookmakers';
import { getEventDisplayName } from '@/lib/utils/event-helpers';
import { FighterAvatar } from '@/components/common/FighterAvatar';
import { BettingPromoWidget } from '@/components/widgets/BettingPromoWidget';
import { FormattedOddPair } from '@/components/odds/FormattedOdd';
import { GamblingDisclaimer } from '@/components/gambling/GamblingDisclaimer';
import type { Fight, Odds } from '@/lib/types/mma-api';

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string; eventSlug: string }>;
}

function isDateSlug(slug: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(slug);
}

function formatEventLabel(slug: string, locale: Locale): string {
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

function extractMoneyline(odds: Odds | null, topIds: number[]): { f1: string; f2: string; bmApiId: number } | null {
  if (!odds) return null;

  for (const targetId of topIds) {
    const bm = odds.bookmakers.find(b => b.id === targetId);
    if (!bm) continue;
    let ml = bm.bets.find(bet => {
      const n = bet.name.toLowerCase();
      return n.includes('winner') || n.includes('match') || n.includes('moneyline') || n.includes('home/away') || n.includes('fight');
    });
    if (!ml) ml = bm.bets.find(b => b.values.length >= 2);
    if (ml && ml.values.length >= 2) {
      return { f1: ml.values[0].odd, f2: ml.values[1].odd, bmApiId: bm.id };
    }
  }

  for (const bm of odds.bookmakers) {
    let ml = bm.bets.find(bet => {
      const n = bet.name.toLowerCase();
      return n.includes('winner') || n.includes('match') || n.includes('moneyline') || n.includes('home/away') || n.includes('fight');
    });
    if (!ml) ml = bm.bets.find(b => b.values.length >= 2);
    if (ml && ml.values.length >= 2) {
      return { f1: ml.values[0].odd, f2: ml.values[1].odd, bmApiId: bm.id };
    }
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, eventSlug } = await params;
  const dict = await getDictionary(locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';
  const p = localePrefix(locale);

  // Fetch fight data to get the real event name from API slug
  let eventName = formatEventLabel(eventSlug, locale as Locale);
  if (isDateSlug(eventSlug)) {
    const cachedData = await getCachedOddsData();
    const fights = getFightsForDate(cachedData, eventSlug);
    const apiEventName = getEventDisplayName(fights);
    if (apiEventName) eventName = apiEventName;
  }

  const title = (dict.predictions.eventMetaTitle || `${dict.predictions.prediction} ${eventName}`)
    .replace('{event}', eventName);
  const description = (dict.predictions.eventMetaDesc || dict.predictions.description)
    .replace('{event}', eventName);

  return {
    title,
    description,
    alternates: {
      canonical: `${p}/predictions/${eventSlug}`,
      languages: Object.fromEntries(
        i18n.locales.map((l) => [localeHtmlLang[l], `${siteUrl}${localePrefix(l)}/predictions/${eventSlug}`])
      ),
    },
    openGraph: { title, description, type: 'website' },
  };
}

export default async function EventPredictionsPage({ params }: Props) {
  const { locale, eventSlug } = await params;
  const dict = await getDictionary(locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';
  const p = localePrefix(locale);
  const countryCode = LOCALE_TO_COUNTRY[locale] || undefined;
  const topBookmakers = getBookmakersForCountry(countryCode).slice(0, 3);
  const topIds = topBookmakers.map(b => b.apiId);
  const dateLabel = formatEventLabel(eventSlug, locale as Locale);

  const cachedData = await getCachedOddsData();
  let fights: Fight[] = [];
  if (isDateSlug(eventSlug)) {
    fights = getFightsForDate(cachedData, eventSlug);
  }

  // Use real event name from API slug when available
  const eventName = getEventDisplayName(fights) || dateLabel;

  const oddsMap = new Map<number, Odds>();
  for (const fight of fights) {
    const odds = cachedData.odds[String(fight.id)];
    if (odds) oddsMap.set(fight.id, odds);
  }

  const mainCard = fights.filter(f => f.is_main);
  const undercard = fights.filter(f => !f.is_main);

  const h1 = (dict.predictions.eventH1 || `${dict.predictions.prediction} ${eventName}`)
    .replace('{event}', eventName);

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: dict.nav.home, url: `${siteUrl}${p}/` },
        { name: dict.nav.predictions, url: `${siteUrl}${p}/predictions` },
        { name: h1, url: `${siteUrl}${p}/predictions/${eventSlug}` },
      ]} />

      <div className="container-page">
        <div className="lg:flex lg:gap-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
              {h1}
            </h1>
            <p className="text-gray-500 mb-8">{dict.predictions.description}</p>

            {fights.length > 0 ? (
              <div className="space-y-8">
                {mainCard.length > 0 && (
                  <section>
                    <h2 className="text-lg font-heading font-bold mb-4 flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-semibold">{dict.odds.mainCard || 'Main Card'}</span>
                      {dict.odds.mainCard}
                    </h2>
                    <div className="space-y-3">
                      {mainCard.map(fight => (
                        <FightCard key={fight.id} fight={fight} odds={oddsMap.get(fight.id) || null} p={p} eventSlug={eventSlug} dict={dict} topIds={topIds} countryCode={countryCode} />
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  {mainCard.length > 0 && (
                    <h2 className="text-lg font-heading font-bold mb-4">{dict.odds.fightCard}</h2>
                  )}
                  <div className="space-y-3">
                    {undercard.map(fight => (
                      <FightCard key={fight.id} fight={fight} odds={oddsMap.get(fight.id) || null} p={p} eventSlug={eventSlug} dict={dict} topIds={topIds} countryCode={countryCode} />
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <div className="card p-8 text-center text-gray-500 mb-8">
                <p>{dict.predictions.description}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-4 mt-8 mb-8">
              <Link href={`${p}/predictions`} className="text-primary hover:text-primary-dark">&larr; {dict.predictions.backToEvent}</Link>
              <Link href={`${p}/odds/${eventSlug}`} className="text-primary hover:text-primary-dark">
                {dict.odds.compareOdds} &rarr;
              </Link>
            </div>

            <GamblingDisclaimer dict={dict} />
          </div>

          <aside className="w-full lg:w-72 flex-shrink-0 space-y-6 mt-10 lg:mt-16">
            <BettingPromoWidget
              title={dict.odds.bestOdds}
              betNowLabel={dict.odds.betNow}
              context={`predictions-${eventSlug}`}
            />
            <div className="card p-4">
              <h3 className="text-sm font-heading font-bold text-gray-500 uppercase tracking-wider mb-3">{eventName}</h3>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>{dict.home.fights}</span>
                  <span className="text-dark font-bold">{fights.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>{dict.odds.compareOdds}</span>
                  <span className="text-dark font-bold">{oddsMap.size}</span>
                </div>
              </div>
              <Link
                href={`${p}/odds/${eventSlug}`}
                className="block mt-3 text-center text-xs text-primary hover:text-primary-dark py-2 rounded bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                {dict.odds.viewFightOdds} &rarr;
              </Link>
            </div>
          </aside>
        </div>
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
  const f1 = fight.fighters.first;
  const f2 = fight.fighters.second;
  const ml = extractMoneyline(odds, topIds);
  const bmConfig = ml ? getBookmakerConfig(ml.bmApiId) : null;

  return (
    <div className="card overflow-hidden hover:border-primary/40 transition-all">
      <Link href={`${p}/predictions/${eventSlug}/${slug}`} className="block p-4 md:p-5 group">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-muted text-gray-500">{fight.category}</span>
          {fight.is_main && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold">{dict.odds.mainCard || 'Main Card'}</span>
          )}
          <span className="text-[10px] text-gray-600 ml-auto">{fight.time || 'TBD'}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FighterAvatar logo={f1.logo} name={f1.name} size={52} />
            <p className="font-heading font-bold group-hover:text-primary transition-colors truncate">{f1.name}</p>
          </div>

          <div className="flex-shrink-0 text-center">
            {ml ? (
              <FormattedOddPair f1={ml.f1} f2={ml.f2} />
            ) : (
              <span className="text-gray-600 text-sm font-bold">VS</span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
            <p className="font-heading font-bold group-hover:text-primary transition-colors truncate text-right">{f2.name}</p>
            <FighterAvatar logo={f2.logo} name={f2.name} size={52} />
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-between px-4 md:px-5 py-2.5 bg-surface-alt/50 border-t border-gray-200/50">
        {bmConfig ? (
          <a
            href={buildAffiliateUrl(bmConfig, `${f1.name} vs ${f2.name}`, countryCode)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-[11px] font-bold py-1.5 px-3 rounded transition-colors"
          >
            {bmConfig.logo && (
              <Image src={bmConfig.logo} alt={bmConfig.name} width={50} height={14} style={{ height: 14 }} className="opacity-90" />
            )}
            {dict.odds.betNow}
          </a>
        ) : (
          <span className="text-[10px] text-gray-600">{dict.odds.oddsComingSoon}</span>
        )}
        <Link href={`${p}/predictions/${eventSlug}/${slug}`} className="text-xs text-primary hover:text-primary-dark font-semibold">
          {dict.predictions.viewPrediction} &rarr;
        </Link>
      </div>
    </div>
  );
}
