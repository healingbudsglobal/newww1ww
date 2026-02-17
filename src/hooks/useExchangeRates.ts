import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrency } from '@/lib/countries';

export interface ExchangeRates {
  ZAR: number;
  EUR: number;
  GBP: number;
  USD: number;
  THB: number;
  [key: string]: number;
}

interface UseExchangeRatesReturn {
  rates: ExchangeRates | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  convertPrice: (amount: number, fromCurrency?: string, toCurrency?: string) => number;
  refetch: () => Promise<void>;
}

const FALLBACK_RATES: ExchangeRates = {
  ZAR: 1,
  EUR: 0.052,
  GBP: 0.044,
  USD: 0.057,
  THB: 1.98,
};

export function useExchangeRates(): UseExchangeRatesReturn {
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('exchange-rates', {
        body: { action: 'get-rates' },
      });

      if (fnError) throw fnError;

      if (data?.success && data?.rates) {
        setRates(data.rates);
        setLastUpdated(data.lastUpdated ? new Date(data.lastUpdated) : new Date());
        console.log('[Exchange Rates] Loaded live rates:', data.rates);
      } else {
        throw new Error('Invalid response from exchange rates API');
      }
    } catch (err) {
      console.error('[Exchange Rates] Error fetching rates:', err);
      setError('Failed to fetch exchange rates, using fallback');
      setRates(FALLBACK_RATES);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRates]);

  const convertPrice = useCallback(
    (amount: number, fromCurrency: string = 'ZAR', toCurrency: string = 'ZAR'): number => {
      const currentRates = rates || FALLBACK_RATES;

      const from = currentRates[fromCurrency] !== undefined ? fromCurrency : (getCurrency(fromCurrency) || fromCurrency);
      const to = currentRates[toCurrency] !== undefined ? toCurrency : (getCurrency(toCurrency) || toCurrency);

      if (from === to) return amount;

      const fromRate = currentRates[from] || 1;
      const toRate = currentRates[to] || 1;

      const amountInZAR = amount / fromRate;
      const convertedAmount = amountInZAR * toRate;

      return Math.round(convertedAmount * 100) / 100;
    },
    [rates]
  );

  return { rates, isLoading, error, lastUpdated, convertPrice, refetch: fetchRates };
}

/** @deprecated Use getCurrency from '@/lib/countries' instead */
export function getCurrencyFromCountry(countryCode: string): string {
  return getCurrency(countryCode);
}
