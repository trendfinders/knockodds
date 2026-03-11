'use client';

import { useState } from 'react';
import Image from 'next/image';

interface FighterAvatarProps {
  logo: string;
  name: string;
  size?: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (name.charAt(0) || '?').toUpperCase();
}

function InitialsPlaceholder({ name, size }: { name: string; size: number }) {
  return (
    <div
      className="rounded-full bg-surface-muted flex items-center justify-center text-primary font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {getInitials(name)}
    </div>
  );
}

export function FighterAvatar({ logo, name, size = 32 }: FighterAvatarProps) {
  const [imgError, setImgError] = useState(false);

  if (!logo || imgError) {
    return <InitialsPlaceholder name={name} size={size} />;
  }

  return (
    <Image
      src={logo}
      alt={name}
      width={size}
      height={size}
      className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size }}
      unoptimized
      onError={() => setImgError(true)}
    />
  );
}
