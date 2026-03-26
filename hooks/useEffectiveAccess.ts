import { useEffect, useMemo, useState } from 'react';
import type { Resource, UserEntitlement, UserPurchase } from '../types/entitlements';
import { resolveAccess, type UserSubscription } from '../services/entitlementService';

type UserLike = { uid: string } | null;

type EffectiveAccessHookResult = {
  loading: boolean;
  canOpen: boolean;
  reason:
    | 'owned_perpetual'
    | 'subscription_included'
    | 'trial_limited'
    | 'upgrade_required'
    | 'purchase_required'
    | 'auth_required';
  ctaPrimary: 'Open' | 'Sign In' | 'Buy Once' | 'Upgrade Plan';
  ctaSecondary?: 'Buy Once' | 'Upgrade Plan';
};

async function fetchSubscription(_userId: string): Promise<UserSubscription> {
  // TODO: replace with real fetch from Firestore
  return { tier: 'free', status: 'active' };
}

async function fetchEntitlements(_userId: string): Promise<UserEntitlement[]> {
  // TODO: replace with real fetch from Firestore
  return [];
}

async function fetchPurchases(_userId: string): Promise<UserPurchase[]> {
  // TODO: replace with real fetch from Firestore
  return [];
}

export function useEffectiveAccess(user: UserLike, resource: Resource): EffectiveAccessHookResult {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<UserSubscription>({ tier: 'guest', status: 'none' });
  const [entitlements, setEntitlements] = useState<UserEntitlement[]>([]);
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.uid) {
        if (!mounted) return;
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [s, e, p] = await Promise.all([
          fetchSubscription(user.uid),
          fetchEntitlements(user.uid),
          fetchPurchases(user.uid),
        ]);

        if (!mounted) return;
        setSubscription(s);
        setEntitlements(e);
        setPurchases(p);
      } catch (error) {
        console.error("Failed to fetch access data", error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user?.uid, resource.id]);

  const access = useMemo(() => {
    return resolveAccess({
      userId: user?.uid,
      resource,
      subscription,
      entitlements,
      purchases,
    });
  }, [user?.uid, resource, subscription, entitlements, purchases]);

  const cta = useMemo(() => {
    if (access.canOpen) return { ctaPrimary: 'Open' as const };
    switch (access.reason) {
      case 'auth_required':
        return { ctaPrimary: 'Sign In' as const };
      case 'purchase_required':
        return { ctaPrimary: 'Buy Once' as const, ctaSecondary: 'Upgrade Plan' as const };
      case 'upgrade_required':
        return { ctaPrimary: 'Upgrade Plan' as const, ctaSecondary: 'Buy Once' as const };
      default:
        return { ctaPrimary: 'Upgrade Plan' as const };
    }
  }, [access]);

  return {
    loading,
    canOpen: access.canOpen,
    reason: access.reason,
    ctaPrimary: cta.ctaPrimary,
    ctaSecondary: cta.ctaSecondary,
  };
}
