import Link from 'next/link';
import Image from 'next/image';
import { getLatestNews } from '@/lib/api/wordpress';
import { localePrefix, localeHtmlLang, type Locale } from '@/i18n/config';

interface LatestNewsWidgetProps {
  locale: string;
  title: string;
  viewAllLabel: string;
  limit?: number;
}

export async function LatestNewsWidget({ locale, title, viewAllLabel, limit = 10 }: LatestNewsWidgetProps) {
  const articles = await getLatestNews(limit);
  const p = localePrefix(locale);

  if (articles.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading font-bold">{title}</h2>
        <Link href={`${p}/news`} className="text-sm text-primary hover:text-primary-dark font-semibold">
          {viewAllLabel} &rarr;
        </Link>
      </div>

      {/* Top 2 with images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {articles.slice(0, 2).map((article) => (
          <Link key={article.id} href={`${p}/news/${article.slug}`} className="block group">
            <article className="card overflow-hidden h-full">
              {article.acf?.featured_image_cdn ? (
                <div className="relative w-full aspect-video">
                  <Image
                    src={article.acf.featured_image_cdn}
                    alt={article.title.rendered}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              ) : (
                <div className="w-full aspect-video bg-surface-muted flex items-center justify-center">
                  <span className="text-3xl text-gray-600">&#x1F94A;</span>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title.rendered}
                </h3>
                <time className="text-xs text-gray-500 mt-1 block">
                  {new Date(article.date).toLocaleDateString(localeHtmlLang[locale as Locale], { day: 'numeric', month: 'short' })}
                </time>
              </div>
            </article>
          </Link>
        ))}
      </div>

      {/* Remaining as compact list */}
      {articles.length > 2 && (
        <div className="space-y-2">
          {articles.slice(2).map((article, i) => (
            <Link key={article.id} href={`${p}/news/${article.slug}`} className="block group">
              <article className="card p-3 flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500 w-5 text-center flex-shrink-0">{i + 3}</span>
                {article.acf?.featured_image_cdn ? (
                  <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={article.acf.featured_image_cdn}
                      alt={article.title.rendered}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded bg-surface-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-sm text-gray-600">&#x1F94A;</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {article.title.rendered}
                  </h3>
                  <time className="text-xs text-gray-500">
                    {new Date(article.date).toLocaleDateString(localeHtmlLang[locale as Locale], { day: 'numeric', month: 'short' })}
                  </time>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
