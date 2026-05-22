import React from 'react';
import type { Resource } from '../../types/entitlements';
import { getAccessBadge } from '../../utils/accessBadge';

const toneClasses: Record<'info' | 'success' | 'accent', string> = {
  info: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  success: 'bg-green-500/15 text-green-300 border-green-500/30',
  accent: 'bg-brand-accent/15 text-brand-accent border-brand-accent/30',
};

const AccessLaneBadge: React.FC<{ resource: Resource }> = ({ resource }) => {
  const badge = getAccessBadge(resource);

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-[12px] font-bold uppercase tracking-wide border ${toneClasses[badge.tone]}`}
    >
      {badge.label}
    </span>
  );
};

export default AccessLaneBadge;
