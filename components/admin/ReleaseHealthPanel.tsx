import React from 'react';

interface Props {
  featureKey: string;
  stage: number;
  status: 'running' | 'paused' | 'rolled_back' | 'completed';
  reasons?: string[];
}

const statusTone: Record<Props['status'], string> = {
  running: 'text-green-300',
  paused: 'text-yellow-300',
  rolled_back: 'text-red-300',
  completed: 'text-blue-300',
};

const ReleaseHealthPanel: React.FC<Props> = ({ featureKey, stage, status, reasons = [] }) => (
  <div className="p-4 rounded-xl border border-brand-border bg-brand-secondary/30">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-bold text-brand-text-primary">{featureKey}</h3>
      <span className={`text-sm font-bold uppercase ${statusTone[status]}`}>{status}</span>
    </div>
    <p className="text-sm text-brand-text-secondary mt-2">Rollout stage: {stage}%</p>
    {reasons.length > 0 && (
      <ul className="mt-3 list-disc pl-5 text-xs text-brand-text-secondary">
        {reasons.map((r, i) => <li key={i}>{r}</li>)}
      </ul>
    )}
  </div>
);

export default ReleaseHealthPanel;
