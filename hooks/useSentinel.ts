
import { useEffect, useState } from 'react';
import { runTechSentinelAudit, TechAudit } from '../services/sentinelService';
import { useAuth } from '../contexts/AuthContext';

export const useSentinel = () => {
  const { user } = useAuth();
  // The Sentinel audit calls the admin-only /api/ai/generate endpoint. Running it for
  // anonymous or non-privileged visitors produces 401s and console noise on every public
  // page load, so it must only run for a signed-in admin / lead developer.
  const isPrivileged = user?.role === 'admin' || user?.role === 'lead_developer';
  const [alerts, setAlerts] = useState<TechAudit[]>([]);

  useEffect(() => {
    if (!isPrivileged) {
      setAlerts([]);
      return;
    }

    const check = async () => {
      const results = await runTechSentinelAudit({
        currentPhase: 5,
        target: "Grounding and Sentience"
      });
      if (results.length > 0) {
        setAlerts(results);
      }
    };

    check();
    const interval = setInterval(check, 600000); // Check every 10 minutes
    return () => clearInterval(interval);
  }, [isPrivileged]);

  return alerts;
};
