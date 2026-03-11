'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthModal } from '@/components/auth/AuthModal';
import { KnockCoinsBalance } from '@/components/user/KnockCoinsBalance';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name.charAt(0) || '?').toUpperCase();
}

interface UserMenuProps {
  locale: string;
  strings: {
    signIn: string;
    signUp: string;
    signOut: string;
    myProfile: string;
    dashboard: string;
    shop: string;
    email: string;
    password: string;
    displayName: string;
    signInWithGoogle: string;
    or: string;
    noAccount: string;
    hasAccount: string;
    close: string;
  };
}

export function UserMenu({ locale, strings }: UserMenuProps) {
  const { user, loading, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [koBalance, setKoBalance] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch KC balance when user logs in
  useEffect(() => {
    if (!user) { setKoBalance(null); return; }
    fetch('/api/ko-points')
      .then((r) => r.json())
      .then((data) => setKoBalance(data.balance ?? 0))
      .catch(() => {});
  }, [user]);

  if (loading) return null;

  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowAuth(true)}
          className="px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
        >
          {strings.signIn}
        </button>
        {showAuth && (
          <AuthModal
            isOpen={showAuth}
            onClose={() => setShowAuth(false)}
            strings={strings}
          />
        )}
      </>
    );
  }

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
  const avatarUrl = user.user_metadata?.avatar_url || null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface-muted transition-colors"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-muted flex-shrink-0">
          {avatarUrl && !imgError ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={32}
              height={32}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary font-bold text-xs">
              {getInitials(displayName)}
            </div>
          )}
        </div>
        <svg className="w-3.5 h-3.5 text-gray-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium truncate">{displayName}</p>
            {koBalance !== null && (
              <KnockCoinsBalance balance={koBalance} size="sm" className="mt-1" />
            )}
          </div>

          <Link
            href={`/${locale}/user/${user.id}`}
            className="block px-4 py-2 text-sm text-gray-600 hover:bg-surface-muted transition-colors"
            onClick={() => setShowDropdown(false)}
          >
            {strings.myProfile}
          </Link>
          <Link
            href={`/${locale}/account`}
            className="block px-4 py-2 text-sm text-gray-600 hover:bg-surface-muted transition-colors"
            onClick={() => setShowDropdown(false)}
          >
            {strings.dashboard}
          </Link>
          <Link
            href={`/${locale}/shop`}
            className="block px-4 py-2 text-sm text-gray-600 hover:bg-surface-muted transition-colors"
            onClick={() => setShowDropdown(false)}
          >
            {strings.shop}
          </Link>

          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={() => { signOut(); setShowDropdown(false); }}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              {strings.signOut}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
