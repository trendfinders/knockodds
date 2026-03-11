import { NextRequest, NextResponse } from 'next/server';
import { i18n } from './i18n/config';

/**
 * Middleware routing:
 * - English (default) lives at root `/` with NO prefix
 * - Other locales use prefix: `/es/`, `/it/`, `/fr/`, etc.
 * - `/en/...` redirects to `/...` (canonical English = root)
 * - `/` rewrites internally to `/en/` (Next.js needs the [locale] segment)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, API routes, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return;
  }

  // Read geo-IP country from Vercel (available on Vercel Edge, empty locally)
  const geoCountry = request.headers.get('x-vercel-ip-country') || '';

  // If path starts with /en/ or is exactly /en → redirect to root (remove /en prefix)
  if (pathname.startsWith('/en/') || pathname === '/en') {
    const url = request.nextUrl.clone();
    url.pathname = pathname === '/en' ? '/' : pathname.replace(/^\/en/, '');
    const response = NextResponse.redirect(url, 301);
    if (geoCountry) response.cookies.set('geo-country', geoCountry, { path: '/', maxAge: 86400 });
    return response;
  }

  // Check if pathname has a non-default locale prefix
  const nonDefaultLocales = i18n.locales.filter((l) => l !== i18n.defaultLocale);
  const pathnameHasLocale = nonDefaultLocales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    // Still set geo cookie on locale pages
    if (geoCountry) {
      const response = NextResponse.next();
      response.cookies.set('geo-country', geoCountry, { path: '/', maxAge: 86400 });
      return response;
    }
    return;
  }

  // No locale in path → rewrite to /en/ (default) internally
  // URL stays as `/news` in browser but renders `/en/news`
  const url = request.nextUrl.clone();
  url.pathname = `/${i18n.defaultLocale}${pathname}`;
  const response = NextResponse.rewrite(url);
  if (geoCountry) response.cookies.set('geo-country', geoCountry, { path: '/', maxAge: 86400 });
  return response;
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
};
