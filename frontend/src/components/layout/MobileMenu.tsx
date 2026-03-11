'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
}

interface MobileMenuProps {
  navItems: NavItem[];
  moreItems: NavItem[];
  menuLabel: string;
}

export function MobileMenu({ navItems, moreItems, menuLabel }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const allItems = [...navItems, ...moreItems];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-gray-500 hover:text-primary"
        aria-label={menuLabel}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 max-w-[80vw] bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-1 bg-primary" />
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <span className="text-lg font-heading font-bold text-dark">Menu</span>
          <button
            onClick={() => setOpen(false)}
            className="p-2 text-gray-400 hover:text-dark"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="py-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 65px)' }}>
          {allItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-6 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-primary bg-red-50 border-l-3 border-primary'
                    : 'text-gray-600 hover:text-primary hover:bg-surface-alt'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
