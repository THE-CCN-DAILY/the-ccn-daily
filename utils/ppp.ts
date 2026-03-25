/**
 * Purchasing Power Parity (PPP) Utility
 * 
 * This utility adjusts the base price of subscriptions and a la carte items
 * based on the user's geographical location to ensure global accessibility.
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
  TIER_1: 1.0,  // 100% of base price (US, UK, EU, AU, CA)
  TIER_2: 0.7,  // 70% of base price (Eastern Europe, parts of South America)
  TIER_3: 0.5,  // 50% of base price (Brazil, Mexico, South Africa)
  TIER_4: 0.3,  // 30% of base price (India, Nigeria, Kenya, Philippines)
};

// A small sample map. In production, this would be a comprehensive list
// or fetched from a dedicated PPP API/Service.
export const COUNTRY_MAP: Record<string, CountryPPP> = {
  'US': { code: 'US', tier: 'TIER_1', currency: 'USD', symbol: '$' },
  'GB': { code: 'GB', tier: 'TIER_1', currency: 'GBP', symbol: '£' },
  'BR': { code: 'BR', tier: 'TIER_3', currency: 'BRL', symbol: 'R$' },
  'ZA': { code: 'ZA', tier: 'TIER_3', currency: 'ZAR', symbol: 'R' },
  'IN': { code: 'IN', tier: 'TIER_4', currency: 'INR', symbol: '₹' },
  'NG': { code: 'NG', tier: 'TIER_4', currency: 'NGN', symbol: '₦' },
  'KE': { code: 'KE', tier: 'TIER_4', currency: 'KES', symbol: 'KSh' },
  'PH': { code: 'PH', tier: 'TIER_4', currency: 'PHP', symbol: '₱' },
};

/**
 * Calculates the localized price based on the user's country code.
 * 
 * @param basePriceInUSD The standard US price
 * @param countryCode The 2-letter ISO country code (e.g., 'US', 'NG')
 * @returns The adjusted price and currency info
 */
export function getLocalizedPrice(basePriceInUSD: number, countryCode: string = 'US') {
  const countryInfo = COUNTRY_MAP[countryCode] || COUNTRY_MAP['US'];
  const multiplier = PPP_MULTIPLIERS[countryInfo.tier];
  
  // Calculate the raw discounted price
  const rawPrice = basePriceInUSD * multiplier;
  
  // In a real app, you would also convert the USD value to the local currency
  // using a live exchange rate API here. For now, we just apply the PPP discount
  // to the USD value to show the concept.
  
  return {
    originalPriceUSD: basePriceInUSD,
    discountedPriceUSD: Number(rawPrice.toFixed(2)),
    multiplier,
    tier: countryInfo.tier,
    suggestedCurrency: countryInfo.currency,
    currencySymbol: countryInfo.symbol
  };
}
