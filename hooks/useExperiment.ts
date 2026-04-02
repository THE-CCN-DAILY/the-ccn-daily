import { useMemo } from 'react';
import { assignVariant } from '../services/experimentService';

export function useExperiment(userId: string | undefined, experimentKey: string) {
  return useMemo(() => {
    if (!userId) return 'A';
    return assignVariant(userId, experimentKey);
  }, [userId, experimentKey]);
}
