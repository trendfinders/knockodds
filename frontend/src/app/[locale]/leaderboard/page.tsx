import type { Metadata } from 'next';
import Link from 'next/link';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { type Locale, i18n, localeHtmlLang, localePrefix } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { BettingPromoWidget } from '@/components/widgets/BettingPromoWidget';
import { LatestNewsWidget } from '@/components/widgets/LatestNewsWidget';

export const revalidate = 300;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';
  const p = localePrefix(locale);

  const title = dict.gamification?.leaderboard || 'Leaderboard';
  const description = dict.gamification?.leaderboardDesc || 'Top MMA prediction tipsters ranked by accuracy and points.';

  return {
    title,
    description,
    alternates: {
      canonical: `${p}/leaderboard`,
      languages: Object.fromEntries(
        i18n.locales.map((l) => [localeHtmlLang[l], `${siteUrl}${localePrefix(l)}/leaderboard`])
      ),
    },
    openGraph: { title, description, type: 'website' },
  };
}

export default async function LeaderboardPage({ params }: Props) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';
  const p = localePrefix(locale);

  const g = dict.gamification || {} as Record<string, string>;

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: dict.nav.home, url: `${siteUrl}${p}/` },
        { name: g.leaderboard || 'Leaderboard', url: `${siteUrl}${p}/leaderboard` },
      ]} />

      <div className="container-page">
        <div className="lg:flex lg:gap-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
              {g.leaderboard || 'Leaderboard'}
            </h1>
            <p className="text-gray-500 mb-8">
              {g.leaderboardDesc || 'Top MMA prediction tipsters ranked by accuracy and points.'}
            </p>

            <LeaderboardTable
              strings={{
                allTime: g.allTime || 'All Time',
                thisMonth: g.thisMonth || 'This Month',
                lastMonth: g.lastMonth || 'Last Month',
                rank: g.rank || 'Rank',
                points: g.points || 'Points',
                winRate: g.winRate || 'Win Rate',
                streak: g.streak || 'Streak',
                predictions: g.predictions || 'Predictions',
                wins: g.wins || 'Wins',
                noPredictions: g.noPredictions || 'No predictions yet. Be the first!',
              }}
            />

            <div className="flex flex-wrap gap-4 mt-8 mb-8">
              <Link href={`${p}/predictions`} className="text-primary hover:text-primary-dark">
                &larr; {dict.nav.predictions}
              </Link>
            </div>
          </div>

          <aside className="w-full lg:w-72 flex-shrink-0 space-y-6 mt-10 lg:mt-16">
            <BettingPromoWidget
              title={dict.odds.bestOdds}
              betNowLabel={dict.odds.betNow}
              context="leaderboard"
            />
            <div className="card p-4 text-center">
              <p className="text-2xl mb-1">🏆</p>
              <p className="text-sm font-bold">{g.monthlyPrizes || 'Monthly prizes for top predictors!'}</p>
              <p className="text-xs text-gray-500 mt-1">
                {g.monthlyPrizesDesc || 'Top 3 predictors each month earn exclusive badges and recognition.'}
              </p>
            </div>
          </aside>
        </div>

        <LatestNewsWidget
          locale={locale}
          title={dict.home.latestNews}
          viewAllLabel={dict.common.viewAll}
        />
      </div>
    </>
  );
}
