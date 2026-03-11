export const apiConfig = {
  mmaSports: {
    baseUrl: 'https://v1.mma.api-sports.io',
    headers: { 'x-apisports-key': process.env.API_SPORTS_KEY! },
  },
  wordpress: {
    baseUrl: process.env.WP_URL || 'http://localhost:8080',
    apiPath: '/wp-json',
  },
  openai: {
    model: 'gpt-4o-mini' as const,
    maxTokens: {
      newsRewrite: 2000,
      pronostic: 3000,
      seoMeta: 400,
      imageAlt: 100,
    }
  },
  cloudflareR2: {
    accountId: process.env.R2_ACCOUNT_ID!,
    accessKey: process.env.R2_ACCESS_KEY!,
    secretKey: process.env.R2_SECRET_KEY!,
    bucket: process.env.R2_BUCKET || 'knockodds-media',
    publicUrl: process.env.R2_PUBLIC_URL || 'https://media.knockodds.com',
  },
  revalidation: {
    news: 300,        // 5 minutes
    fights: 60,       // 1 minute
    fighters: 3600,   // 1 hour
    odds: 900,        // 15 minutes
    pronostics: 300,  // 5 minutes
    static: 86400,    // 24 hours
  }
} as const;
