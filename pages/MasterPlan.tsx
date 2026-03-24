
import React from 'react';
import Card from '../components/Card';
import SentinelSuggestions from '../components/SentinelSuggestions';
import { useRoadmap } from '../contexts/RoadmapContext';
import type { PlanTask } from '../types';
import { CheckIcon } from '../components/icons';

const TaskItem: React.FC<{ task: PlanTask }> = ({ task }) => (
    <div className={`flex items-start space-x-4 p-4 rounded-lg h-full border ${task.status === 'Completed' ? 'bg-brand-secondary/30 border-status-success/30' : task.status === 'In Progress' ? 'bg-brand-accent/5 border-brand-accent/20' : 'bg-brand-secondary/50 border-brand-border'}`}>
        <div className="flex-shrink-0">
            <task.icon className={`h-8 w-8 ${task.status === 'Completed' ? 'text-status-success' : task.status === 'In Progress' ? 'text-brand-accent animate-pulse' : 'text-brand-text-secondary'}`}/>
        </div>
        <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-brand-text-primary text-sm">{task.title}</h4>
                {task.status === 'Completed' && <CheckIcon className="w-4 h-4 text-status-success" />}
            </div>
            <p className="text-xs text-brand-text-secondary">{task.description}</p>
        </div>
    </div>
);

const MasterPlan: React.FC = () => {
  const { phases } = useRoadmap();
  
  // Calculate overall progress
  const overallProgress = Math.floor(phases.reduce((acc, p) => acc + p.progress, 0) / phases.length);

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
            <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Architecting The Future</h1>
            <p className="text-lg text-brand-text-secondary">
                Synchronizing Phase 5-7 delivery.
            </p>
        </div>
        <div className="flex items-center gap-4 bg-brand-accent/10 p-4 rounded-xl border border-brand-accent/30">
            <div className="text-right">
                <p className="text-xs text-brand-text-secondary uppercase tracking-widest font-bold">Overall Progress</p>
                <p className="text-2xl font-black text-brand-accent">{overallProgress}%</p>
            </div>
            <div className="w-32 h-3 bg-brand-dark rounded-full overflow-hidden">
                <div className="h-full bg-brand-accent" style={{ width: `${overallProgress}%` }}></div>
            </div>
        </div>
      </div>

      <SentinelSuggestions />

      <div className="space-y-8">
        {phases.map((phase) => (
          <Card key={phase.id} className="relative overflow-hidden">
            <div className="absolute top-0 right-0 h-1 bg-brand-accent transition-all duration-1000" style={{ width: `${phase.progress}%` }}></div>
            <div className="border-b border-brand-border pb-4 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-brand-accent">{phase.title}</h2>
                    <p className="text-brand-text-secondary mt-1">{phase.description}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brand-text-secondary">{phase.progress}%</span>
                    <div className="w-24 h-2 bg-brand-dark rounded-full">
                        <div className="h-full bg-brand-accent" style={{ width: `${phase.progress}%` }}></div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {phase.tasks.map(task => <TaskItem key={task.id} task={task} />)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MasterPlan;
