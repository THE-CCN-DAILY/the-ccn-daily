import React, { useEffect, useState } from 'react';
import { adminAuthHeaders } from '../services/adminAuth';
import { getTierLabel, SubscriptionTier } from '../types/pricing';
import { SpinnerIcon } from '../components/icons';

interface GrowthSummary {
  totalMembers: number;
  activeSubscribers: number;
  tierBreakdown: { tier: string; count: number }[];
  revenue30d: number;
  revenueCount30d: number;
  giving30d: number;
  givingCount30d: number;
}

const GrowthConsole: React.FC = () => {
  const [summary, setSummary] = useState<GrowthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/admin/growth/summary', {
          headers: await adminAuthHeaders(),
        });
        if (!response.ok) throw new Error(`Growth summary failed (${response.status})`);
        const data = await response.json();
        if (!cancelled) setSummary(data);
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Growth data could not be loaded.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Growth Console</h1>
      <p className="text-brand-text-secondary mb-8">
        Live stewardship signals for THE CCN DAILY — read directly from verified payments and memberships.
      </p>

      {loading && (
        <div className="p-10 text-center">
          <SpinnerIcon className="w-8 h-8 mx-auto animate-spin text-brand-accent" />
        </div>
      )}

      {!loading && loadError && (
        <p className="text-sm text-status-error">{loadError}</p>
      )}

      {!loading && !loadError && summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Metric title="Members" value={summary.totalMembers.toLocaleString()} />
            <Metric title="Active Subscribers" value={summary.activeSubscribers.toLocaleString()} />
            <Metric
              title="Revenue (30d, verified)"
              value={`$${summary.revenue30d.toLocaleString()}`}
              hint={`${summary.revenueCount30d} payment${summary.revenueCount30d === 1 ? '' : 's'}`}
            />
            <Metric
              title="Giving (30d, verified)"
              value={`$${summary.giving30d.toLocaleString()}`}
              hint={`${summary.givingCount30d} gift${summary.givingCount30d === 1 ? '' : 's'}`}
            />
          </div>

          <div className="p-4 rounded-xl border border-brand-border bg-brand-secondary/30">
            <h3 className="text-lg font-bold text-brand-text-primary mb-3">Plan Mix</h3>
            {summary.tierBreakdown.length === 0 ? (
              <p className="text-sm text-brand-text-secondary">
                No paid memberships yet. As members subscribe, the plan mix appears here from live data.
              </p>
            ) : (
              <ul className="space-y-2">
                {summary.tierBreakdown.map((row) => (
                  <li key={row.tier} className="flex justify-between text-sm">
                    <span className="text-brand-text-primary font-semibold">
                      {getTierLabel(row.tier as SubscriptionTier)}
                    </span>
                    <span className="text-brand-text-secondary">
                      {row.count} member{row.count === 1 ? '' : 's'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-4 rounded-xl border border-brand-border bg-brand-secondary/30">
            <h3 className="text-lg font-bold text-brand-text-primary mb-3">Reading These Numbers</h3>
            <p className="text-sm text-brand-text-secondary">
              Revenue and giving count only webhook-verified payments from the last 30 days. Churn, margin,
              and pricing recommendations will join this console once there is enough payment history to
              compute them honestly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const Metric: React.FC<{ title: string; value: string; hint?: string }> = ({ title, value, hint }) => (
  <div className="p-4 rounded-xl border border-brand-border bg-brand-secondary/30">
    <p className="text-xs text-brand-text-secondary uppercase tracking-wider">{title}</p>
    <p className="text-2xl font-bold text-brand-text-primary mt-1">{value}</p>
    {hint && <p className="text-xs text-brand-text-secondary mt-0.5">{hint}</p>}
  </div>
);

export default GrowthConsole;
