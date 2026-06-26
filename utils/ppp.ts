/**
 * Purchasing Power Parity (PPP) + local-currency display.
 *
 * Two jobs:
 *  1. PPP — discount the base USD price by region so the product is globally affordable.
 *  2. Local display — show each visitor a price in THEIR currency (converted at standard
 *     rates) so they understand the cost. Billing itself is in USD (server-authoritative);
 *     these conversions are display-only.
 *
 * Coverage is broad: ~80 countries across every region get a PPP tier, and unmapped
 * countries fall back to TIER_1 / USD (full price, no accidental under-charge).
 */

// Base prices in USD
export const BASE_PRICES = {
  PRO_MONTHLY: 7.99,
  MAX_MONTHLY: 14.99,
  PRO_ANNUAL: 79.99,
  MAX_ANNUAL: 149.99,
};

// PPP Tiers based on World Bank data / common SaaS benchmarks
export type PPPTier = 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4';

export interface CountryPPP {
  code: string;
  tier: PPPTier;
  currency: string;
  symbol: string;
}

// Multipliers applied to the base USD price
export const PPP_MULTIPLIERS: Record<PPPTier, number> = {
  TIER_1: 1.0, // 100% — high-income (US, UK, EU, AU, CA, Gulf, JP, SG)
  TIER_2: 0.7, // 70%  — upper-middle (S. Europe, Korea, parts of LatAm, CEE)
  TIER_3: 0.5, // 50%  — middle (Brazil, Mexico, S. Africa, Turkey, SE Asia)
  TIER_4: 0.3, // 30%  — lower-middle / emerging (India, Nigeria, Kenya, Uganda, Philippines)
};

// Mapped countries where the local currency is charged directly (unlocking Mobile Money & local cards)
export const SUPPORTED_LOCAL_CHARGE_COUNTRIES = ['UG', 'KE', 'TZ', 'RW', 'GH', 'NG', 'ZM', 'MW', 'CM', 'CI', 'SN', 'ZA'];

// Standard USD → local exchange rates (1 USD = N local units). Approximate
// industry-standard rates; refresh periodically. Used for DISPLAY only — billing is USD.
export const STANDARD_USD_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, CAD: 1.36, AUD: 1.52, NZD: 1.64, CHF: 0.88,
  SEK: 10.5, NOK: 10.8, DKK: 6.9, JPY: 152, SGD: 1.34, HKD: 7.8,
  AED: 3.67, SAR: 3.75, QAR: 3.64, KWD: 0.31, ILS: 3.7,
  ZAR: 18.5, NAD: 18.5, BWP: 13.7, NGN: 1550, KES: 129, UGX: 3750, GHS: 15,
  TZS: 2600, RWF: 1300, ETB: 120, ZMW: 27, EGP: 49, MAD: 10, TND: 3.1, DZD: 135,
  XOF: 600, XAF: 600,
  INR: 83, PKR: 280, BDT: 117, LKR: 300, NPR: 133, PHP: 57, IDR: 15800, VND: 25000,
  THB: 35, MYR: 4.7, CNY: 7.2, KRW: 1350, TWD: 32, TRY: 32,
  BRL: 5.1, MXN: 17, ARS: 950, COP: 3900, PEN: 3.75, CLP: 950, BOB: 6.9, PYG: 7400,
  DOP: 59, GTQ: 7.8, HNL: 24.7, NIO: 36, UYU: 39, CRC: 510, PAB: 1,
  PLN: 4.0, CZK: 23, HUF: 360, RON: 4.6, BGN: 1.8, UAH: 40, RUB: 92, KZT: 470,
  JOD: 0.71, LBP: 89000,
};

