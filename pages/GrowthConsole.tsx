import React from 'react';
import GrowthDashboard from '../components/admin/GrowthDashboard';

const GrowthConsole: React.FC = () => {
  // Sample data until analytics service is connected.
  return (
    <div className="max-w-6xl mx-auto pb-20">
      <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Growth Console</h1>
      <p className="text-brand-text-secondary mb-8">
        Monetization, retention, and margin intelligence for THE CCN DAILY.
      </p>

      <GrowthDashboard
        mrrEstimate={18420}
        arpu={9.14}
        churnPct={6.2}
        grossMarginPct={73.5}
        recommendations={[
          {
            id: 'gm_warn_max',
            severity: 'warning',
            message: 'MAX plan background service cost is trending high.',
            action: 'Lower cinematic quota or introduce add-on credits.',
          },
          {
            id: 'conv_low_free',
            severity: 'info',
            message: 'Free-to-paid conversion under target.',
            action: 'Test annual-first paywall variant for 50% cohort.',
          },
        ]}
      />
    </div>
  );
};

export default GrowthConsole;
