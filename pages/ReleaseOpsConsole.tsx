import React from 'react';
import ReleaseHealthPanel from '../components/admin/ReleaseHealthPanel';

const ReleaseOpsConsole: React.FC = () => {
  // TODO: fetch from releaseController endpoints
  const demo = [
    { featureKey: 'entitlement_v2', stage: 20, status: 'running' as const, reasons: [] },
    { featureKey: 'paywall_layout_v1', stage: 50, status: 'paused' as const, reasons: ['Churn spike 28% > 25%'] },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-6">
      <h1 className="text-4xl font-bold text-brand-text-primary">Release Ops Console</h1>
      <p className="text-brand-text-secondary">
        Rollout health, guardrail triggers, and rollback control center.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {demo.map(item => (
          <ReleaseHealthPanel
            key={item.featureKey}
            featureKey={item.featureKey}
            stage={item.stage}
            status={item.status}
            reasons={item.reasons}
          />
        ))}
      </div>
    </div>
  );
};

export default ReleaseOpsConsole;
