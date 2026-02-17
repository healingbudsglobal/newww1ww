import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  COUNTRY_REGISTRY,
  getCountryFromDomain,
  DEFAULT_COUNTRY,
  type CountryConfig,
} from '@/lib/countries';

// Re-export CountryConfig as LocationConfig for backwards compatibility
export type LocationConfig = CountryConfig & {
  countryCode: string;
  countryName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
};

/** Adapt a CountryConfig to the legacy LocationConfig shape */
function toLocationConfig(cfg: CountryConfig): LocationConfig {
  return {
    ...cfg,
    countryCode: cfg.alpha2,
    countryName: cfg.name,
    email: cfg.contactEmail,
    phone: cfg.contactPhone,
    address: cfg.contactAddress,
    city: cfg.contactCity,
  };
}

// Map language codes to country codes
const languageToCountry: Record<string, string> = {
  pt: 'PT',
  'pt-PT': 'PT',
  'pt-BR': 'PT',
  en: 'GB',
  'en-GB': 'GB',
  'en-US': 'US',
  'en-ZA': 'ZA',
  th: 'TH',
  'th-TH': 'TH',
};

const getInitialConfig = (): LocationConfig => {
  const code = getCountryFromDomain();
  return toLocationConfig(COUNTRY_REGISTRY[code] || COUNTRY_REGISTRY[DEFAULT_COUNTRY]);
};

export const useGeoLocation = (): LocationConfig => {
  const { i18n } = useTranslation();
  const [locationConfig, setLocationConfig] = useState<LocationConfig>(() => getInitialConfig());

  useEffect(() => {
    const domainCountry = getCountryFromDomain();
    if (COUNTRY_REGISTRY[domainCountry]) return;

    const language = i18n.language;
    const countryCode = languageToCountry[language] || languageToCountry[language.split('-')[0]];
    if (countryCode && COUNTRY_REGISTRY[countryCode]) {
      setLocationConfig(toLocationConfig(COUNTRY_REGISTRY[countryCode]));
    }
  }, [i18n.language]);

  return locationConfig;
};

export { COUNTRY_REGISTRY as locationConfigs };
