export interface ReleaseGuardrails {
  paymentSuccessRateMin: number; // e.g., 0.97
  entitlementErrorRateMax: number; // e.g., 0.02
  appErrorRateMax: number; // e.g., 0.02
  churnSpikePctMax: number; // e.g., 0.25 (25% WoW increase)
  aiCostSpikePctMax: number; // e.g., 0.30 (30% over baseline)
  grossMarginMinByTier: {
    free: number;
    pro: number;
    max: number;
  };
}

export const DEFAULT_GUARDRAILS: ReleaseGuardrails = {
  paymentSuccessRateMin: 0.97,
  entitlementErrorRateMax: 0.02,
  appErrorRateMax: 0.02,
  churnSpikePctMax: 0.25,
  aiCostSpikePctMax: 0.30,
  grossMarginMinByTier: {
    free: 0,
    pro: 0.60,
    max: 0.55,
  },
};
