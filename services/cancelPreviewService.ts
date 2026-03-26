import type { UserEntitlement, UserPurchase } from '../types/entitlements';

export function buildCancelPreview(params: {
  purchases: UserPurchase[];
  entitlements: UserEntitlement[];
}) {
  const keep = params.purchases
    .filter(p => p.status === 'active')
    .map(p => p.resourceId);

  const lose = params.entitlements
    .filter(e => e.isActive && e.accessType === 'subscription_included')
    .map(e => e.resourceId);

  return {
    keepForeverResourceIds: [...new Set(keep)],
    loseAtPeriodEndResourceIds: [...new Set(lose)],
  };
}
