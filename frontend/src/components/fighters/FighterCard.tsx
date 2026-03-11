'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface FighterCardProps {
  id: number;
  name: string;
  nickname?: string;
  photo: string;
  category: string;
  record: { wins: number; losses: number; draws: number };
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name.charAt(0) || '?').toUpperCase();
}

export function FighterCard({ id, name, nickname, photo, category, record }: FighterCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link href={`/fighters/${id}`} className="card group text-center">
      <div className="p-5">
        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-surface-muted mx-auto mb-3">
          {photo && !imgError ? (
            <Image src={photo} alt={name} fill className="object-cover" sizes="96px" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary font-bold text-2xl">
              {getInitials(name)}
            </div>
          )}
        </div>
        <h3 className="font-semibold group-hover:text-primary transition-colors">{name}</h3>
        {nickname && <p className="text-xs text-gray-500 italic">&quot;{nickname}&quot;</p>}
        <span className="badge-category mt-2">{category}</span>
        <p className="text-lg font-heading font-bold mt-3">
          <span className="text-green-600">{record.wins}</span>
          <span className="text-gray-600"> - </span>
          <span className="text-red-600">{record.losses}</span>
          {record.draws > 0 && (
            <>
              <span className="text-gray-600"> - </span>
              <span className="text-gray-400">{record.draws}</span>
            </>
          )}
        </p>
      </div>
    </Link>
  );
}
