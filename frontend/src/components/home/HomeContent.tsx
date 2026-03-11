import type { Article } from './HeroArticle';
import { HeroArticle } from './HeroArticle';
import { ArticleGrid } from './ArticleGrid';
import { Pagination } from '@/components/common/Pagination';
import { localePrefix } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';

interface HomeContentProps {
  articles: Article[];
  currentPage: number;
  totalPages: number;
  locale: string;
  dict: Dictionary;
}

export function HomeContent({ articles, currentPage, totalPages, locale, dict }: HomeContentProps) {
  const isFirstPage = currentPage === 1;
  const hero = isFirstPage ? articles[0] : null;
  const gridArticles = isFirstPage ? articles.slice(1) : articles;

  return (
    <div className="container-page">
      <h1 className="text-4xl md:text-5xl font-heading font-bold mb-8">KnockOdds</h1>
      <h2 className="text-2xl font-heading font-bold mb-6">{dict.home.latestNews}</h2>

      {hero && (
        <HeroArticle
          article={hero}
          locale={locale}
          readMoreLabel={dict.news.readMore}
        />
      )}

      <ArticleGrid articles={gridArticles} locale={locale} />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={localePrefix(locale) || ''}
        prevLabel={dict.common.previous}
        nextLabel={dict.common.next}
        pageLabel={dict.common.page}
      />
    </div>
  );
}
