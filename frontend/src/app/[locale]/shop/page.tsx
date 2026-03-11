import type { Metadata } from 'next';
import { type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { ShopClient } from './ShopClient';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dict = await getDictionary(locale as Locale) as any;
  const s = (dict.shop || {}) as Record<string, string>;
  return {
    title: s.title || 'Reward Shop',
    robots: { index: false },
  };
}

export default async function ShopPage({ params }: Props) {
  const { locale } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dict = await getDictionary(locale as Locale) as any;
  const s = (dict.shop || {}) as Record<string, string>;

  return (
    <div className="container-page">
      <ShopClient
        locale={locale}
        strings={{
          title: s.title || 'Reward Shop',
          description: s.description || 'Redeem your KO Points for exclusive prizes!',
          all: dict.common?.viewAll || 'All',
          bettingBonus: s.bettingBonus || 'Betting Bonus',
          giftCard: s.giftCard || 'Gift Card',
          merchandise: s.merchandise || 'Merchandise',
          experience: s.experience || 'Experience',
          special: s.special || 'Special',
          redeem: s.redeem || 'Redeem',
          outOfStock: s.outOfStock || 'Out of Stock',
          insufficientCoins: s.insufficientCoins || 'Not enough KO',
          confirmRedeem: s.confirmRedeem || 'Confirm Redemption',
          cancel: dict.common?.close || 'Cancel',
          balanceAfter: s.balanceAfter || 'Balance after',
          noPrizes: s.noPrizes || 'No prizes available yet. Check back soon!',
          signInRequired: s.signInRequired || 'Sign in to redeem prizes',
          yourBalance: s.yourBalance || 'Your Balance',
          loading: dict.common?.loading || 'Loading...',
        }}
      />
    </div>
  );
}
