'use client';

import { useRouter } from 'next/navigation';

interface WeightClassFilterProps {
  categories: string[];
  current: string;
  allLabel: string;
  basePath: string;
}

export function WeightClassFilter({ categories, current, allLabel, basePath }: WeightClassFilterProps) {
  const router = useRouter();

  const handleChange = (cat: string) => {
    const params = new URLSearchParams();
    if (cat) params.set('category', cat);
    router.push(`${basePath}${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleChange('')}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          !current ? 'bg-primary text-white' : 'bg-surface-alt text-gray-500 hover:text-dark border border-gray-200'
        }`}
      >
        {allLabel}
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => handleChange(cat)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            current === cat ? 'bg-primary text-white' : 'bg-surface-alt text-gray-500 hover:text-dark border border-gray-200'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
