'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface FighterSearchProps {
  placeholder: string;
  currentQuery: string;
  basePath: string;
}

export function FighterSearch({ placeholder, currentQuery, basePath }: FighterSearchProps) {
  const [query, setQuery] = useState(currentQuery);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSearch = (value: string) => {
    setQuery(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (value) params.set('q', value);
      router.push(`${basePath}${params.toString() ? `?${params}` : ''}`);
    });
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-surface-alt border border-gray-200 rounded-lg text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
