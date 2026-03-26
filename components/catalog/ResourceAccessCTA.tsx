import React from 'react';
import type { Resource } from '../../types/entitlements';
import { useEffectiveAccess } from '../../hooks/useEffectiveAccess';

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
  const { loading, ctaPrimary, ctaSecondary } = useEffectiveAccess(user, resource);

  const runAction = (label: string) => {
    if (label === 'Open') return onOpen();
    if (label === 'Buy Once') return onPurchase();
    if (label === 'Upgrade Plan') return onUpgrade();
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
