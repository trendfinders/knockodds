import Link from 'next/link';
import { type Locale, localePrefix } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';
import { PreferencesButton } from '@/components/preferences/PreferencesButton';
import { MoreDropdown } from './MoreDropdown';
import { MobileMenu } from './MobileMenu';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  locale: Locale;
  dict: Dictionary;
}

export function Header({ locale, dict }: HeaderProps) {
  const p = localePrefix(locale);

  const navItems = [
    { href: `${p}/` , label: dict.nav.home },
    { href: `${p}/news`, label: dict.nav.news },
    { href: `${p}/fighters`, label: dict.nav.fighters },
    { href: `${p}/rankings`, label: dict.nav.rankings },
    { href: `${p}/predictions`, label: dict.nav.predictions },
    { href: `${p}/leaderboard`, label: dict.nav.leaderboard || 'Leaderboard' },
    { href: `${p}/odds`, label: dict.nav.odds },
  ];

  const moreItems = [
    { href: `${p}/bookmakers`, label: dict.nav.bookmakers },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = ((dict as any).account || {}) as Record<string, string>;
  const userMenuStrings = {
    signIn: dict.auth.signIn,
    signUp: dict.auth.signUp,
    signOut: dict.auth.signOut,
    myProfile: a.myProfile || 'My Profile',
    dashboard: a.dashboard || 'My Account',
    shop: a.shop || 'Reward Shop',
    email: dict.auth.email,
    password: dict.auth.password,
    displayName: dict.auth.displayName,
    signInWithGoogle: dict.auth.signInWithGoogle,
    or: dict.auth.or,
    noAccount: dict.auth.noAccount,
    hasAccount: dict.auth.hasAccount,
    close: dict.auth.close,
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      {/* Red accent bar */}
      <div className="h-1 bg-primary" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href={`${p}/`} className="flex items-center gap-2">
            <span className="text-2xl font-heading font-bold text-dark">
              Knock<span className="text-primary">Odds</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <MoreDropdown label={dict.nav.more} items={moreItems} />
            <div className="ml-3 flex items-center gap-2">
              <PreferencesButton />
              <UserMenu locale={locale} strings={userMenuStrings} />
            </div>
          </nav>
          <div className="flex md:hidden items-center gap-2">
            <UserMenu locale={locale} strings={userMenuStrings} />
            <PreferencesButton />
            <MobileMenu
              navItems={navItems}
              moreItems={moreItems}
              menuLabel={dict.common.menu}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
