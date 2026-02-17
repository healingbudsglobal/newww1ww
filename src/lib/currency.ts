// Currency utility — delegates country lookups to countries.ts
import { getCurrency, getCurrencySymbol, getLocale, DEFAULT_COUNTRY, COUNTRY_REGISTRY } from './countries';

// Re-export for backwards compatibility
export { getCurrency as getCurrencyForCountry, getCurrencySymbol };

// Default exchange rates (ZAR base) - used as fallback
let cachedRates: Record<string, number> = {
  ZAR: 1,
  EUR: 0.052,
  GBP: 0.044,
  USD: 0.057,
  THB: 1.98,
};

export function updateCachedRates(rates: { [key: string]: number }): void {
  cachedRates = { ...cachedRates, ...rates };
}

export function convertPrice(
  amount: number,
  fromCountryOrCurrency: string = DEFAULT_COUNTRY,
  toCountryOrCurrency: string = DEFAULT_COUNTRY,
  rates?: Record<string, number>
): number {
  const ratesMap = rates || cachedRates;

  const fromCurrency = ratesMap[fromCountryOrCurrency] !== undefined
    ? fromCountryOrCurrency
    : (COUNTRY_REGISTRY[fromCountryOrCurrency] ? getCurrency(fromCountryOrCurrency) : fromCountryOrCurrency);
  const toCurrency = ratesMap[toCountryOrCurrency] !== undefined
    ? toCountryOrCurrency
    : (COUNTRY_REGISTRY[toCountryOrCurrency] ? getCurrency(toCountryOrCurrency) : toCountryOrCurrency);

  if (fromCurrency === toCurrency) return amount;

  const fromRate = ratesMap[fromCurrency] || 1;
  const toRate = ratesMap[toCurrency] || 1;
  const amountInZAR = amount / fromRate;
  const convertedAmount = amountInZAR * toRate;

  return Math.round(convertedAmount * 100) / 100;
}

export function formatPrice(
  amount: number,
  countryCode: string = DEFAULT_COUNTRY,
  options?: {
    showSymbol?: boolean;
    convertFrom?: string;
    rates?: Record<string, number>;
  }
): string {
  const { showSymbol = true, convertFrom, rates } = options || {};

  const validCountryCode = countryCode && COUNTRY_REGISTRY[countryCode] ? countryCode : DEFAULT_COUNTRY;
  const currency = getCurrency(validCountryCode);

  let displayAmount = amount;
  if (convertFrom && convertFrom !== validCountryCode) {
    displayAmount = convertPrice(amount, convertFrom, validCountryCode, rates);
  }

  if (isNaN(displayAmount) || displayAmount === null || displayAmount === undefined) {
    displayAmount = 0;
  }

  try {
    const formatter = new Intl.NumberFormat(getLocale(validCountryCode), {
      style: showSymbol ? 'currency' : 'decimal',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(displayAmount);
  } catch {
    const symbol = getCurrencySymbol(validCountryCode);
    return `${symbol}${displayAmount.toFixed(2)}`;
  }
}