// Comprehensive country → PPP tier + currency. Unmapped countries default to US.
export const COUNTRY_MAP: Record<string, CountryPPP> = {
  // ── TIER 1 — high income ──────────────────────────────────────────────────
  US: { code: 'US', tier: 'TIER_1', currency: 'USD', symbol: '$' },
  GB: { code: 'GB', tier: 'TIER_1', currency: 'GBP', symbol: '£' },
  CA: { code: 'CA', tier: 'TIER_1', currency: 'CAD', symbol: 'CA$' },
  AU: { code: 'AU', tier: 'TIER_1', currency: 'AUD', symbol: 'A$' },
  NZ: { code: 'NZ', tier: 'TIER_1', currency: 'NZD', symbol: 'NZ$' },
  IE: { code: 'IE', tier: 'TIER_1', currency: 'EUR', symbol: '€' },
  DE: { code: 'DE', tier: 'TIER_1', currency: 'EUR', symbol: '€' },
  FR: { code: 'FR', tier: 'TIER_1', currency: 'EUR', symbol: '€' },
  NL: { code: 'NL', tier: 'TIER_1', currency: 'EUR', symbol: '€' },
  BE: { code: 'BE', tier: 'TIER_1', currency: 'EUR', symbol: '€' },
  AT: { code: 'AT', tier: 'TIER_1', currency: 'EUR', symbol: '€' },
  FI: { code: 'FI', tier: 'TIER_1', currency: 'EUR', symbol: '€' },
  LU: { code: 'LU', tier: 'TIER_1', currency: 'EUR', symbol: '€' },
  CH: { code: 'CH', tier: 'TIER_1', currency: 'CHF', symbol: 'CHF' },
  SE: { code: 'SE', tier: 'TIER_1', currency: 'SEK', symbol: 'kr' },
  NO: { code: 'NO', tier: 'TIER_1', currency: 'NOK', symbol: 'kr' },
  DK: { code: 'DK', tier: 'TIER_1', currency: 'DKK', symbol: 'kr' },
  JP: { code: 'JP', tier: 'TIER_1', currency: 'JPY', symbol: '¥' },
  SG: { code: 'SG', tier: 'TIER_1', currency: 'SGD', symbol: 'S$' },
  HK: { code: 'HK', tier: 'TIER_1', currency: 'HKD', symbol: 'HK$' },
  AE: { code: 'AE', tier: 'TIER_1', currency: 'AED', symbol: 'AED' },
  QA: { code: 'QA', tier: 'TIER_1', currency: 'QAR', symbol: 'QR' },
  KW: { code: 'KW', tier: 'TIER_1', currency: 'KWD', symbol: 'KD' },
  IL: { code: 'IL', tier: 'TIER_1', currency: 'ILS', symbol: '₪' },

  // ── TIER 2 — upper-middle ─────────────────────────────────────────────────
  IT: { code: 'IT', tier: 'TIER_2', currency: 'EUR', symbol: '€' },
  ES: { code: 'ES', tier: 'TIER_2', currency: 'EUR', symbol: '€' },
  PT: { code: 'PT', tier: 'TIER_2', currency: 'EUR', symbol: '€' },
  GR: { code: 'GR', tier: 'TIER_2', currency: 'EUR', symbol: '€' },
  SK: { code: 'SK', tier: 'TIER_2', currency: 'EUR', symbol: '€' },
  SI: { code: 'SI', tier: 'TIER_2', currency: 'EUR', symbol: '€' },
  EE: { code: 'EE', tier: 'TIER_2', currency: 'EUR', symbol: '€' },
  LV: { code: 'LV', tier: 'TIER_2', currency: 'EUR', symbol: '€' },
  LT: { code: 'LT', tier: 'TIER_2', currency: 'EUR', symbol: '€' },
  HR: { code: 'HR', tier: 'TIER_2', currency: 'EUR', symbol: '€' },
  KR: { code: 'KR', tier: 'TIER_2', currency: 'KRW', symbol: '₩' },
  TW: { code: 'TW', tier: 'TIER_2', currency: 'TWD', symbol: 'NT$' },
  SA: { code: 'SA', tier: 'TIER_2', currency: 'SAR', symbol: 'SR' },
  PL: { code: 'PL', tier: 'TIER_2', currency: 'PLN', symbol: 'zł' },
  CZ: { code: 'CZ', tier: 'TIER_2', currency: 'CZK', symbol: 'Kč' },
  HU: { code: 'HU', tier: 'TIER_2', currency: 'HUF', symbol: 'Ft' },
  RO: { code: 'RO', tier: 'TIER_2', currency: 'RON', symbol: 'lei' },
  BG: { code: 'BG', tier: 'TIER_2', currency: 'BGN', symbol: 'лв' },
  CL: { code: 'CL', tier: 'TIER_2', currency: 'CLP', symbol: 'CLP$' },
  UY: { code: 'UY', tier: 'TIER_2', currency: 'UYU', symbol: '$U' },
  CR: { code: 'CR', tier: 'TIER_2', currency: 'CRC', symbol: '₡' },
  PA: { code: 'PA', tier: 'TIER_2', currency: 'PAB', symbol: 'B/.' },
  RU: { code: 'RU', tier: 'TIER_2', currency: 'RUB', symbol: '₽' },

  // ── TIER 3 — middle ───────────────────────────────────────────────────────
  BR: { code: 'BR', tier: 'TIER_3', currency: 'BRL', symbol: 'R$' },
  MX: { code: 'MX', tier: 'TIER_3', currency: 'MXN', symbol: 'MX$' },
  ZA: { code: 'ZA', tier: 'TIER_3', currency: 'ZAR', symbol: 'R' },
  AR: { code: 'AR', tier: 'TIER_3', currency: 'ARS', symbol: 'AR$' },
  CO: { code: 'CO', tier: 'TIER_3', currency: 'COP', symbol: 'COL$' },
  PE: { code: 'PE', tier: 'TIER_3', currency: 'PEN', symbol: 'S/' },
  TR: { code: 'TR', tier: 'TIER_3', currency: 'TRY', symbol: '₺' },
  TH: { code: 'TH', tier: 'TIER_3', currency: 'THB', symbol: '฿' },
  MY: { code: 'MY', tier: 'TIER_3', currency: 'MYR', symbol: 'RM' },
  CN: { code: 'CN', tier: 'TIER_3', currency: 'CNY', symbol: '¥' },
  KZ: { code: 'KZ', tier: 'TIER_3', currency: 'KZT', symbol: '₸' },
  DO: { code: 'DO', tier: 'TIER_3', currency: 'DOP', symbol: 'RD$' },
  EC: { code: 'EC', tier: 'TIER_3', currency: 'USD', symbol: '$' },
  GT: { code: 'GT', tier: 'TIER_3', currency: 'GTQ', symbol: 'Q' },
  JO: { code: 'JO', tier: 'TIER_3', currency: 'JOD', symbol: 'JD' },
  LB: { code: 'LB', tier: 'TIER_3', currency: 'LBP', symbol: 'L£' },
  MA: { code: 'MA', tier: 'TIER_3', currency: 'MAD', symbol: 'DH' },
  TN: { code: 'TN', tier: 'TIER_3', currency: 'TND', symbol: 'DT' },
  NA: { code: 'NA', tier: 'TIER_3', currency: 'NAD', symbol: 'N$' },
  BW: { code: 'BW', tier: 'TIER_3', currency: 'BWP', symbol: 'P' },
  UA: { code: 'UA', tier: 'TIER_3', currency: 'UAH', symbol: '₴' },

  // ── TIER 4 — lower-middle / emerging ──────────────────────────────────────
  IN: { code: 'IN', tier: 'TIER_4', currency: 'INR', symbol: '₹' },
  NG: { code: 'NG', tier: 'TIER_4', currency: 'NGN', symbol: '₦' },
  KE: { code: 'KE', tier: 'TIER_4', currency: 'KES', symbol: 'KSh' },
  UG: { code: 'UG', tier: 'TIER_4', currency: 'UGX', symbol: 'USh' },
  GH: { code: 'GH', tier: 'TIER_4', currency: 'GHS', symbol: 'GH₵' },
  TZ: { code: 'TZ', tier: 'TIER_4', currency: 'TZS', symbol: 'TSh' },
  RW: { code: 'RW', tier: 'TIER_4', currency: 'RWF', symbol: 'FRw' },
  ET: { code: 'ET', tier: 'TIER_4', currency: 'ETB', symbol: 'Br' },
  ZM: { code: 'ZM', tier: 'TIER_4', currency: 'ZMW', symbol: 'ZK' },
  ZW: { code: 'ZW', tier: 'TIER_4', currency: 'USD', symbol: '$' },
  CM: { code: 'CM', tier: 'TIER_4', currency: 'XAF', symbol: 'FCFA' },
  CI: { code: 'CI', tier: 'TIER_4', currency: 'XOF', symbol: 'CFA' },
  SN: { code: 'SN', tier: 'TIER_4', currency: 'XOF', symbol: 'CFA' },
  EG: { code: 'EG', tier: 'TIER_4', currency: 'EGP', symbol: 'E£' },
  DZ: { code: 'DZ', tier: 'TIER_4', currency: 'DZD', symbol: 'DA' },
  MZ: { code: 'MZ', tier: 'TIER_4', currency: 'USD', symbol: '$' },
  MW: { code: 'MW', tier: 'TIER_4', currency: 'USD', symbol: '$' },
  MG: { code: 'MG', tier: 'TIER_4', currency: 'USD', symbol: '$' },
  PK: { code: 'PK', tier: 'TIER_4', currency: 'PKR', symbol: 'Rs' },
  BD: { code: 'BD', tier: 'TIER_4', currency: 'BDT', symbol: '৳' },
  LK: { code: 'LK', tier: 'TIER_4', currency: 'LKR', symbol: 'Rs' },
  NP: { code: 'NP', tier: 'TIER_4', currency: 'NPR', symbol: 'Rs' },
  VN: { code: 'VN', tier: 'TIER_4', currency: 'VND', symbol: '₫' },
  ID: { code: 'ID', tier: 'TIER_4', currency: 'IDR', symbol: 'Rp' },
  PH: { code: 'PH', tier: 'TIER_4', currency: 'PHP', symbol: '₱' },
  BO: { code: 'BO', tier: 'TIER_4', currency: 'BOB', symbol: 'Bs' },
  PY: { code: 'PY', tier: 'TIER_4', currency: 'PYG', symbol: '₲' },
  HN: { code: 'HN', tier: 'TIER_4', currency: 'HNL', symbol: 'L' },
  NI: { code: 'NI', tier: 'TIER_4', currency: 'NIO', symbol: 'C$' },
};

