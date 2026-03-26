import React from 'react';
import type { UserEntitlement, UserPurchase } from '../../types/entitlements';

interface Props {
  purchases: UserPurchase[];
  entitlements: UserEntitlement[];
  onOpenResource: (resourceId: string) => void;
}

const MyAccessPanel: React.FC<Props> = ({ purchases, entitlements, onOpenResource }) => {
  const owned = purchases.filter(p => p.status === 'active');
  const included = entitlements.filter(e => e.isActive && e.accessType === 'subscription_included');
  const trial = entitlements.filter(e => e.isActive && e.accessType === 'trial_limited');

  const renderList = (ids: string[]) =>
    ids.length ? (
      <ul className="space-y-2">
        {ids.map(id => (
          <li key={id} className="flex items-center justify-between bg-brand-secondary/40 p-3 rounded-lg border border-brand-border/50">
            <span className="text-sm text-brand-text-primary font-medium">{id}</span>
            <button 
              className="text-xs text-brand-accent font-bold hover:underline" 
              onClick={() => onOpenResource(id)}
            >
              Open
            </button>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-brand-text-secondary italic">None yet.</p>
    );

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-bold text-brand-text-primary mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Owned Forever
        </h3>
        {renderList(owned.map(x => x.resourceId))}
      </section>

      <section>
        <h3 className="text-lg font-bold text-brand-text-primary mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Included by Subscription
        </h3>
        {renderList(included.map(x => x.resourceId))}
      </section>

      <section>
        <h3 className="text-lg font-bold text-brand-text-primary mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-accent"></span>
          Trial Access
        </h3>
        {renderList(trial.map(x => x.resourceId))}
      </section>
    </div>
  );
};

export default MyAccessPanel;
