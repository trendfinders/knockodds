import Link from 'next/link';
import { localePrefix } from '@/i18n/config';
import type { Article } from './HeroArticle';

interface ArticleGridProps {
  articles: Article[];
  locale: string;
}

export function ArticleGrid({ articles, locale }: ArticleGridProps) {
  const p = localePrefix(locale);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {articles.map((article) => (
        <Link key={article.slug} href={`${p}/news/${article.slug}`} className="block group">
          <article className="card p-5 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-semibold text-primary uppercase">{article.category}</span>
              <span className="text-xs text-gray-500">{article.readTime}</span>
            </div>
            <h3 className="font-semibold text-dark mb-3 line-clamp-3 flex-1 group-hover:text-primary transition-colors">
              {article.title}
            </h3>
            <time className="text-xs text-gray-500">{article.date}</time>
          </article>
        </Link>
      ))}
    </div>
  );
}
