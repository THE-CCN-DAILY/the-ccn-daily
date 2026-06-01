import { useAuth } from '../contexts/AuthContext';
import { useUpgradeModal } from '../contexts/UpgradeModalContext';

/**
 * Interim premium paywall.
 *
 * The full entitlement/purchase loop (Flutterwave intent + webhook, purchase &
 * entitlement Firestore writes, real access fetchers) is not built yet, so until
 * it is, premium content is **locked for everyone except admins**. Admins
 * (ministry allowlist) keep access for testing/authoring.
 *
 * When the purchase flow lands, replace `canAccess` with a real check against
 * `useEffectiveAccess` (subscription/entitlement/purchase) and keep the admin
 * bypass.
 */
export function usePremiumGate() {
  const { user } = useAuth();
  const { openUpgradeModal } = useUpgradeModal();

  const isAdmin = user?.role === 'admin';

  /** True when the user may open/play this item. */
  const canAccess = (isPremium?: boolean): boolean => !isPremium || isAdmin;

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
