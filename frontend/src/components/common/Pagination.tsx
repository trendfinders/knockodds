import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  prevLabel: string;
  nextLabel: string;
  pageLabel: string;
}

export function Pagination({ currentPage, totalPages, basePath, prevLabel, nextLabel, pageLabel }: PaginationProps) {
  if (totalPages <= 1) return null;

  // Build visible page numbers with ellipsis for large sets
  const getPages = (): (number | 'ellipsis')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2) pages.push('ellipsis');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  const pages = getPages();

  return (
    <nav className="flex items-center justify-center gap-1.5 sm:gap-2 mt-12 flex-wrap" aria-label="Pagination">
      {currentPage > 1 && (
        <Link
          href={currentPage === 2 ? basePath : `${basePath}/page/${currentPage - 1}`}
          className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:text-primary hover:border-primary/50 transition-colors"
        >
          &larr; <span className="hidden sm:inline">{prevLabel}</span>
        </Link>
      )}

      {pages.map((page, idx) => {
        if (page === 'ellipsis') {
          return <span key={`e${idx}`} className="w-8 text-center text-gray-400">...</span>;
        }
        const href = page === 1 ? basePath : `${basePath}/page/${page}`;
        const isCurrent = page === currentPage;
        return (
          <Link
            key={page}
            href={href}
            className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
              isCurrent
                ? 'bg-primary text-white'
                : 'text-gray-500 bg-white border border-gray-200 hover:text-primary hover:border-primary/50'
            }`}
            aria-current={isCurrent ? 'page' : undefined}
          >
            {page}
          </Link>
        );
      })}

      {currentPage < totalPages && (
        <Link
          href={`${basePath}/page/${currentPage + 1}`}
          className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:text-primary hover:border-primary/50 transition-colors"
        >
          <span className="hidden sm:inline">{nextLabel}</span> &rarr;
        </Link>
      )}
    </nav>
  );
}
