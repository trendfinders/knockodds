---
name: seo-automation
description: Use when optimizing content for search engines, generating structured data, configuring meta tags, or targeting Google Discover for the MMA platform
---

# SEO Automation for MMA Platform

## Overview

Automated SEO: AI meta tags, Schema.org structured data, sitemap, Core Web Vitals, Google Discover targeting.

## Core Web Vitals Targets

| Metric | Target | Strategy |
|---|---|---|
| LCP | < 2.5s | Next/Image, CDN, font preload |
| INP | < 200ms | Minimal JS, no layout thrash |
| CLS | < 0.1 | Explicit image sizes, font-display:swap |

## Google Discover Requirements

1. Images ≥ 1200px wide + `max-image-preview:large` meta
2. Compelling titles, no clickbait
3. Fresh content (news < 48h, fights < 24h)
4. E-E-A-T: author byline, source attribution, expert analysis
5. Article or SportsEvent schema required

## Title Formulas

| Type | Formula | Example |
|---|---|---|
| News | `[Keyword]: [What happened]` | `UFC 300: McGregor annuncia il ritorno` |
| Preview | `[A] vs [B]: Pronostico e Quote` | `Oliveira vs Makhachev: Pronostico e Quote` |
| Pronostic | `Pronostico [Event]: [Fight]` | `Pronostico UFC Fight Night: Holloway vs Zombie` |
| Fighter | `[Name]: Record, Statistiche e Incontri` | `Conor McGregor: Record e Statistiche` |

## Schema.org

**SportsEvent** (fights): name, startDate, competitor[], organizer
**Article** (news/pronostics): headline, datePublished, author, publisher, image
**Person** (fighters): name, image, description
**BreadcrumbList**: on all pages

## Internal Linking

- Articles → 3 related fighter profiles max
- Fight pages → both fighter profiles
- Pronostics → odds page + fight page
- Breadcrumbs on all pages

## Sitemap

Priority: fights 0.9, news 0.8, pronostics 0.8, fighters 0.7, odds 0.6.
Changefreq: odds hourly, fights/news daily, fighters weekly.
