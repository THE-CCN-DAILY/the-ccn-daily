import React from 'react';
import type { PricingRecommendation } from '../../services/pricingOptimizer';

interface Props {
  mrrEstimate: number;
  arpu: number;
  churnPct: number;
  grossMarginPct: number;
  recommendations: PricingRecommendation[];
}

const GrowthDashboard: React.FC<Props> = ({
  mrrEstimate,
  arpu,
  churnPct,
  grossMarginPct,
  recommendations,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric title="MRR (Est.)" value={`$${mrrEstimate.toLocaleString()}`} />
        <Metric title="ARPU" value={`$${arpu.toFixed(2)}`} />
        <Metric title="Churn" value={`${churnPct.toFixed(1)}%`} />
        <Metric title="Gross Margin" value={`${grossMarginPct.toFixed(1)}%`} />
      </div>

      <div className="p-4 rounded-xl border border-brand-border bg-brand-secondary/30">
        <h3 className="text-lg font-bold text-brand-text-primary mb-3">Optimizer Recommendations</h3>
        <ul className="space-y-2">
          {recommendations.map(r => (
            <li key={r.id} className="text-sm text-brand-text-secondary">
              <strong className="text-brand-text-primary">[{r.severity.toUpperCase()}]</strong> {r.message} — {r.action}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const Metric: React.FC<{ title: string; value: string }> = ({ title, value }) => (
  <div className="p-4 rounded-xl border border-brand-border bg-brand-secondary/30">
    <p className="text-xs text-brand-text-secondary uppercase tracking-wider">{title}</p>
    <p className="text-2xl font-bold text-brand-text-primary mt-1">{value}</p>
  </div>
);

export default GrowthDashboard;
