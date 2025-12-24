import { useState, useEffect, useMemo } from 'react';
import { useGeoLocation } from './useGeoLocation';
import { getNewsArticlesByRegion, NewsArticle } from '@/data/newsArticles';

export type NewsRegion = 'GB' | 'PT' | 'ZA';

interface RegionOption {
  code: NewsRegion;
  label: string;
  flag: string;
}

export const regionOptions: RegionOption[] = [
  { code: 'GB', label: 'United Kingdom', flag: '🇬🇧' },
  { code: 'PT', label: 'Portugal', flag: '🇵🇹' },
  { code: 'ZA', label: 'South Africa', flag: '🇿🇦' },
];

const STORAGE_KEY = 'healing-buds-news-region';

export const useNewsRegion = () => {
  const locationConfig = useGeoLocation();
  const [selectedRegion, setSelectedRegion] = useState<NewsRegion | null>(null);

  // Load saved region preference on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['GB', 'PT', 'ZA'].includes(saved)) {
      setSelectedRegion(saved as NewsRegion);
    }
  }, []);

  // The active region is either manually selected or auto-detected
  const activeRegion: NewsRegion = selectedRegion || 
    (['GB', 'PT', 'ZA'].includes(locationConfig.countryCode) 
      ? locationConfig.countryCode as NewsRegion 
      : 'GB');

  const setRegion = (code: NewsRegion) => {
    setSelectedRegion(code);
    localStorage.setItem(STORAGE_KEY, code);
  };

  const clearRegionOverride = () => {
    setSelectedRegion(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const isManuallySelected = selectedRegion !== null;

  const articles = useMemo(() => 
    getNewsArticlesByRegion(activeRegion), 
    [activeRegion]
  );

  const currentRegionOption = regionOptions.find(r => r.code === activeRegion) || regionOptions[0];

  return {
    activeRegion,
    setRegion,
    clearRegionOverride,
    isManuallySelected,
    articles,
    regionOptions,
    currentRegionOption,
  };
};
