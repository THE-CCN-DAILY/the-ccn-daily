import React, { useEffect } from 'react';
import { buildCancelPreview } from '../../services/cancelPreviewService';
import type { UserEntitlement, UserPurchase } from '../../types/entitlements';
import { trackAnalyticsEvent, nowIso } from '../../services/analyticsService';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  purchases: UserPurchase[];
  entitlements: UserEntitlement[];
  onConfirmCancel: () => void;
  onKeepPlan: () => void;
}

const CancellationPreview: React.FC<Props> = ({
  purchases,
  entitlements,
  onConfirmCancel,
  onKeepPlan,
}) => {
  const { user } = useAuth();
  const preview = buildCancelPreview({ purchases, entitlements });

  useEffect(() => {
    trackAnalyticsEvent({
      name: 'cancellation_preview_viewed',
      userId: user?.uid,
      tier: (user?.tier as any) || 'free',
      route: '/account/cancel-preview',
      timestamp: nowIso(),
    });
  }, [user]);

  const handleConfirmCancel = () => {
    trackAnalyticsEvent({
      name: 'cancellation_completed',
      userId: user?.uid,
      tier: (user?.tier as any) || 'free',
      route: '/account/cancel-preview',
      timestamp: nowIso(),
    });
    onConfirmCancel();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 bg-brand-secondary/20 p-8 rounded-2xl border border-brand-border">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-brand-text-primary">Wait, before you go...</h2>
        <p className="text-brand-text-secondary">We want to make sure you know exactly what happens to your access.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-green-500/30 bg-green-500/5">
          <h3 className="font-bold text-green-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            You keep forever
          </h3>
          <ul className="list-disc pl-5 text-sm text-brand-text-primary space-y-1">
            {preview.keepForeverResourceIds.length
              ? preview.keepForeverResourceIds.map(id => <li key={id}>{id}</li>)
              : <li className="text-brand-text-secondary italic list-none ml-[-1.25rem]">No owned resources yet</li>}
          </ul>
        </div>

        <div className="p-6 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
          <h3 className="font-bold text-yellow-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            Ends when your plan ends
          </h3>
          <ul className="list-disc pl-5 text-sm text-brand-text-primary space-y-1">
            {preview.loseAtPeriodEndResourceIds.length
              ? preview.loseAtPeriodEndResourceIds.map(id => <li key={id}>{id}</li>)
              : <li className="text-brand-text-secondary italic list-none ml-[-1.25rem]">No subscription-only resources currently active</li>}
          </ul>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-brand-accent/5 border border-brand-accent/20">
        <h4 className="font-bold text-brand-accent mb-2 uppercase text-xs tracking-widest">Feature limits after downgrade</h4>
        <p className="text-sm text-brand-text-secondary leading-relaxed">
          Your Coach will revert to basic guidance, and daily message limits will apply.
          You'll also lose access to premium audio narration, courses, reading plans, and challenge archives.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button 
          onClick={onKeepPlan} 
          className="flex-1 px-6 py-3 rounded-xl bg-brand-accent text-white font-bold hover:scale-[1.02] transition-transform"
        >
          Keep my plan
        </button>
        <button 
          onClick={handleConfirmCancel} 
          className="flex-1 px-6 py-3 rounded-xl border border-brand-border text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-secondary/40 transition-all"
        >
          Confirm cancellation
        </button>
      </div>
    </div>
  );
};

export default CancellationPreview;
