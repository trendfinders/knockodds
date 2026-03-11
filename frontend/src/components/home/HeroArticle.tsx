import Link from 'next/link';
import { localePrefix } from '@/i18n/config';

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image?: string;
}

interface HeroArticleProps {
  article: Article;
  locale: string;
  readMoreLabel: string;
}

export function HeroArticle({ article, locale, readMoreLabel }: HeroArticleProps) {
  const p = localePrefix(locale);

  return (
    <section className="mb-10">
      <div className="relative rounded-lg border border-gray-100 bg-surface-alt overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {article.category}
            </span>
            <span className="text-sm text-gray-400">{article.readTime}</span>
          </div>
          <h3 className="text-2xl md:text-4xl font-heading font-bold text-dark mb-4 max-w-4xl leading-tight">
            <Link href={`${p}/news/${article.slug}`} className="hover:text-primary transition-colors">
              {article.title}
            </Link>
          </h3>
          <p className="text-lg text-gray-500 mb-6 max-w-3xl">{article.excerpt}</p>
          <div className="flex items-center gap-4">
            <Link href={`${p}/news/${article.slug}`} className="btn-primary">
              {readMoreLabel}
            </Link>
            <time className="text-sm text-gray-500">{article.date}</time>
          </div>
        </div>
      </div>
    </section>
  );
}
