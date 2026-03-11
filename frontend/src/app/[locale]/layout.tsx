import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HtmlLang } from '@/components/layout/HtmlLang';
import { GTMScript } from '@/components/tracking/GTMScript';
import { ClarityScript } from '@/components/tracking/ClarityScript';
import { PreferencesProvider } from '@/components/preferences/PreferencesProvider';
import { PreferencesPopup } from '@/components/preferences/PreferencesPopup';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { PageviewTracker } from '@/components/tracking/PageviewTracker';
import { i18n, localeHtmlLang, localePrefix, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';

export function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!i18n.locales.includes(locale as Locale)) return {};

  const dict = await getDictionary(locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com';

  return {
    title: { default: dict.metadata.defaultTitle, template: `%s | ${dict.metadata.siteName}` },
    description: dict.metadata.defaultDescription,
    robots: { index: true, follow: true, 'max-image-preview': 'large' as const },
    openGraph: {
      type: 'website',
      locale: localeHtmlLang[locale as Locale],
      siteName: dict.metadata.siteName,
    },
    twitter: { card: 'summary_large_image' },
    alternates: {
      canonical: localePrefix(locale) || '/',
      languages: Object.fromEntries(
        i18n.locales.map((l) => [localeHtmlLang[l], `${siteUrl}${localePrefix(l)}/`])
      ),
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!i18n.locales.includes(locale as Locale)) {
    notFound();
  }

  const dict = await getDictionary(locale as Locale);

  return (
    <>
      <HtmlLang lang={localeHtmlLang[locale as Locale]} />
      <GTMScript />
      <ClarityScript />
      <AuthProvider>
        <PageviewTracker />
        <PreferencesProvider locale={locale}>
          <Header locale={locale as Locale} dict={dict} />
          <main className="flex-1">{children}</main>
          <Footer locale={locale as Locale} dict={dict} />
          <PreferencesPopup />
        </PreferencesProvider>
      </AuthProvider>
    </>
  );
}
