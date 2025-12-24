
import React from 'react';
import Card from '../components/Card';
import type { PlanPhase, PlanTask } from '../types';
import { UiIcon, DbIcon, ReaderIcon, AiIcon, CommunityIcon, GamificationIcon, AdminIcon, SpeakerWaveIcon, StepsIcon, CheckIcon, SparklesIcon, SoundWaveIcon, SearchIcon } from '../components/icons';

// FIX: Moved ClockIcon declaration above planData to prevent "used before declaration" error
const ClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const planData: PlanPhase[] = [
  {
    id: 'phase-0',
    title: 'Phase 0: Foundation & Vision Alignment',
    progress: 100,
    description: 'Laying the technical and aesthetic groundwork for all advanced features.',
    tasks: [
      { id: 't01', title: 'UI/UX Master Revision', description: 'Comprehensive premium feel revisions.', icon: UiIcon, status: 'Completed' },
      { id: 't02', title: 'Advanced Firestore Architecture', description: 'Scalable schema for Family/Church accounts.', icon: DbIcon, status: 'Completed' },
    ],
  },
  {
    id: 'phase-1',
    title: 'Phase 1: The Guided & Immersive Experience',
    progress: 100,
    description: 'Transforming content interaction into a guided, immersive journey.',
    tasks: [
      { id: 't11', title: 'Guided Daily Journey', description: 'Core step-by-step daily devotional flow.', icon: StepsIcon, status: 'Completed' },
      { id: 't12', title: 'Premium Reader & Journal', description: 'Kindle-like reader and rich-text journal.', icon: ReaderIcon, status: 'Completed' },
    ],
  },
  {
    id: 'phase-5',
    title: 'Phase 5: The Sentient & Grounded Experience',
    progress: 45,
    description: 'Leveraging the latest 2025 AI models for real-time, grounded, and multimodal spiritual wellness.',
    tasks: [
        { id: 't51', title: 'Gemini Live: Kai', description: 'Real-time spoken guidance during prayer.', icon: SoundWaveIcon, status: 'Completed' },
        { id: 't52', title: 'Grounded Intercession', description: 'Search-grounded global prayer suggestions.', icon: SearchIcon, status: 'Completed' },
        { id: 't55', title: 'The Sanctuary Timer', description: 'Animated, musical, and extendable prayer sessions.', icon: ClockIcon, status: 'Completed' },
        { id: 't56', title: 'Inline Study Snippets', description: 'Clickable scriptures within the journey flow.', icon: ReaderIcon, status: 'Completed' },
    ],
  },
];

const TaskItem: React.FC<{ task: PlanTask }> = ({ task }) => (
    <div className={`flex items-start space-x-4 p-4 rounded-lg h-full border ${task.status === 'Completed' ? 'bg-brand-secondary/30 border-status-success/30' : task.status === 'Planned' ? 'bg-brand-accent/5 border-brand-accent/20' : 'bg-brand-secondary/50 border-brand-border'}`}>
        <div className="flex-shrink-0">
            <task.icon className={`h-8 w-8 ${task.status === 'Completed' ? 'text-status-success' : task.status === 'Planned' ? 'text-brand-accent animate-pulse' : 'text-brand-accent'}`}/>
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
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
            <h1 className="text-4xl font-bold text-brand-text-primary mb-2 text-dynamic-accent">Project Phoenix: Roadmap Evolution</h1>
            <p className="text-lg text-brand-text-secondary">
                Implementing Phase 5.1: The Sanctuary Update.
            </p>
        </div>
        <div className="flex items-center gap-4 bg-brand-accent/10 p-4 rounded-xl border border-brand-accent/30">
            <div className="text-right">
                <p className="text-xs text-brand-text-secondary uppercase tracking-widest font-bold">Phase 5 Progress</p>
                <p className="text-2xl font-black text-brand-accent">45%</p>
            </div>
            <div className="w-32 h-3 bg-brand-dark rounded-full overflow-hidden">
                <div className="h-full bg-brand-accent" style={{ width: '45%' }}></div>
            </div>
        </div>
      </div>

      <div className="space-y-8">
        {planData.map((phase) => (
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