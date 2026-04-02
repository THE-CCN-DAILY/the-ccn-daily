import React from 'react';
import type { Resource } from '../../types/entitlements';
import { useEffectiveAccess } from '../../hooks/useEffectiveAccess';
import { trackAnalyticsEvent, nowIso } from '../../services/analyticsService';
import { useAuth } from '../../contexts/AuthContext';

type UserLike = { uid: string } | null;

interface Props {
  resource: Resource;
  user: UserLike;
  onOpen: () => void;
  onPurchase: () => void;
  onUpgrade: () => void;
  onSignIn: () => void;
}

const ResourceAccessCTA: React.FC<Props> = ({
  resource,
  user,
  onOpen,
  onPurchase,
  onUpgrade,
  onSignIn,
}) => {
  const { user: authUser } = useAuth();
  const { loading, ctaPrimary, ctaSecondary, reason } = useEffectiveAccess(user, resource);

  const runAction = (label: string) => {
    if (label === 'Open') {
      return onOpen();
    }
    if (label === 'Buy Once') {
      trackAnalyticsEvent({
        name: 'upgrade_cta_clicked',
        userId: user?.uid,
        tier: (authUser?.tier as any) || 'free',
        timestamp: nowIso(),
        meta: { resourceId: resource.id, action: 'buy_once' },
      });
      return onPurchase();
    }
    if (label === 'Upgrade Plan') {
      trackAnalyticsEvent({
        name: 'upgrade_cta_clicked',
        userId: user?.uid,
        tier: (authUser?.tier as any) || 'free',
        timestamp: nowIso(),
        meta: { resourceId: resource.id, action: 'upgrade_plan', reason },
      });
      return onUpgrade();
    }
    if (label === 'Sign In') return onSignIn();
  };

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={loading}
        onClick={() => runAction(ctaPrimary)}
        className="px-4 py-2 rounded-lg bg-brand-accent text-white font-semibold disabled:opacity-60 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        {loading ? 'Checking access...' : ctaPrimary}
      </button>

      {ctaSecondary && !loading && (
        <button
          onClick={() => runAction(ctaSecondary)}
          className="px-4 py-2 rounded-lg border border-brand-border text-brand-text-secondary hover:text-brand-text-primary transition-all"
        >
          {ctaSecondary}
        </button>
      )}
    </div>
  );
};

export default ResourceAccessCTA;
