
import { useEffect, useState } from 'react';
import { runTechSentinelAudit, TechAudit } from '../services/sentinelService';

export const useSentinel = () => {
  const [alerts, setAlerts] = useState<TechAudit[]>([]);

  useEffect(() => {
    const check = async () => {
      console.log("Sentinel Monitoring AI Landscape...");
      const results = await runTechSentinelAudit({
        currentPhase: 5,
        target: "Grounding and Sentience"
      });
      if (results.length > 0) {
        console.log("Sentinel found optimizations:", results);
        setAlerts(results);
      }
    };

    check();
    const interval = setInterval(check, 600000); // Check every 10 minutes
    return () => clearInterval(interval);
  }, []);

  return alerts;
};
