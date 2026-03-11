'use client';

import { useCallback } from 'react';

interface AffiliateTrackerProps {
  bookmakerName: string;
  bookmakerUrl: string;
  affiliateId: string;
  fightContext?: string;
  odds?: string;
  children: React.ReactNode;
  className?: string;
}

export function AffiliateTracker({
  bookmakerName,
  bookmakerUrl,
  affiliateId,
  fightContext,
  odds,
  children,
  className,
}: AffiliateTrackerProps) {
  const handleClick = useCallback(() => {
    // Push event to GTM dataLayer
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'affiliate_click',
        bookmaker: bookmakerName,
        fight_context: fightContext,
        odds_value: odds,
        click_id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      });
    }

    // Store click for conversion attribution
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('last_affiliate_click', JSON.stringify({
        bookmaker: bookmakerName,
        fight: fightContext,
        timestamp: Date.now(),
      }));
    }
  }, [bookmakerName, fightContext, odds]);

  const url = new URL(bookmakerUrl);
  url.searchParams.set('ref', affiliateId);
  url.searchParams.set('utm_source', 'knockodds');
  url.searchParams.set('utm_medium', 'referral');
  if (fightContext) url.searchParams.set('utm_content', fightContext);

  return (
    <a
      href={url.toString()}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}
