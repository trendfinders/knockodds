import Link from 'next/link';
import { type Locale, localePrefix } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';
import type { SiteSettings, SiteFooterColumn } from '@/lib/api/wordpress';

interface FooterProps {
  locale: Locale;
  dict: Dictionary;
  siteSettings?: SiteSettings | null;
}

function FooterColumn({ column, locale }: { column: SiteFooterColumn; locale: string }) {
  const p = localePrefix(locale);
  return (
    <div>
      <h3 className="font-semibold text-dark mb-3">{column.title}</h3>
      <ul className="space-y-2 text-sm text-gray-500">
        {column.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href.replace('{locale}', p)}
              className="hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer({ locale, dict, siteSettings }: FooterProps) {
  const p = localePrefix(locale);

  const hasWpFooter = siteSettings?.footer_col1 || siteSettings?.footer_col2;

  return (
    <footer className="bg-surface-alt border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href={`${p}/`} className="text-xl font-heading font-bold text-dark">
              Knock<span className="text-primary">Odds</span>
            </Link>
            <p className="mt-2 text-sm text-gray-500">
              {dict.footer.siteDescription}
            </p>
          </div>

          {/* Column 1 — from WP or default */}
          {hasWpFooter && siteSettings?.footer_col1 ? (
            <FooterColumn column={siteSettings.footer_col1} locale={locale} />
          ) : (
            <div>
              <h3 className="font-semibold text-dark mb-3">{dict.footer.betting}</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href={`${p}/bookmakers`} className="hover:text-primary transition-colors">{dict.footer.bestBookmakers}</Link></li>
                <li><Link href={`${p}/odds`} className="hover:text-primary transition-colors">{dict.nav.odds}</Link></li>
                <li><Link href={`${p}/predictions`} className="hover:text-primary transition-colors">{dict.nav.predictions}</Link></li>
              </ul>
            </div>
          )}

          {/* Column 2 — from WP or default */}
          {hasWpFooter && siteSettings?.footer_col2 ? (
            <FooterColumn column={siteSettings.footer_col2} locale={locale} />
          ) : (
            <div>
              <h3 className="font-semibold text-dark mb-3">{dict.footer.explore}</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href={`${p}/fighters`} className="hover:text-primary transition-colors">{dict.nav.fighters}</Link></li>
                <li><Link href={`${p}/rankings`} className="hover:text-primary transition-colors">{dict.nav.rankings}</Link></li>
                <li><Link href={`${p}/news`} className="hover:text-primary transition-colors">{dict.nav.news}</Link></li>
                <li><Link href={`${p}/bookmakers/bet365`} className="hover:text-primary transition-colors">Bet365 UFC</Link></li>
              </ul>
            </div>
          )}

          {/* Column 3 — from WP or default gambling */}
          {hasWpFooter && siteSettings?.footer_col3 ? (
            <FooterColumn column={siteSettings.footer_col3} locale={locale} />
          ) : (
            <div>
              <h3 className="font-semibold text-dark mb-3">{dict.gambling.responsibleGambling}</h3>
              <p className="text-sm text-gray-500">
                {dict.gambling.disclaimer}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded">18+</span>
                <span className="bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded">ADM</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer disclaimer from WP */}
        {siteSettings?.footer_disclaimer && (
          <div
            className="mt-6 text-xs text-gray-400 prose prose-sm max-w-none prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: siteSettings.footer_disclaimer }}
          />
        )}

        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} KnockOdds. {dict.footer.allRightsReserved}</p>
          <p className="mt-1">{dict.footer.trademarkNotice}</p>
        </div>
      </div>
    </footer>
  );
}
