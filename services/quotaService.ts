import { TIER_CONFIGS, SubscriptionTier } from '../types/pricing';

type QuotaKey = keyof (typeof TIER_CONFIGS)['free']['features']['quotas'];

export function canConsumeQuota(
  tier: SubscriptionTier,
  key: QuotaKey,
  used: number
): { allowed: boolean; mode: 'hard' | 'soft'; limit: number } {
  const quota = TIER_CONFIGS[tier].features.quotas[key];
  if (quota.limit === -1) return { allowed: true, mode: quota.mode, limit: quota.limit };
  return { allowed: used < quota.limit, mode: quota.mode, limit: quota.limit };
}
