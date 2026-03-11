import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { FighterAvatar } from '@/components/common/FighterAvatar';
import { type Locale, i18n, localeHtmlLang, localePrefix } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { weightClasses, getWeightClassBySlug, getAllWeightClassSlugs } from '@/lib/config/weight-classes';
import { mmaApi } from '@/lib/api/mma-api';
import type { Fighter, FighterRecord } from '@/lib/types/mma-api';

export const revalidate = 3600; // 1 hour

interface Props {
  params: Promise<{ locale: string; weightClass: string }>;
}

export function generateStaticParams() {
  return getAllWeightClassSlugs().map((weightClass) => ({ weightClass }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, weightClass } = await params;
  const wc = getWeightClassBySlug(weightClass);
  if (!wc) return { title: 'Not Found' };

  const dict = await getDictionary(locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';
  const p = localePrefix(locale);

  const title = dict.rankings.weightClassTitle
    .replace('{weightClass}', wc.name)
    .replace('{year}', String(new Date().getFullYear()));

  return {
    title,
    description: dict.rankings.weightClassDescription.replace('{weightClass}', wc.name),
    alternates: {
      canonical: `${p}/rankings/${weightClass}`,
      languages: Object.fromEntries(
        i18n.locales.map((l) => [localeHtmlLang[l], `${siteUrl}${localePrefix(l)}/rankings/${weightClass}`])
      ),
    },
  };
}

interface RankedFighter {
  fighter: Fighter;
  record: FighterRecord | null;
  rank: number;
}

async function getRankedFighters(apiCategory: string): Promise<RankedFighter[]> {
  try {
    const fighters = await mmaApi.getFighters({ category: apiCategory });

    // Fetch records in parallel (max 15 to avoid rate limits)
    const top = fighters.slice(0, 15);
    const records = await Promise.allSettled(
      top.map((f) => mmaApi.getFighterRecords(f.id))
    );

    const ranked: RankedFighter[] = top.map((fighter, i) => ({
      fighter,
      record: records[i].status === 'fulfilled' ? records[i].value : null,
      rank: i + 1,
    }));

    // Sort by win count (descending), then by fewer losses
    ranked.sort((a, b) => {
      const aWins = a.record?.total.win ?? 0;
      const bWins = b.record?.total.win ?? 0;
      if (bWins !== aWins) return bWins - aWins;
      const aLosses = a.record?.total.loss ?? 0;
      const bLosses = b.record?.total.loss ?? 0;
      return aLosses - bLosses;
    });

    return ranked.map((r, i) => ({ ...r, rank: i + 1 }));
  } catch (e) {
    console.error('[rankings] getRankedFighters failed:', e);
    return getMockRankedFighters();
  }
}

function getMockRankedFighters(): RankedFighter[] {
  return Array.from({ length: 15 }, (_, i) => ({
    fighter: {
      id: i + 1,
      name: `Fighter ${i + 1}`,
      nickname: null,
      photo: '',
      gender: 'Male',
      birth_date: '',
      age: 30,
      height: "5'10\"",
      weight: '155 lbs',
      reach: '72"',
      stance: 'Orthodox',
      category: 'Lightweight',
      team: { id: 1, name: 'Team Alpha' },
      last_update: '',
    },
    record: {
      fighter: { id: i + 1, name: `Fighter ${i + 1}`, photo: '' },
      total: { win: 20 - i, loss: i + 1, draw: 0 },
      ko: { win: Math.floor((20 - i) / 2), loss: Math.floor(i / 2) },
      sub: { win: Math.floor((20 - i) / 4), loss: 0 },
    },
    rank: i + 1,
  }));
}

export default async function WeightClassRankingPage({ params }: Props) {
  const { locale, weightClass } = await params;
  const wc = getWeightClassBySlug(weightClass);

  if (!wc) notFound();

  const dict = await getDictionary(locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';
  const p = localePrefix(locale);
  const ranked = await getRankedFighters(wc.apiCategory);

  // Adjacent weight classes for navigation
  const allSameGender = weightClasses.filter((w) => w.gender === wc.gender);
  const idx = allSameGender.findIndex((w) => w.slug === wc.slug);
  const prevWc = idx > 0 ? allSameGender[idx - 1] : null;
  const nextWc = idx < allSameGender.length - 1 ? allSameGender[idx + 1] : null;

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: dict.nav.home, url: `${siteUrl}${p}/` },
        { name: dict.rankings.title, url: `${siteUrl}${p}/rankings` },
        { name: wc.name, url: `${siteUrl}${p}/rankings/${weightClass}` },
      ]} />

      <div className="container-page max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
          {dict.rankings.weightClassHeading.replace('{weightClass}', wc.name)}
        </h1>
        <p className="text-gray-500 mb-2">
          {wc.weightLbs} / {wc.weightKg}
        </p>
        <p className="text-sm text-gray-500 mb-8">
          {dict.rankings.lastUpdated}: {new Date().toLocaleDateString(localeHtmlLang[locale as Locale], { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        {/* Rankings Table */}
        <div className="card overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-surface-muted">
                  <th className="text-left p-4 text-gray-500 w-12">#</th>
                  <th className="text-left p-4 text-gray-500">{dict.rankings.fighter}</th>
                  <th className="text-center p-4 text-gray-500">{dict.fighters.record}</th>
                  <th className="text-center p-4 text-gray-500">{dict.fighters.koWins}</th>
                  <th className="text-center p-4 text-gray-500">{dict.fighters.subWins}</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((r) => (
                  <tr
                    key={r.fighter.id}
                    className="border-b border-gray-200/50 hover:bg-surface-muted/50 transition-colors"
                  >
                    <td className="p-4">
                      <span className={`font-heading font-bold text-lg ${r.rank <= 3 ? 'text-primary' : 'text-gray-500'}`}>
                        {r.rank}
                      </span>
                    </td>
                    <td className="p-4">
                      <Link
                        href={`${p}/fighters/${r.fighter.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <FighterAvatar logo={r.fighter.photo || ''} name={r.fighter.name} size={40} />
                        <div>
                          <span className="font-semibold group-hover:text-primary transition-colors">
                            {r.fighter.name}
                          </span>
                          {r.fighter.nickname && (
                            <span className="block text-xs text-gray-500">&quot;{r.fighter.nickname}&quot;</span>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="p-4 text-center font-mono">
                      {r.record ? (
                        <span>
                          <span className="text-green-600">{r.record.total.win}</span>
                          -
                          <span className="text-red-600">{r.record.total.loss}</span>
                          {r.record.total.draw > 0 && (
                            <>-<span className="text-gray-500">{r.record.total.draw}</span></>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-orange-400 font-semibold">
                        {r.record?.ko.win ?? '-'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-blue-400 font-semibold">
                        {r.record?.sub.win ?? '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Adjacent Weight Classes */}
        <div className="flex flex-wrap gap-4 mb-8">
          {prevWc && (
            <Link href={`${p}/rankings/${prevWc.slug}`} className="text-primary hover:text-primary-dark">
              &larr; {prevWc.name}
            </Link>
          )}
          <Link href={`${p}/rankings`} className="text-primary hover:text-primary-dark">
            {dict.rankings.allDivisions}
          </Link>
          {nextWc && (
            <Link href={`${p}/rankings/${nextWc.slug}`} className="text-primary hover:text-primary-dark">
              {nextWc.name} &rarr;
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
