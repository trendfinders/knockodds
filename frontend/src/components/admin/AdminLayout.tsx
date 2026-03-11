'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminLayoutProps {
  locale: string;
  children: React.ReactNode;
}

const adminNav = [
  { key: '', label: 'Overview', icon: '📊' },
  { key: '/users', label: 'Users', icon: '👥' },
  { key: '/prizes', label: 'Prizes', icon: '🎁' },
  { key: '/redemptions', label: 'Redemptions', icon: '📦' },
  { key: '/analytics', label: 'Analytics', icon: '📈' },
  { key: '/logs', label: 'Logs', icon: '📋' },
];

export function AdminLayout({ locale, children }: AdminLayoutProps) {
  const pathname = usePathname();
  const basePath = `/${locale}/admin`;

  return (
    <div className="lg:flex lg:gap-6">
      {/* Sidebar */}
      <aside className="lg:w-56 flex-shrink-0 mb-6 lg:mb-0">
        <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
          {adminNav.map((item) => {
            const href = `${basePath}${item.key}`;
            const isActive = item.key === ''
              ? pathname === basePath || pathname === `${basePath}/`
              : pathname.startsWith(href);

            return (
              <Link
                key={item.key}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-gray-600 hover:bg-surface-muted'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
