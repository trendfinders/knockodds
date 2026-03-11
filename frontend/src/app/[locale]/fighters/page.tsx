import type { Metadata } from 'next';
import Link from 'next/link';
import { type Locale, i18n, localeHtmlLang, localePrefix } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { mmaApi } from '@/lib/api/mma-api';
import { FighterSearch } from '@/components/fighters/FighterSearch';
import { WeightClassFilter } from '@/components/fighters/WeightClassFilter';
import { FighterAvatar } from '@/components/common/FighterAvatar';
import { weightClasses } from '@/lib/config/weight-classes';
import type { Fighter } from '@/lib/types/mma-api';
import { LatestNewsWidget } from '@/components/widgets/LatestNewsWidget';

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';

  return {
    title: dict.fighters.metaTitle,
    description: dict.fighters.description,
    alternates: {
      canonical: `${localePrefix(locale)}/fighters`,
      languages: Object.fromEntries(
        i18n.locales.map((l) => [localeHtmlLang[l], `${siteUrl}${localePrefix(l)}/fighters`])
      ),
    },
  };
}

async function fetchFighters(query?: string, category?: string): Promise<Fighter[]> {
  try {
    if (query && query.length >= 3) {
      return await mmaApi.searchFighters(query);
    }
    if (category) {
      return await mmaApi.getFightersByCategory(category);
    }
    // Default: fetch popular weight classes
    const fighters = await mmaApi.getFighters({ category: 'Lightweight' });
    return fighters.slice(0, 40);
  } catch {
    return [];
  }
}

export default async function FightersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q, category } = await searchParams;
  const dict = await getDictionary(locale as Locale);
  const p = localePrefix(locale);

  const fighters = await fetchFighters(q, category);
  const categories = weightClasses.map((wc) => wc.apiCategory);

  return (
    <div className="container-page">
      <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">{dict.fighters.title}</h1>
      <p className="text-gray-500 mb-6">{dict.fighters.description}</p>

      {/* Search */}
      <div className="mb-6 max-w-md">
        <FighterSearch
          placeholder={dict.fighters.searchFighter}
          currentQuery={q || ''}
          basePath={`${p}/fighters`}
        />
      </div>

      {/* Weight Class Filter */}
      <div className="mb-8">
        <p className="text-sm text-gray-500 mb-2">{dict.fighters.weightClass}</p>
        <WeightClassFilter
          categories={categories}
          current={category || ''}
          allLabel={dict.common.viewAll}
          basePath={`${p}/fighters`}
        />
      </div>

      {/* Results */}
      {fighters.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {fighters.map((fighter) => (
            <Link
              key={fighter.id}
              href={`${p}/fighters/${fighter.id}`}
              className="card p-4 hover:border-primary/50 transition-all group flex items-center gap-4"
            >
              <FighterAvatar logo={fighter.photo || ''} name={fighter.name} size={56} />
              <div className="min-w-0">
                <p className="font-semibold text-dark group-hover:text-primary transition-colors truncate">
                  {fighter.name}
                </p>
                {fighter.nickname && (
                  <p className="text-xs text-gray-500 truncate">&quot;{fighter.nickname}&quot;</p>
                )}
                <p className="text-xs text-gray-500 mt-0.5">{fighter.category}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center text-gray-500">
          <p className="text-lg">{q ? dict.common.notFound : dict.fighters.description}</p>
          {q && <p className="text-sm mt-2">{dict.fighters.searchFighter}</p>}
        </div>
      )}

      <LatestNewsWidget
        locale={locale}
        title={dict.home.latestNews}
        viewAllLabel={dict.common.viewAll}
      />
    </div>
  );
}
