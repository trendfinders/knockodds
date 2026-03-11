import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { type Locale, i18n, localeHtmlLang, localePrefix } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { getNews } from '@/lib/api/wordpress';

export const revalidate = 300;

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';

  return {
    title: dict.news.metaTitle,
    description: dict.news.description,
    alternates: {
      canonical: `${localePrefix(locale)}/news`,
      languages: Object.fromEntries(
        i18n.locales.map((l) => [localeHtmlLang[l], `${siteUrl}${localePrefix(l)}/news`])
      ),
    },
  };
}

export default async function NewsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { page: pageParam } = await searchParams;
  const dict = await getDictionary(locale as Locale);
  const p = localePrefix(locale);
  const currentPage = Math.max(1, parseInt(pageParam || '1', 10));

  let newsData;
  try {
    newsData = await getNews(currentPage, 12);
  } catch {
    newsData = { data: [], total: 0, totalPages: 0 };
  }

  const { data: articles, totalPages } = newsData;

  return (
    <div className="container-page">
      <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">{dict.news.title}</h1>
      <p className="text-gray-400 mb-8">{dict.news.description}</p>

      {articles.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <p>{dict.news.description}</p>
        </div>
      ) : (
        <>
          {/* Hero - first article */}
          {currentPage === 1 && articles[0] && (
            <Link href={`${p}/news/${articles[0].slug}`} className="block group mb-8">
              <article className="card overflow-hidden md:flex">
                {articles[0].acf?.featured_image_cdn && (
                  <div className="relative w-full md:w-1/2 aspect-video md:aspect-auto md:min-h-[300px]">
                    <Image
                      src={articles[0].acf.featured_image_cdn}
                      alt={articles[0].title.rendered}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />
                  </div>
                )}
                <div className="p-6 md:p-8 flex flex-col justify-center flex-1">
                  <time className="text-xs text-gray-500 mb-2">
                    {new Date(articles[0].date).toLocaleDateString(localeHtmlLang[locale as Locale], { day: 'numeric', month: 'long', year: 'numeric' })}
                  </time>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold mb-3 group-hover:text-primary transition-colors">
                    {articles[0].title.rendered}
                  </h2>
                  <p className="text-gray-400 line-clamp-3">
                    {articles[0].excerpt.rendered.replace(/<[^>]*>/g, '').slice(0, 200)}
                  </p>
                  <span className="mt-4 text-primary font-semibold text-sm uppercase tracking-wider">
                    {dict.news.readMore} &rarr;
                  </span>
                </div>
              </article>
            </Link>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {(currentPage === 1 ? articles.slice(1) : articles).map((article) => (
              <Link key={article.id} href={`${p}/news/${article.slug}`} className="block group">
                <article className="card overflow-hidden h-full flex flex-col">
                  {article.acf?.featured_image_cdn ? (
                    <div className="relative w-full aspect-video">
                      <Image
                        src={article.acf.featured_image_cdn}
                        alt={article.title.rendered}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-video bg-surface-muted flex items-center justify-center">
                      <span className="text-3xl text-gray-600">&#x1F94A;</span>
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <time className="text-xs text-gray-500 mb-2">
                      {new Date(article.date).toLocaleDateString(localeHtmlLang[locale as Locale], { day: 'numeric', month: 'short', year: 'numeric' })}
                    </time>
                    <h3 className="font-semibold text-dark mb-2 line-clamp-3 flex-1 group-hover:text-primary transition-colors">
                      {article.title.rendered}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {article.excerpt.rendered.replace(/<[^>]*>/g, '').slice(0, 150)}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="flex justify-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={`${p}/news${currentPage === 2 ? '' : `?page=${currentPage - 1}`}`}
                  className="px-4 py-2 rounded-lg bg-surface-alt hover:bg-surface-muted transition-colors text-sm"
                >
                  &larr; {dict.common.previous}
                </Link>
              )}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Link
                    key={pageNum}
                    href={`${p}/news${pageNum === 1 ? '' : `?page=${pageNum}`}`}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      pageNum === currentPage
                        ? 'bg-primary text-white'
                        : 'bg-surface-alt hover:bg-surface-muted'
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              })}
              {currentPage < totalPages && (
                <Link
                  href={`${p}/news?page=${currentPage + 1}`}
                  className="px-4 py-2 rounded-lg bg-surface-alt hover:bg-surface-muted transition-colors text-sm"
                >
                  {dict.common.next} &rarr;
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
