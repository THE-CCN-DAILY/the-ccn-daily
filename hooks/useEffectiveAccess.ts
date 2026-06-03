import { useEffect, useMemo, useState } from 'react';
import type { Resource, UserEntitlement, UserPurchase } from '../types/entitlements';
import { resolveAccess, type UserSubscription } from '../services/entitlementService';
import { getUserSubscription } from '../services/purchaseService';

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
        // Source of truth: the server reads the subscription + active entitlements
        // back from D1 (written only by the verified Flutterwave webhook). One-time
        // perpetual purchases are not yet returned here, so purchases stays empty
        // until that readback lands.
        const readback = await getUserSubscription(user.uid);

        if (!mounted) return;
        setSubscription({
          tier: readback.tier,
          status: readback.status,
          endsAt: readback.endsAt,
        });
        setEntitlements(readback.entitlements);
        setPurchases([]);
      } catch {
        // Access data unavailable — component renders with defaults (locked)
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
