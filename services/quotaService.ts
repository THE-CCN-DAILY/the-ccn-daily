import { TIER_CONFIGS, SubscriptionTier } from '../types/pricing';
import { trackAnalyticsEvent, nowIso } from './analyticsService';

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

export function trackQuotaEvent(
  userId: string | null | undefined,
  tier: SubscriptionTier,
  key: QuotaKey,
  used: number,
  limit: number,
  isBlocked: boolean
) {
  const name = isBlocked ? 'quota_blocked' : 'quota_warning_shown';
  trackAnalyticsEvent({
    name,
    userId,
    tier,
    timestamp: nowIso(),
    meta: { quotaKey: key, used, limit },
  });
}
