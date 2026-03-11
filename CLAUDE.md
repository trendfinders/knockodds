# UFC Best Site - MMA Platform

## Project Overview

Semi-automatic programmatic MMA platform for International Multilanguage audience. Features: news, betting odds, pronostics, fighter profiles.

## Architecture

- **Frontend**: Next.js 14+ (App Router, ISR, Tailwind) → `frontend/`
- **CMS**: WordPress headless (REST API only, Docker) → `wordpress/`
- **Automation**: Node.js jobs (scraping, AI rewriting, odds sync) → `automation/`
- **Skills**: Claude Code skills for API reference → `.claude/skills/`

## Key APIs

- **API-Sports MMA**: `https://v1.mma.api-sports.io/` — Auth: `x-apisports-key` header
- **OpenAI**: GPT-4o-mini for content generation, SEO, pronostics
- **WordPress REST**: Headless CMS at `WP_URL/wp-json/`
- **Cloudflare R2**: Image CDN storage

## Project Structure

```
.claude/skills/     → Claude Code skills (API ref, content gen, SEO, odds, images)
frontend/           → Next.js frontend (Vercel deploy)
wordpress/          → Headless WordPress (Docker)
automation/         → Cron jobs and data sync scripts
docs/               → Architecture plans and documentation
```

## Language & Locale

- All user-facing content in **Italian** (it_IT)
- Code comments and variable names in **English**
- SEO metadata in Italian

## Important Conventions

- WordPress Custom Post Types: `news`, `fighter`, `fight`, `pronostic`
- API-Sports IDs stored in WP meta: `fighter_api_id`, `fight_api_id`
- ISR revalidation via webhook on WP post save
- All pages with odds MUST include responsible gambling disclaimer
- Images must be WebP/AVIF, min 1200px for Google Discover

## Environment Variables

See `frontend/.env.local.example` for complete list.
Key vars: `API_SPORTS_KEY`, `OPENAI_API_KEY`, `WP_URL`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_CLARITY_ID`

## Skills Available

- `api-mma` — API-Sports MMA endpoint reference
- `content-generation` — OpenAI content generation patterns
- `seo-automation` — SEO, structured data, Core Web Vitals
- `odds-pronostics` — Betting odds and prediction engine
- `image-processing` — Sharp image pipeline, CDN upload

## Commands

```bash
# Frontend
cd frontend && npm run dev        # Dev server on :3000
cd frontend && npm run build      # Production build

# WordPress
cd wordpress && docker compose up  # WP on :8080, phpMyAdmin on :8081

# Automation jobs
cd automation && npm run sync:fights
cd automation && npm run sync:fighters
cd automation && npm run fetch:odds
cd automation && npm run scrape:news
cd automation && npm run generate:pronostics
```
