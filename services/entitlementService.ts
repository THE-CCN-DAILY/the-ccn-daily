import type { Resource, UserEntitlement, UserPurchase } from '../types/entitlements';

export interface UserSubscription {
  tier: 'guest' | 'free' | 'pro' | 'max';
  status: 'active' | 'expired' | 'canceled' | 'none';
  endsAt?: string | null;
}

export interface EffectiveAccess {
  canOpen: boolean;
  reason:
    | 'owned_perpetual'
    | 'subscription_included'
    | 'trial_limited'
    | 'upgrade_required'
    | 'purchase_required'
    | 'auth_required';
}

export function resolveAccess(params: {
  userId?: string | null;
  resource: Resource;
  subscription: UserSubscription;
  entitlements: UserEntitlement[];
  purchases: UserPurchase[];
}): EffectiveAccess {
  const { userId, resource, subscription, entitlements, purchases } = params;

  if (!userId) return { canOpen: false, reason: 'auth_required' };

  const hasOwnedPurchase = purchases.some(
    p => p.resourceId === resource.id && p.status === 'active'
  );
  if (hasOwnedPurchase) return { canOpen: true, reason: 'owned_perpetual' };

  const now = Date.now();
  const hasActiveEntitlement = entitlements.some(e => {
    if (!e.isActive || e.resourceId !== resource.id) return false;
    if (!e.endsAt) return true;
    return new Date(e.endsAt).getTime() > now;
  });

  if (hasActiveEntitlement) {
    const ent = entitlements.find(e => e.resourceId === resource.id && e.isActive)!;
    return { canOpen: true, reason: ent.accessType };
  }

  if (resource.accessLane === 'included' || resource.accessLane === 'hybrid') {
    if (subscription.status === 'active' && (subscription.tier === 'pro' || subscription.tier === 'max')) {
      return { canOpen: true, reason: 'subscription_included' };
    }
  }

  if (resource.accessLane === 'owned' || resource.accessLane === 'hybrid') {
    return { canOpen: false, reason: 'purchase_required' };
  }

  return { canOpen: false, reason: 'upgrade_required' };
}
