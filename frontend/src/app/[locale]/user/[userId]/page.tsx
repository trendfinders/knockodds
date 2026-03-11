import type { Metadata } from 'next';
import Link from 'next/link';
import { type Locale, localePrefix } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { UserProfileClient } from './UserProfileClient';

interface Props {
  params: Promise<{ locale: string; userId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, userId } = await params;
  const dict = await getDictionary(locale as Locale);

  return {
    title: `${dict.gamification?.rankTitle || 'Profile'} | ${dict.metadata.siteName}`,
    robots: { index: false },
  };
}

export default async function UserProfilePage({ params }: Props) {
  const { locale, userId } = await params;
  const dict = await getDictionary(locale as Locale);
  const p = localePrefix(locale);
  const g = dict.gamification || {} as Record<string, string>;

  return (
    <div className="container-page">
      <div className="max-w-3xl mx-auto">
        <Link href={`${p}/leaderboard`} className="text-primary hover:text-primary-dark text-sm mb-4 inline-block">
          &larr; {g.leaderboard || 'Leaderboard'}
        </Link>

        <UserProfileClient
          userId={userId}
          strings={{
            predictions: g.predictions || 'Predictions',
            wins: g.wins || 'Wins',
            winRate: g.winRate || 'Win Rate',
            streak: g.streak || 'Streak',
            points: g.points || 'Points',
            memberSince: g.memberSince || 'Member Since',
            badges: g.badges || 'Badges',
            noBadges: g.noBadges || 'No badges yet',
            noPredictions: g.noPredictions || 'No predictions yet.',
            pending: g.pending || 'Pending',
            correct: g.correct || 'Correct',
            incorrect: g.incorrect || 'Incorrect',
            pointsEarned: g.pointsEarned || '+{points} pts',
            filterAll: dict.common?.viewAll || 'All',
            filterWon: g.correct || 'Won',
            filterLost: g.incorrect || 'Lost',
            filterPending: g.pending || 'Pending',
            recentPredictions: g.predictions || 'Recent Predictions',
            loading: dict.common?.loading || 'Loading...',
            notFound: dict.common?.notFound || 'Not found',
          }}
        />
      </div>
    </div>
  );
}
