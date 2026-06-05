import { DEFAULT_GUARDRAILS } from '../config/releaseGuardrails';

export interface CurrentMetrics {
  paymentSuccessRate: number;
  entitlementErrorRate: number;
  appErrorRate: number;
  churnDeltaPct: number; // +0.30 means 30% worse vs baseline
  aiCostDeltaPct: number; // +0.40 means 40% above baseline
  grossMarginByTier: { free: number; pro: number; max: number };
}

export interface RollbackDecision {
  shouldRollback: boolean;
  severity: 'info' | 'warning' | 'critical';
  reasons: string[];
  recommendedAction: 'continue' | 'pause' | 'rollback';
}

export function evaluateRollback(metrics: CurrentMetrics): RollbackDecision {
  const g = DEFAULT_GUARDRAILS;
  const reasons: string[] = [];

  if (metrics.paymentSuccessRate < g.paymentSuccessRateMin) {
    reasons.push(`Payment success ${metrics.paymentSuccessRate.toFixed(3)} < ${g.paymentSuccessRateMin}`);
  }
  if (metrics.entitlementErrorRate > g.entitlementErrorRateMax) {
    reasons.push(`Entitlement errors ${metrics.entitlementErrorRate.toFixed(3)} > ${g.entitlementErrorRateMax}`);
  }
  if (metrics.appErrorRate > g.appErrorRateMax) {
    reasons.push(`App error rate ${metrics.appErrorRate.toFixed(3)} > ${g.appErrorRateMax}`);
  }
  if (metrics.churnDeltaPct > g.churnSpikePctMax) {
    reasons.push(`Churn spike ${(metrics.churnDeltaPct * 100).toFixed(1)}% > ${(g.churnSpikePctMax * 100).toFixed(1)}%`);
  }
  if (metrics.aiCostDeltaPct > g.aiCostSpikePctMax) {
    reasons.push(`Background-service cost spike ${(metrics.aiCostDeltaPct * 100).toFixed(1)}% > ${(g.aiCostSpikePctMax * 100).toFixed(1)}%`);
  }
  if (metrics.grossMarginByTier.pro < g.grossMarginMinByTier.pro) {
    reasons.push(`Pro gross margin ${metrics.grossMarginByTier.pro.toFixed(2)} < ${g.grossMarginMinByTier.pro}`);
  }
  if (metrics.grossMarginByTier.max < g.grossMarginMinByTier.max) {
    reasons.push(`Max gross margin ${metrics.grossMarginByTier.max.toFixed(2)} < ${g.grossMarginMinByTier.max}`);
  }

  if (reasons.length === 0) {
    return { shouldRollback: false, severity: 'info', reasons: [], recommendedAction: 'continue' };
  }

  const critical = reasons.some(r =>
    r.startsWith('Payment success') || r.startsWith('Entitlement errors') || r.startsWith('App error rate')
  );

  return {
    shouldRollback: true,
    severity: critical ? 'critical' : 'warning',
    reasons,
    recommendedAction: critical ? 'rollback' : 'pause',
  };
}
