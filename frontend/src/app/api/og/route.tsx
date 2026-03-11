import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'KnockOdds';
  const subtitle = searchParams.get('subtitle') || 'MMA News, Events, Fighters and Analysis';
  const type = searchParams.get('type') || 'default';

  const typeColors: Record<string, string> = {
    fight: '#e94560',
    news: '#3b82f6',
    pronostic: '#ffd700',
    fighter: '#10b981',
    default: '#e94560',
  };

  const accentColor = typeColors[type] || typeColors.default;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          padding: 60,
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              fontSize: 52,
              fontWeight: 'bold',
              color: '#ffffff',
              lineHeight: 1.2,
              maxWidth: 900,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 28, color: accentColor }}>
            {subtitle}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: '#ffffff',
              }}
            >
              Knock
            </div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: accentColor }}>
              Odds
            </div>
          </div>
          <div style={{ fontSize: 18, color: '#6b7280' }}>
            knockodds.com
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
