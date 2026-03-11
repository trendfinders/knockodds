/**
 * Country-specific gambling regulation config.
 * Controls which disclaimer text, regulatory body, and logos to show.
 */
export interface GamblingRegulation {
  countryCode: string;
  regulatoryBody: string;
  regulatoryUrl: string;
  logo: string;              // Path in /public/gambling/
  minAge: number;
  disclaimerKey: string;     // Key suffix for i18n — e.g. 'it' → gambling.disclaimer_it
  helplineUrl?: string;
  helplinePhone?: string;
}

export const GAMBLING_REGULATIONS: Record<string, GamblingRegulation> = {
  IT: {
    countryCode: 'IT',
    regulatoryBody: 'ADM - Agenzia delle Dogane e dei Monopoli',
    regulatoryUrl: 'https://www.adm.gov.it',
    logo: '/gambling/adm-logo.svg',
    minAge: 18,
    disclaimerKey: 'it',
    helplineUrl: 'https://www.tvnga.it',
    helplinePhone: '800 558822',
  },
  ES: {
    countryCode: 'ES',
    regulatoryBody: 'DGOJ - Dirección General de Ordenación del Juego',
    regulatoryUrl: 'https://www.ordenacionjuego.es',
    logo: '/gambling/dgoj-logo.svg',
    minAge: 18,
    disclaimerKey: 'es',
    helplineUrl: 'https://www.jugarbien.es',
    helplinePhone: '900 200 225',
  },
  FR: {
    countryCode: 'FR',
    regulatoryBody: 'ANJ - Autorité Nationale des Jeux',
    regulatoryUrl: 'https://www.anj.fr',
    logo: '/gambling/anj-logo.svg',
    minAge: 18,
    disclaimerKey: 'fr',
    helplineUrl: 'https://www.joueurs-info-service.fr',
    helplinePhone: '09 74 75 13 13',
  },
  GB: {
    countryCode: 'GB',
    regulatoryBody: 'Gambling Commission',
    regulatoryUrl: 'https://www.gamblingcommission.gov.uk',
    logo: '/gambling/gc-logo.svg',
    minAge: 18,
    disclaimerKey: 'gb',
    helplineUrl: 'https://www.begambleaware.org',
    helplinePhone: '0808 8020 133',
  },
  DE: {
    countryCode: 'DE',
    regulatoryBody: 'GGL - Gemeinsame Glücksspielbehörde der Länder',
    regulatoryUrl: 'https://www.ggl-authorities.de',
    logo: '/gambling/ggl-logo.svg',
    minAge: 18,
    disclaimerKey: 'de',
    helplineUrl: 'https://www.check-dein-spiel.de',
    helplinePhone: '0800 1 372 700',
  },
  PT: {
    countryCode: 'PT',
    regulatoryBody: 'SRIJ - Serviço de Regulação e Inspeção de Jogos',
    regulatoryUrl: 'https://www.srij.turismodeportugal.pt',
    logo: '/gambling/srij-logo.svg',
    minAge: 18,
    disclaimerKey: 'pt',
    helplineUrl: 'https://www.jogoresponsavel.pt',
  },
  BR: {
    countryCode: 'BR',
    regulatoryBody: 'SPA/MF - Secretaria de Prêmios e Apostas',
    regulatoryUrl: 'https://www.gov.br/fazenda',
    logo: '/gambling/spa-logo.svg',
    minAge: 18,
    disclaimerKey: 'br',
  },
  GR: {
    countryCode: 'GR',
    regulatoryBody: 'EEEP - Hellenic Gaming Commission',
    regulatoryUrl: 'https://www.gamingcommission.gov.gr',
    logo: '/gambling/eeep-logo.svg',
    minAge: 21,
    disclaimerKey: 'gr',
  },
  PL: {
    countryCode: 'PL',
    regulatoryBody: 'Ministerstwo Finansów',
    regulatoryUrl: 'https://www.gov.pl/web/finanse',
    logo: '/gambling/mf-pl-logo.svg',
    minAge: 18,
    disclaimerKey: 'pl',
  },
  BG: {
    countryCode: 'BG',
    regulatoryBody: 'NRA - National Revenue Agency',
    regulatoryUrl: 'https://www.nra.bg',
    logo: '/gambling/nra-bg-logo.svg',
    minAge: 18,
    disclaimerKey: 'bg',
  },
};

/** Default regulation for countries not specifically listed */
export const DEFAULT_REGULATION: Omit<GamblingRegulation, 'countryCode'> = {
  regulatoryBody: '',
  regulatoryUrl: 'https://www.begambleaware.org',
  logo: '',
  minAge: 18,
  disclaimerKey: 'default',
  helplineUrl: 'https://www.begambleaware.org',
};

/** Get regulation for a country, falling back to default */
export function getGamblingRegulation(countryCode?: string): GamblingRegulation & { isDefault: boolean } {
  if (countryCode && GAMBLING_REGULATIONS[countryCode]) {
    return { ...GAMBLING_REGULATIONS[countryCode], isDefault: false };
  }
  return {
    countryCode: countryCode || 'XX',
    ...DEFAULT_REGULATION,
    isDefault: true,
  };
}
