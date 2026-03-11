'use client';

import { useCallback, type ReactNode } from 'react';

interface AffiliateLinkProps {
  bookmakerSlug: string;
  landingUrl: string;
  children: ReactNode;
  className?: string;
}

export function AffiliateLink({ bookmakerSlug, landingUrl, children, className }: AffiliateLinkProps) {
  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/affiliate/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmaker_slug: bookmakerSlug, landing_url: landingUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        window.open(data.redirect_url, '_blank', 'noopener,noreferrer');
      } else {
        // Fallback: open directly
        window.open(landingUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.open(landingUrl, '_blank', 'noopener,noreferrer');
    }
  }, [bookmakerSlug, landingUrl]);

  return (
    <a href={landingUrl} onClick={handleClick} className={className} rel="noopener noreferrer sponsored">
      {children}
    </a>
  );
}
