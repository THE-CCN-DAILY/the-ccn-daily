import { generatePricingRecommendations, type TierMetrics } from '../services/pricingOptimizer';
import { evaluateRollback, type CurrentMetrics } from '../services/rollbackEvaluator';
import { setReleaseStatus, listReleases } from '../services/releaseController';
import { sendOpsAlert } from '../services/opsAlertService';

export async function runPricingInsightsJob() {
  // TODO: fetch from analytics warehouse/db
  const sample: TierMetrics[] = [
    { tier: 'free', subscribers: 0, conversionRate: 0.018, churnRate: 0, avgRevenuePerUser: 0, aiCogsPerUser: 0.4 },
    { tier: 'pro', subscribers: 1200, conversionRate: 0.12, churnRate: 0.06, avgRevenuePerUser: 8.7, aiCogsPerUser: 2.2 },
    { tier: 'max', subscribers: 260, conversionRate: 0.03, churnRate: 0.09, avgRevenuePerUser: 16.4, aiCogsPerUser: 7.8 },
  ];

  const recommendations = generatePricingRecommendations(sample);

  const result = {
    runAt: new Date().toISOString(),
    metrics: sample,
    recommendations,
  };

  // TODO: persist to db e.g. /growthInsights/daily/{date}
  console.log('[pricing-insights]', result);

  // Guardrail Evaluation Hook
  const currentMetrics: CurrentMetrics = {
    paymentSuccessRate: 0.98, // Mocked
    entitlementErrorRate: 0.005, // Mocked
    appErrorRate: 0.01, // Mocked
    churnDeltaPct: 0.05, // Mocked
    aiCostDeltaPct: 0.10, // Mocked
    grossMarginByTier: {
      free: -0.4,
      pro: (8.7 - 2.2) / 8.7,
      max: (16.4 - 7.8) / 16.4,
    },
  };

  const activeReleases = listReleases().filter(r => r.status === 'running');
  for (const release of activeReleases) {
    const decision = evaluateRollback(currentMetrics);
    if (decision.shouldRollback) {
      const action = decision.recommendedAction === 'rollback' ? 'rolled_back' : 'paused';
      setReleaseStatus(release.featureKey, action, decision.reasons.join(' | '));
      await sendOpsAlert({
        title: `Release ${action.toUpperCase()}: ${release.featureKey}`,
        severity: decision.severity,
        featureKey: release.featureKey,
        reasons: decision.reasons,
      });
    }
  }

  return result;
}
