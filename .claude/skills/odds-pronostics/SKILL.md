---
name: odds-pronostics
description: Use when working with betting odds, generating fight predictions, building odds comparison tables, or implementing the pronostics engine for MMA fights
---

# MMA Odds & Pronostics Engine

## Overview

Fetches odds from API-Sports, normalizes formats, generates AI pronostics combining statistical analysis with odds data. Includes responsible gambling compliance.

## Odds Math

```typescript
function impliedProb(decimal: number): number { return (1 / decimal) * 100; }
function toAmerican(decimal: number): string {
  return decimal >= 2 ? `+${Math.round((decimal - 1) * 100)}` : `-${Math.round(100 / (decimal - 1))}`;
}
function isValueBet(ourProb: number, odds: number): boolean { return ourProb > impliedProb(odds); }
```

## Pronostics Scoring Weights

| Factor | Weight | Source |
|---|---|---|
| Win rate | 20% | `fighters/records` |
| KO rate | 15% | `fighters/records` |
| Recent form | 20% | `fights` by fighter |
| Stylistic matchup | 15% | Manual rules |
| Odds movement | 10% | `odds` over time |
| Physical attributes | 10% | `fighters` reach/height |
| Activity level | 10% | Fights/year |

## Available Bet Types (API)

| ID | Name |
|---|---|
| 2 | Home/Away |
| 4 | Over/Under |
| 5 | Fight To Go Distance |
| 6 | Round Betting |
| 17-20 | Method bets (KO/Sub per fighter) |

## Bookmakers

Marathon, bwin, Nordic Bet, 10Bet, bet365, Unibet, Betsson, 188bet, Pncl, Come On, Betway, Betcris, 888Sport, Sbo

## Affiliate Pattern

```typescript
function buildAffiliateLink(baseUrl: string, affiliateId: string, fight?: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('ref', affiliateId);
  url.searchParams.set('utm_source', 'knockodds');
  url.searchParams.set('utm_medium', 'referral');
  if (fight) url.searchParams.set('utm_content', fight);
  return url.toString();
}
```

## Responsible Gambling (MANDATORY)

Every odds page MUST include:
- "Il gioco d'azzardo può creare dipendenza. Gioca responsabilmente."
- 18+ notice
- Link to giocoresponsabile.it
- "Le quote possono variare. Verifica sul sito del bookmaker."
