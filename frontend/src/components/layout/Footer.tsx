import Link from 'next/link';
import { type Locale, localePrefix } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';

interface FooterProps {
  locale: Locale;
  dict: Dictionary;
}

export function Footer({ locale, dict }: FooterProps) {
  const p = localePrefix(locale);

  return (
    <footer className="bg-surface-alt border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href={`${p}/`} className="text-xl font-heading font-bold text-dark">
              Knock<span className="text-primary">Odds</span>
            </Link>
            <p className="mt-2 text-sm text-gray-500">
              {dict.footer.siteDescription}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-dark mb-3">{dict.footer.betting}</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href={`${p}/bookmakers`} className="hover:text-primary transition-colors">{dict.footer.bestBookmakers}</Link></li>
              <li><Link href={`${p}/odds`} className="hover:text-primary transition-colors">{dict.nav.odds}</Link></li>
              <li><Link href={`${p}/predictions`} className="hover:text-primary transition-colors">{dict.nav.predictions}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-dark mb-3">{dict.footer.explore}</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href={`${p}/fighters`} className="hover:text-primary transition-colors">{dict.nav.fighters}</Link></li>
              <li><Link href={`${p}/rankings`} className="hover:text-primary transition-colors">{dict.nav.rankings}</Link></li>
              <li><Link href={`${p}/news`} className="hover:text-primary transition-colors">{dict.nav.news}</Link></li>
              <li><Link href={`${p}/bookmakers/22bet`} className="hover:text-primary transition-colors">22Bet UFC</Link></li>
              <li><Link href={`${p}/bookmakers/bet365`} className="hover:text-primary transition-colors">Bet365 UFC</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-dark mb-3">{dict.gambling.responsibleGambling}</h3>
            <p className="text-sm text-gray-500">
              {dict.gambling.disclaimer}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded">18+</span>
              <span className="bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded">ADM</span>
            </div>
            <a
              href="https://www.giocoresponsabile.it"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-sm text-primary hover:text-primary-dark transition-colors"
            >
              giocoresponsabile.it &rarr;
            </a>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} KnockOdds. {dict.footer.allRightsReserved}</p>
          <p className="mt-1">{dict.footer.trademarkNotice}</p>
        </div>
      </div>
    </footer>
  );
}
