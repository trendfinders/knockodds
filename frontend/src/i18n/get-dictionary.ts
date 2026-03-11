import type { Locale } from './config';

const dictionaries = {
  es: () => import('./dictionaries/es.json').then((m) => m.default),
  it: () => import('./dictionaries/it.json').then((m) => m.default),
  fr: () => import('./dictionaries/fr.json').then((m) => m.default),
  de: () => import('./dictionaries/de.json').then((m) => m.default),
  pt: () => import('./dictionaries/pt.json').then((m) => m.default),
  'pt-br': () => import('./dictionaries/pt-br.json').then((m) => m.default),
  ru: () => import('./dictionaries/ru.json').then((m) => m.default),
  uk: () => import('./dictionaries/uk.json').then((m) => m.default),
  en: () => import('./dictionaries/en.json').then((m) => m.default),
  bg: () => import('./dictionaries/bg.json').then((m) => m.default),
  pl: () => import('./dictionaries/pl.json').then((m) => m.default),
  el: () => import('./dictionaries/el.json').then((m) => m.default),
  'es-mx': () => import('./dictionaries/es-mx.json').then((m) => m.default),
};

export const getDictionary = async (locale: Locale) => dictionaries[locale]();

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
