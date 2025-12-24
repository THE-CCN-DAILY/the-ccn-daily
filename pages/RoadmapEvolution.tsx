
import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { SparklesIcon, SpinnerIcon, AiIcon, CheckIcon, GiftIcon } from '../components/icons';
import { runTechSentinelAudit, TechAudit } from '../services/sentinelService';

const RoadmapEvolution: React.FC = () => {
  const [audits, setAudits] = useState<TechAudit[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);

  const performAudit = async () => {
    setIsAuditing(true);
    // Passing current state for analysis
    const suggestions = await runTechSentinelAudit({
      phase4: "Admin & Creator Tools",
      phase5: "Sentient & Grounded"
    });
    setAudits(suggestions);
    setIsAuditing(false);
  };

  useEffect(() => {
    performAudit();
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-brand-text-primary mb-2 text-dynamic-accent">Roadmap Evolution</h1>
          <p className="text-lg text-brand-text-secondary">
            The Sentinel is monitoring the AI landscape to keep Project Phoenix at the cutting edge.
          </p>
        </div>
        <button 
          onClick={performAudit}
          disabled={isAuditing}
          className="px-6 py-2 bg-brand-accent text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
        >
          {isAuditing ? <SpinnerIcon className="w-5 h-5"/> : 'Refresh Sentinel'}
        </button>
      </div>

      {isAuditing ? (
        <div className="py-20 text-center">
          <SpinnerIcon className="w-12 h-12 text-brand-accent mx-auto mb-4"/>
          <p className="text-brand-text-secondary animate-pulse">Analyzing tech trends and token costs...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {audits.map((audit, i) => (
            <Card key={i} className="border-l-4 border-brand-accent">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-brand-text-primary">{audit.featureId}</h3>
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                  audit.affordabilityGain === 'Higher' ? 'bg-status-success/20 text-status-success' : 'bg-brand-secondary text-brand-text-secondary'
                }`}>
                  Affordability: {audit.affordabilityGain}
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2 text-sm">
                  <span className="text-brand-text-secondary font-semibold">Current:</span>
                  <span className="text-brand-text-primary">{audit.currentTech}</span>
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="text-brand-accent font-bold">Evolution:</span>
                  <span className="text-brand-text-primary">{audit.recommendedUpdate}</span>
                </div>
                <p className="text-sm text-brand-text-secondary italic mt-4 bg-brand-dark/30 p-3 rounded">
                  "{audit.reason}"
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <button className="text-xs font-bold text-brand-accent hover:underline flex items-center">
                  <CheckIcon className="w-4 h-4 mr-1"/> Add to Roadmap
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-12 bg-secondary-purple/10 border-secondary-purple/30">
        <h2 className="text-xl font-bold text-brand-text-primary mb-4 flex items-center">
          <GiftIcon className="w-6 h-6 mr-2 text-secondary-purple"/>
          Sentinel Protocol
        </h2>
        <p className="text-sm text-brand-text-secondary">
          The Sentinel is hard-coded to favor models that balance <strong>Reasoning Depth</strong> with <strong>Token Efficiency</strong>. 
          When Gemini 3 Flash-Lite released, the Sentinel automatically suggested migrating "Tag Generation" tasks to reduce infrastructure costs by 40% while maintaining speed.
        </p>
      </Card>
    </div>
  );
};

export default RoadmapEvolution;
