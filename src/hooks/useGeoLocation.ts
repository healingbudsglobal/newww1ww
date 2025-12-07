import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface LocationConfig {
  countryCode: string;
  countryName: string;
  phonePrefix: string;
  phonePlaceholder: string;
  phonePattern: string;
  postalCodeLabel: string;
  postalCodePlaceholder: string;
  postalCodePattern: string;
  dateFormat: string;
}

// Country configurations for geographically relevant form fields
const locationConfigs: Record<string, LocationConfig> = {
  PT: {
    countryCode: 'PT',
    countryName: 'Portugal',
    phonePrefix: '+351',
    phonePlaceholder: '+351 912 345 678',
    phonePattern: '^\\+?351?\\s?9[1236]\\d{1}\\s?\\d{3}\\s?\\d{3}$',
    postalCodeLabel: 'Código Postal',
    postalCodePlaceholder: '1000-001',
    postalCodePattern: '^\\d{4}-\\d{3}$',
    dateFormat: 'dd/MM/yyyy',
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    phonePrefix: '+44',
    phonePlaceholder: '+44 7911 123456',
    phonePattern: '^\\+?44?\\s?7\\d{3}\\s?\\d{6}$',
    postalCodeLabel: 'Post Code',
    postalCodePlaceholder: 'SW1A 1AA',
    postalCodePattern: '^[A-Z]{1,2}\\d[A-Z\\d]?\\s?\\d[A-Z]{2}$',
    dateFormat: 'dd/MM/yyyy',
  },
  ZA: {
    countryCode: 'ZA',
    countryName: 'South Africa',
    phonePrefix: '+27',
    phonePlaceholder: '+27 82 123 4567',
    phonePattern: '^\\+?27?\\s?[6-8]\\d{1}\\s?\\d{3}\\s?\\d{4}$',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: '0001',
    postalCodePattern: '^\\d{4}$',
    dateFormat: 'yyyy/MM/dd',
  },
  TH: {
    countryCode: 'TH',
    countryName: 'Thailand',
    phonePrefix: '+66',
    phonePlaceholder: '+66 81 234 5678',
    phonePattern: '^\\+?66?\\s?[689]\\d{1}\\s?\\d{3}\\s?\\d{4}$',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: '10110',
    postalCodePattern: '^\\d{5}$',
    dateFormat: 'dd/MM/yyyy',
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    phonePrefix: '+1',
    phonePlaceholder: '+1 (555) 123-4567',
    phonePattern: '^\\+?1?\\s?\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}$',
    postalCodeLabel: 'Zip Code',
    postalCodePlaceholder: '10001',
    postalCodePattern: '^\\d{5}(-\\d{4})?$',
    dateFormat: 'MM/dd/yyyy',
  },
  DEFAULT: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    phonePrefix: '+44',
    phonePlaceholder: '+44 7911 123456',
    phonePattern: '^\\+?\\d{10,15}$',
    postalCodeLabel: 'Post Code',
    postalCodePlaceholder: 'SW1A 1AA',
    postalCodePattern: '^[A-Z0-9\\s-]{3,10}$',
    dateFormat: 'dd/MM/yyyy',
  },
};

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

// Detect country from domain
const getCountryFromDomain = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname;
  
  if (hostname.endsWith('.pt') || hostname.includes('.pt.')) return 'PT';
  if (hostname.endsWith('.co.uk') || hostname.includes('.co.uk.')) return 'GB';
  if (hostname.endsWith('.co.za') || hostname.includes('.co.za.')) return 'ZA';
  if (hostname.endsWith('.co.th') || hostname.includes('.co.th.')) return 'TH';
  if (hostname.endsWith('.com') || hostname.endsWith('.us')) return 'US';
  
  return null;
};

export const useGeoLocation = (): LocationConfig => {
  const { i18n } = useTranslation();
  const [locationConfig, setLocationConfig] = useState<LocationConfig>(locationConfigs.DEFAULT);

  useEffect(() => {
    // Priority: 1. Domain-based detection, 2. Language-based detection
    const domainCountry = getCountryFromDomain();
    
    if (domainCountry && locationConfigs[domainCountry]) {
      setLocationConfig(locationConfigs[domainCountry]);
      return;
    }

    // Fallback to language-based detection
    const language = i18n.language;
    const countryCode = languageToCountry[language] || languageToCountry[language.split('-')[0]];
    
    if (countryCode && locationConfigs[countryCode]) {
      setLocationConfig(locationConfigs[countryCode]);
    } else {
      setLocationConfig(locationConfigs.DEFAULT);
    }
  }, [i18n.language]);

  return locationConfig;
};

export { locationConfigs };
export type { LocationConfig };
