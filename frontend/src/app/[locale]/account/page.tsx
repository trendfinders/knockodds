import type { Metadata } from 'next';
import { type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { AccountDashboardClient } from './AccountDashboardClient';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale) as Record<string, unknown>;
  const a = (dict.account || {}) as Record<string, string>;
  return {
    title: a.dashboard || 'My Account',
    robots: { index: false },
  };
}

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dict = await getDictionary(locale as Locale) as any;
  const g = (dict.gamification || {}) as Record<string, string>;
  const a = (dict.account || {}) as Record<string, string>;

  return (
    <div className="container-page">
      <AccountDashboardClient
        locale={locale}
        strings={{
          dashboard: a.dashboard || 'My Account',
          overview: a.overview || 'Overview',
          predictions: a.predictions || 'Predictions',
          badges: a.badges || 'Badges',
          rewards: a.rewards || 'Rewards',
          settings: a.settings || 'Settings',
          koPoints: a.koPoints || 'KO Points',
          dailyBonus: a.dailyBonus || 'Daily Bonus',
          claimDaily: a.claimDaily || 'Claim Daily Bonus',
          claimed: a.claimed || 'Claimed today!',
          earnedKO: a.earnedKO || '+10 KO earned',
          totalPoints: g.totalPoints || 'Total Points',
          winRate: g.winRate || 'Win Rate',
          streak: g.streak || 'Streak',
          rank: g.rank || 'Rank',
          wins: g.wins || 'Wins',
          losses: g.losses || 'Losses',
          noPredictions: g.noPredictions || 'No predictions yet.',
          pending: g.pending || 'Pending',
          correct: g.correct || 'Correct',
          incorrect: g.incorrect || 'Incorrect',
          pointsEarned: g.pointsEarned || '+{points} pts',
          filterAll: dict.common?.viewAll || 'All',
          filterWon: g.correct || 'Won',
          filterLost: g.incorrect || 'Lost',
          filterPending: g.pending || 'Pending',
          badgesAll: g.badges || 'Badges',
          noBadges: g.noBadges || 'No badges yet',
          editBio: a.editBio || 'Edit Bio',
          editName: a.editName || 'Edit Display Name',
          save: a.save || 'Save',
          bio: a.bio || 'Bio',
          displayName: dict.auth?.displayName || 'Display Name',
          loading: dict.common?.loading || 'Loading...',
          signInRequired: g.signInToPredict || 'Sign in to access your account',
          viewShop: a.viewShop || 'Visit Shop',
          redeemHistory: a.redeemHistory || 'Redemption History',
          noRedemptions: a.noRedemptions || 'No redemptions yet.',
        }}
      />
    </div>
  );
}
