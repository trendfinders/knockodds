'use client';

import Image from 'next/image';
import { usePreferences } from '@/components/preferences/PreferencesProvider';
import { getGamblingRegulation } from '@/lib/config/gambling-regulations';

interface GamblingDisclaimerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: { gambling: Record<string, string> };
  compact?: boolean;
}

/**
 * Country-aware gambling disclaimer.
 * Shows the appropriate regulatory body logo, helpline, and translated disclaimer
 * based on the user's detected country (geo-IP or locale).
 */
export function GamblingDisclaimer({ dict, compact = false }: GamblingDisclaimerProps) {
  const { countryCode } = usePreferences();
  const reg = getGamblingRegulation(countryCode);

  // Try country-specific disclaimer from dictionary, fallback to generic
  const disclaimerKey = `disclaimer_${reg.disclaimerKey}` as keyof typeof dict.gambling;
  const disclaimerText = dict.gambling[disclaimerKey] || dict.gambling.disclaimer;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {reg.logo && !reg.isDefault && (
          <Image src={reg.logo} alt={reg.regulatoryBody} width={24} height={24} className="opacity-60 flex-shrink-0" />
        )}
        <p>{disclaimerText} {reg.minAge}+</p>
      </div>
    );
  }

  return (
    <div className="gambling-disclaimer">
      {/* Regulatory body info */}
      {!reg.isDefault && (
        <div className="flex items-center gap-3 mb-3">
          {reg.logo && (
            <Image src={reg.logo} alt={reg.regulatoryBody} width={40} height={40} className="opacity-70 flex-shrink-0" />
          )}
          <div>
            <a
              href={reg.regulatoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-gray-600 hover:text-primary transition-colors"
            >
              {reg.regulatoryBody}
            </a>
          </div>
        </div>
      )}

      <p>{disclaimerText}</p>
      <p>{dict.gambling.oddsDisclaimer}</p>

      {/* Helpline info */}
      {reg.helplineUrl && (
        <p className="mt-2">
          <a
            href={reg.helplineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-dark text-xs transition-colors"
          >
            {dict.gambling.responsibleGambling}
          </a>
          {reg.helplinePhone && (
            <span className="text-xs text-gray-500 ml-2">
              Tel: <a href={`tel:${reg.helplinePhone.replace(/\s/g, '')}`} className="hover:text-primary">{reg.helplinePhone}</a>
            </span>
          )}
        </p>
      )}

      {/* Age restriction badge */}
      <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-gray-500 bg-surface-muted px-2 py-1 rounded">
        <span className="font-bold text-red-500">{reg.minAge}+</span>
        <span>{dict.gambling.authorizedDisclaimer || 'All listed bookmakers are authorised to operate legally.'}</span>
      </div>
    </div>
  );
}
