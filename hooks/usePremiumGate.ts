import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUpgradeModal } from '../contexts/UpgradeModalContext';
import { getUserSubscription } from '../services/purchaseService';

/**
 * Premium paywall — server-authoritative.
 *
 * Access is resolved from the user's real subscription, read back from D1 (written
 * only by the verified Flutterwave webhook). A non-admin unlocks premium content when
 * they hold an ACTIVE paid subscription (Growth/Family/Leader). Admins (ministry
 * allowlist) keep an unconditional bypass for testing/authoring.
 *
 * The subscription is fetched once per signed-in non-admin. Until it resolves, premium
 * content stays locked (fail-closed) — the client never grants access optimistically.
 */
const ACTIVE_PAID_TIERS = new Set(['pro', 'max', 'partner']);

export function usePremiumGate() {
  const { user } = useAuth();
  const { openUpgradeModal } = useUpgradeModal();

  const isAdmin = user?.role === 'admin';

  const [hasActivePaid, setHasActivePaid] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Admins bypass; guests/unauthenticated never have a paid subscription.
    if (!user?.uid || isAdmin) {
      setHasActivePaid(false);
      return;
    }

    (async () => {
      try {
        const sub = await getUserSubscription(user.uid);
        if (!mounted) return;
        setHasActivePaid(sub.status === 'active' && ACTIVE_PAID_TIERS.has(sub.tier));
      } catch {
        // Readback unavailable — fail closed (locked).
        if (mounted) setHasActivePaid(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user?.uid, isAdmin]);

  /** True when the user may open/play this item. */
  const canAccess = (isPremium?: boolean): boolean => !isPremium || isAdmin || hasActivePaid;

  /**
   * Gate an action. Returns true if access is granted; otherwise opens the
   * upgrade modal and returns false so the caller can abort.
   */
  const requireAccess = (isPremium: boolean | undefined, featureName: string): boolean => {
    if (canAccess(isPremium)) return true;
    openUpgradeModal(featureName, 'pro');
    return false;
  };

  return { isAdmin, canAccess, requireAccess };
}
