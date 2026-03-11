import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getNewsBySlug } from '@/lib/api/wordpress';
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
  const post = await getNewsBySlug(slug);

  if (!post) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';
  const p = localePrefix(locale);

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
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">{post.title.rendered}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <time>{new Date(post.date).toLocaleDateString(localeHtmlLang[locale as Locale], { day: 'numeric', month: 'long', year: 'numeric' })}</time>
            {post.acf?.source_url && <span>{dict.common.viewAll}</span>}
          </div>
        </header>
        <div
          className="prose prose-invert prose-lg max-w-none prose-headings:font-heading prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: post.content.rendered }}
        />
        <div className="mt-8">
          <Link href={`${p}/news`} className="text-primary hover:text-primary-dark">
            &larr; {dict.news.backToNews}
          </Link>
        </div>
      </article>
    </>
  );
}
