export interface TierMetrics {
  tier: 'free' | 'pro' | 'max';
  subscribers: number;
  conversionRate: number; // 0-1
  churnRate: number; // 0-1
  avgRevenuePerUser: number; // monthly
  aiCogsPerUser: number; // monthly
}

export interface PricingRecommendation {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  action: string;
}

export function estimateGrossMarginPct(arpu: number, cogs: number): number {
  if (arpu <= 0) return 0;
  return ((arpu - cogs) / arpu) * 100;
}

export function generatePricingRecommendations(metrics: TierMetrics[]): PricingRecommendation[] {
  const recs: PricingRecommendation[] = [];

  for (const m of metrics) {
    const gm = estimateGrossMarginPct(m.avgRevenuePerUser, m.aiCogsPerUser);

    if (gm < 60) {
      recs.push({
        id: `gm_low_${m.tier}`,
        severity: 'critical',
        message: `${m.tier.toUpperCase()} margin is low (${gm.toFixed(1)}%).`,
        action: 'Reduce expensive quota or raise price / annual mix.',
      });
    } else if (gm < 75) {
      recs.push({
        id: `gm_warn_${m.tier}`,
        severity: 'warning',
        message: `${m.tier.toUpperCase()} margin is moderate (${gm.toFixed(1)}%).`,
        action: 'Tune background-service limits or increase annual plan adoption.',
      });
    }

    if (m.churnRate > 0.08) {
      recs.push({
        id: `churn_${m.tier}`,
        severity: 'warning',
        message: `${m.tier.toUpperCase()} churn is elevated (${(m.churnRate * 100).toFixed(1)}%).`,
        action: 'Improve onboarding, habit loops, and cancellation rescue offers.',
      });
    }

    if (m.conversionRate < 0.02 && m.tier === 'free') {
      recs.push({
        id: `conv_low_free`,
        severity: 'info',
        message: `Free-to-paid conversion is low (${(m.conversionRate * 100).toFixed(1)}%).`,
        action: 'Test paywall layout and annual-first defaults.',
      });
    }
  }

  return recs;
}