const DEFAULT_COUNTRY: CountryPPP = COUNTRY_MAP.US;

/** Resolve a country's PPP/currency info, falling back to US for unmapped codes. */
export function getCountryInfo(countryCode: string = 'US'): CountryPPP {
  return COUNTRY_MAP[(countryCode || 'US').toUpperCase()] || DEFAULT_COUNTRY;
}

/** Convert a USD amount to local currency using standard rates (display only). */
export function convertUsdToLocal(usd: number, currency: string): number {
  const rate = STANDARD_USD_RATES[currency] ?? 1;
  return usd * rate;
}

/**
 * Format a USD amount as the visitor's LOCAL currency (display only — billing is USD).
 * Uses Intl currency formatting for correct symbol, grouping, and decimal rules
 * (e.g. UGX shows no decimals, JPY none, USD two).
 */
export function formatLocalPrice(usd: number, countryCode: string = 'US'): string {
  const info = getCountryInfo(countryCode);
  const local = convertUsdToLocal(usd, info.currency);
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: info.currency,
      // Whole units for large local amounts (e.g. UGX 9,000), cents for small (USD 2.40).
      maximumFractionDigits: local >= 100 ? 0 : 2,
      minimumFractionDigits: local >= 100 ? 0 : 2,
    }).format(local);
  } catch {
    const rounded = local >= 100 ? Math.round(local) : Number(local.toFixed(2));
    return `${info.symbol}${rounded.toLocaleString()}`;
  }
}

/** True when the visitor's local currency differs from USD (so we can show a USD note). */
export function isLocalCurrencyNonUsd(countryCode: string = 'US'): boolean {
  return getCountryInfo(countryCode).currency !== 'USD';
}

/**
 * Calculates the PPP-discounted price for a country.
 *
 * @param basePriceInUSD The standard US price
 * @param countryCode The 2-letter ISO country code (e.g., 'US', 'NG')
 * @returns The adjusted price (USD) plus local-currency display info.
 */
export function getLocalizedPrice(basePriceInUSD: number, countryCode: string = 'US') {
  const countryInfo = getCountryInfo(countryCode);
  const multiplier = PPP_MULTIPLIERS[countryInfo.tier];
  const discountedPriceUSD = Number((basePriceInUSD * multiplier).toFixed(2));

  return {
    originalPriceUSD: basePriceInUSD,
    discountedPriceUSD,
    multiplier,
    tier: countryInfo.tier,
    suggestedCurrency: countryInfo.currency,
    currencySymbol: countryInfo.symbol,
    // Local-currency display (billing remains USD).
    localAmount: convertUsdToLocal(discountedPriceUSD, countryInfo.currency),
    formattedLocal: formatLocalPrice(discountedPriceUSD, countryCode),
  };
}
