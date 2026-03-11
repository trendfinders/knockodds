'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface FightCardProps {
  id: number;
  fighter1: { name: string; logo: string };
  fighter2: { name: string; logo: string };
  category: string;
  date: string;
  eventSlug: string;
  isMain: boolean;
  status: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name.charAt(0) || '?').toUpperCase();
}

function FighterPhoto({ logo, name }: { logo: string; name: string }) {
  const [error, setError] = useState(false);

  if (!logo || error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-primary font-bold text-lg">
        {getInitials(name)}
      </div>
    );
  }

  return <Image src={logo} alt={name} fill className="object-cover" sizes="64px" onError={() => setError(true)} />;
}

export function FightCard({ id, fighter1, fighter2, category, date, eventSlug, isMain, status }: FightCardProps) {
  const isLive = status === 'LIVE' || status === 'IN' || status === 'EOR';

  return (
    <Link href={`/fights/${id}`} className="card group">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="badge-category">{category}</span>
          {isLive && <span className="badge-live">LIVE</span>}
          {isMain && !isLive && <span className="badge bg-amber-50 text-amber-700">Main Event</span>}
        </div>

        <div className="flex items-center justify-between gap-4 mb-4">
          {/* Fighter 1 */}
          <div className="flex flex-col items-center text-center flex-1">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-surface-muted mb-2">
              <FighterPhoto logo={fighter1.logo} name={fighter1.name} />
            </div>
            <span className="text-sm font-medium line-clamp-1">{fighter1.name}</span>
          </div>

          <span className="text-2xl font-heading font-bold text-gray-600">VS</span>

          {/* Fighter 2 */}
          <div className="flex flex-col items-center text-center flex-1">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-surface-muted mb-2">
              <FighterPhoto logo={fighter2.logo} name={fighter2.name} />
            </div>
            <span className="text-sm font-medium line-clamp-1">{fighter2.name}</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 line-clamp-1">{eventSlug}</p>
          <time className="text-xs text-gray-400">
            {new Date(date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </time>
        </div>
      </div>
    </Link>
  );
}
