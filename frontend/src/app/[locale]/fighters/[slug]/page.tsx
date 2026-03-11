import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { mmaApi } from '@/lib/api/mma-api';
import { getCachedFighterBio } from '@/lib/cache/content-cache';
import { BreadcrumbJsonLd, JsonLd } from '@/components/seo/JsonLd';
import { FighterAvatar } from '@/components/common/FighterAvatar';
import { type Locale, i18n, localeHtmlLang, localePrefix } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale as Locale);
  const fighterId = Number(slug);
  if (isNaN(fighterId)) return { title: dict.common.notFound };

  const fighter = await mmaApi.getFighterById(fighterId);
  if (!fighter) return { title: dict.common.notFound };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';

  return {
    title: `${fighter.name}: ${dict.fighters.record}, ${dict.fighters.characteristics}`,
    description: `${fighter.name}${fighter.nickname ? ` "${fighter.nickname}"` : ''} - ${fighter.category}. ${dict.fighters.description}`,
    alternates: {
      canonical: `${localePrefix(locale)}/fighters/${slug}`,
      languages: Object.fromEntries(
        i18n.locales.map((l) => [localeHtmlLang[l], `${siteUrl}${localePrefix(l)}/fighters/${slug}`])
      ),
    },
  };
}

export default async function FighterPage({ params }: Props) {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale as Locale);
  const fighterId = Number(slug);
  if (isNaN(fighterId)) notFound();

  const [fighter, record] = await Promise.all([
    mmaApi.getFighterById(fighterId),
    mmaApi.getFighterRecords(fighterId),
  ]);

  if (!fighter) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';
  const p = localePrefix(locale);

  // Cached AI biography (generated ONCE, cached permanently)
  let bio = null;
  const fighterData = JSON.stringify({
    name: fighter.name,
    nickname: fighter.nickname,
    category: fighter.category,
    height: fighter.height,
    weight: fighter.weight,
    reach: fighter.reach,
    stance: fighter.stance,
    age: fighter.age,
    team: fighter.team?.name,
    record: record ? {
      total: `${record.total.win}-${record.total.loss}-${record.total.draw}`,
      ko_wins: record.ko.win,
      ko_losses: record.ko.loss,
      sub_wins: record.sub.win,
      sub_losses: record.sub.loss,
    } : null,
  });
  const cacheKey = `fighter-${fighterId}-${locale}`;
  bio = await getCachedFighterBio(cacheKey, fighterData, locale);

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: fighter.name,
        image: fighter.photo,
        description: bio?.excerpt || `${fighter.name} - ${fighter.category} MMA fighter`,
      }} />
      <BreadcrumbJsonLd items={[
        { name: dict.nav.home, url: `${siteUrl}${p}/` },
        { name: dict.nav.fighters, url: `${siteUrl}${p}/fighters` },
        { name: fighter.name, url: `${siteUrl}${p}/fighters/${slug}` },
      ]} />

      <div className="container-page max-w-4xl">
        {/* Fighter Header */}
        <div className="card p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <FighterAvatar logo={fighter.photo || ''} name={fighter.name} size={128} />
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-heading font-bold">{fighter.name}</h1>
              {fighter.nickname && <p className="text-lg text-gray-500 italic">&quot;{fighter.nickname}&quot;</p>}
              <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                <span className="badge-category">{fighter.category}</span>
                {fighter.team && <span className="badge bg-surface-muted text-gray-600">{fighter.team.name}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Record */}
        {record && (
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-heading font-bold mb-4">{dict.fighters.record}</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-heading font-bold text-green-600">{record.total.win}</p>
                <p className="text-sm text-gray-500">{dict.fighters.wins}</p>
              </div>
              <div>
                <p className="text-3xl font-heading font-bold text-red-600">{record.total.loss}</p>
                <p className="text-sm text-gray-500">{dict.fighters.losses}</p>
              </div>
              <div>
                <p className="text-3xl font-heading font-bold text-gray-500">{record.total.draw}</p>
                <p className="text-sm text-gray-500">{dict.fighters.draws}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6 text-center">
              <div className="bg-surface-alt rounded-lg p-4">
                <p className="text-2xl font-bold text-orange-400">{record.ko.win}</p>
                <p className="text-xs text-gray-500">{dict.fighters.koWins}</p>
              </div>
              <div className="bg-surface-alt rounded-lg p-4">
                <p className="text-2xl font-bold text-blue-400">{record.sub.win}</p>
                <p className="text-xs text-gray-500">{dict.fighters.subWins}</p>
              </div>
            </div>
          </div>
        )}

        {/* Characteristics */}
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-heading font-bold mb-4">{dict.fighters.characteristics}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: dict.fighters.height, value: fighter.height },
              { label: dict.fighters.weight, value: fighter.weight },
              { label: dict.fighters.reach, value: fighter.reach },
              { label: dict.fighters.stance, value: fighter.stance },
            ].map(({ label, value }) => (
              <div key={label} className="bg-surface-alt rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-lg font-semibold">{value || 'N/A'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Biography */}
        {bio && (
          <section className="mb-8">
            <div className="card p-6 md:p-8">
              <div
                className="prose prose-lg max-w-none prose-headings:font-heading prose-a:text-primary"
                dangerouslySetInnerHTML={{ __html: bio.content }}
              />
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-4">
          <Link href={`${p}/fighters`} className="text-primary hover:text-primary-dark">&larr; {dict.fighters.allFighters}</Link>
          <Link href={`${p}/rankings`} className="text-primary hover:text-primary-dark">{dict.rankings.title} &rarr;</Link>
        </div>
      </div>
    </>
  );
}
