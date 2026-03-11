'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let sid = sessionStorage.getItem('kn_sid');
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem('kn_sid', sid);
  }
  return sid;
}

export function PageviewTracker() {
  const pathname = usePathname();
  const { user } = useAuth();
  const lastSent = useRef<string>('');
  const lastTime = useRef<number>(0);

  useEffect(() => {
    if (!user || !pathname) return;

    const now = Date.now();
    const key = `${pathname}`;

    // Throttle: skip if same path sent within 5 seconds
    if (key === lastSent.current && now - lastTime.current < 5000) return;

    lastSent.current = key;
    lastTime.current = now;

    const payload = JSON.stringify({
      page_path: pathname,
      session_id: getSessionId(),
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/pageviews', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('/api/pageviews', { method: 'POST', body: payload, keepalive: true }).catch(() => {});
    }
  }, [pathname, user]);

  return null;
}
