export const siteConfig = {
  name: 'KnockOdds',
  description: 'MMA news, events, fighters and analysis',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com',
  locale: 'en-IE',
  language: 'en',
  ogImage: '/og-default.png',
  author: 'KnockOdds',
  twitterHandle: '@knockodds',
  links: {
    responsibleGambling: 'https://www.begambleaware.org',
  }
} as const;

export const gamblingDisclaimer = {
  short: 'Gambling can be addictive. Play responsibly. 18+',
  long: 'Gambling can be addictive. Play responsibly. Prohibited for under 18s. Odds may vary. Always check on the bookmaker\'s site before placing a bet.',
  link: 'https://www.begambleaware.org'
} as const;
