import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getNewsBySlug, getRelatedNews } from '@/lib/api/wordpress';
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { type Locale, i18n, localeHtmlLang, localePrefix } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';

export const revalidate = 300;

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale as Locale);
  const post = await getNewsBySlug(slug);
  if (!post) return { title: dict.common.notFound };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';

  return {
    title: post.acf?.seo_title || post.title.rendered,
    description: post.acf?.meta_description || post.excerpt.rendered.replace(/<[^>]*>/g, ''),
    openGraph: {
      title: post.acf?.seo_title || post.title.rendered,
      description: post.acf?.meta_description,
      type: 'article',
      images: post.acf?.featured_image_cdn ? [{ url: post.acf.featured_image_cdn }] : undefined,
    },
    robots: { index: true, follow: true, 'max-image-preview': 'large' as const },
    alternates: {
      canonical: `${localePrefix(locale)}/news/${slug}`,
      languages: Object.fromEntries(
        i18n.locales.map((l) => [localeHtmlLang[l], `${siteUrl}${localePrefix(l)}/news/${slug}`])
      ),
    },
  };
}

export default async function NewsArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale as Locale);
  const [post, relatedArticles] = await Promise.all([
    getNewsBySlug(slug),
    getRelatedNews(slug, 4),
  ]);

  if (!post) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';
  const p = localePrefix(locale);
  const wordCount = post.content.rendered.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <>
      <ArticleJsonLd
        title={post.title.rendered}
        description={post.excerpt.rendered.replace(/<[^>]*>/g, '')}
        datePublished={post.date}
        dateModified={post.modified}
        image={post.acf?.featured_image_cdn || ''}
      />
      <BreadcrumbJsonLd items={[
        { name: dict.nav.home, url: `${siteUrl}${p}/` },
        { name: dict.nav.news, url: `${siteUrl}${p}/news` },
        { name: post.title.rendered, url: `${siteUrl}${p}/news/${slug}` },
      ]} />

      <article className="container-page max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          <Link href={`${p}/news`} className="text-sm text-primary hover:text-primary-dark mb-4 inline-block">
            &larr; {dict.news.backToNews}
          </Link>
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">{post.title.rendered}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <time>{new Date(post.date).toLocaleDateString(localeHtmlLang[locale as Locale], { day: 'numeric', month: 'long', year: 'numeric' })}</time>
            <span>{readTime} min</span>
          </div>
        </header>

        {/* Featured Image */}
        {post.acf?.featured_image_cdn && (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-8">
            <Image
              src={post.acf.featured_image_cdn}
              alt={post.title.rendered}
              fill
              className="object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
              priority
            />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-invert prose-lg max-w-none prose-headings:font-heading prose-a:text-primary mb-12"
          dangerouslySetInnerHTML={{ __html: post.content.rendered }}
        />

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="border-t border-gray-200/20 pt-8 mt-8">
            <h2 className="text-2xl font-heading font-bold mb-6">{dict.news.relatedArticles}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedArticles.map((related) => (
                <Link key={related.id} href={`${p}/news/${related.slug}`} className="block group">
                  <article className="card overflow-hidden flex h-full">
                    {related.acf?.featured_image_cdn ? (
                      <div className="relative w-24 md:w-32 flex-shrink-0">
                        <Image
                          src={related.acf.featured_image_cdn}
                          alt={related.title.rendered}
                          fill
                          className="object-cover"
                          sizes="128px"
                        />
                      </div>
                    ) : (
                      <div className="w-24 md:w-32 flex-shrink-0 bg-surface-muted flex items-center justify-center">
                        <span className="text-2xl text-gray-600">&#x1F94A;</span>
                      </div>
                    )}
                    <div className="p-4 flex flex-col justify-center">
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {related.title.rendered}
                      </h3>
                      <time className="text-xs text-gray-500 mt-1">
                        {new Date(related.date).toLocaleDateString(localeHtmlLang[locale as Locale], { day: 'numeric', month: 'short' })}
                      </time>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
