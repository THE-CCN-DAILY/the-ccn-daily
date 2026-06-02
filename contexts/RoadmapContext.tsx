
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { PlanPhase, PlanTask } from '../types';
import { Share2, Film, Lightbulb } from 'lucide-react';
import { UiIcon, DbIcon, ReaderIcon, AiIcon, CommunityIcon, GamificationIcon, AdminIcon, SpeakerWaveIcon, StepsIcon, SoundWaveIcon, SearchIcon } from '../components/icons';

interface RoadmapContextType {
    phases: PlanPhase[];
    addCustomTask: (phaseId: string, task: Omit<PlanTask, 'icon'> & { iconName?: string }) => void;
    updateTaskStatus: (phaseId: string, taskId: string, status: PlanTask['status']) => void;
}

const RoadmapContext = createContext<RoadmapContextType | undefined>(undefined);

// Helper to map icon names to components
const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
    UiIcon, DbIcon, ReaderIcon, AiIcon, CommunityIcon, GamificationIcon, AdminIcon, SpeakerWaveIcon, StepsIcon, SoundWaveIcon, SearchIcon,
    Share2, Film, Lightbulb
};

const initialPhases: PlanPhase[] = [
  {
    id: 'phase-0',
    title: 'Phase 0: Foundation & Vision Alignment',
    progress: 100,
    description: 'Laying the technical and aesthetic groundwork.',
    tasks: [
      { id: 't01', title: 'UI/UX Master Revision', description: 'Comprehensive premium feel revisions.', icon: UiIcon, status: 'Completed' },
      { id: 't02', title: 'Advanced Firestore Architecture', description: 'Scalable schema for Family/Community accounts.', icon: DbIcon, status: 'Completed' },
      { id: 't03', title: 'The Great Separation', description: 'Refactored navigation to create distinct Sanctuary and Command Center experiences.', icon: UiIcon, status: 'Completed' },
    ],
  },
  {
    id: 'phase-5',
    title: 'Phase 5: The Sentient & Grounded Experience',
    progress: 100,
    description: 'Leveraging the latest 2025 AI models for real-time companionship.',
    tasks: [
        { id: 't51', title: 'Gemini Live: Kai', description: 'Real-time spoken guidance during prayer.', icon: SoundWaveIcon, status: 'Completed' },
        { id: 't52', title: 'Grounded Intercession', description: 'Search-grounded global prayer suggestions.', icon: SearchIcon, status: 'Completed' },
        { id: 't53', title: 'Substack Devotional Sync', description: 'Automated ingestion of themes from theccndaily.substack.com.', icon: ReaderIcon, status: 'Completed' },
        { id: 't55', title: 'The Sanctuary Timer', description: 'Animated, musical, and extendable sessions.', icon: SoundWaveIcon, status: 'Completed' },
    ],
  },
  {
    id: 'phase-nas',
    title: 'Phase: Nas.io Enhanced Community',
    progress: 100,
    description: 'Integrating high-conversion community features with a spiritual twist.',
    tasks: [
        { id: 'n01', title: 'Multimodal Challenge Creator', description: 'Admin tool to generate challenges from books, newsletters, or URLs (Nas.io logic).', icon: GamificationIcon, status: 'Completed' },
        { id: 'n02', title: 'Grace Link (Frictionless Sharing)', description: 'Instant URL-based spiritual gift sharing and access without app-download barriers.', icon: Share2, status: 'Completed' },
        { id: 'n03', title: 'Lumina (The Community Summarizer)', description: 'AI-driven community conversation and prayer request digests for The Community.', icon: AiIcon, status: 'Completed' },
        { id: 'n04', title: 'Expert Council Portal', description: 'Multi-persona AI guidance (Mental Health, Biblical Scholars).', icon: CommunityIcon, status: 'Completed' },
    ],
  },
  {
    id: 'phase-6',
    title: 'Phase 6: Multi-Sensory Immersion',
    progress: 100,
    description: 'Cinematic video and adaptive audio environments.',
    tasks: [
        { id: 't61', title: 'Veo Cinematic Sanctuaries', description: 'Generative high-fidelity video backgrounds.', icon: Film, status: 'Completed' },
        { id: 't62', title: 'Adaptive Audio (Lyria)', description: 'Real-time score generation based on mood.', icon: SoundWaveIcon, status: 'Completed' },
    ],
  },
  {
    id: 'phase-7',
    title: 'Phase 7: Global Community Scale',
    progress: 100,
    description: 'Multi-tenant administration and global replication.',
    tasks: [
        { id: 't71', title: 'Community Multi-Tenancy', description: 'Sub-portal logic for organizational management.', icon: CommunityIcon, status: 'Completed' },
        { id: 't72', title: 'Cost Optimization Sentinel', description: 'Real-time token and compute efficiency tracking.', icon: DbIcon, status: 'Completed' },
    ],
  },
  {
    id: 'phase-8',
    title: 'Phase 8: Global Infrastructure & Events',
    progress: 100,
    description: 'Live streaming, event registration, and targeted broadcast communication.',
    tasks: [
        { id: 't81', title: 'Broadcast Engine', description: 'Targeted in-app push notifications and email updates via Resend/SendGrid.', icon: SpeakerWaveIcon, status: 'Completed' },
        { id: 't82', title: 'Live Streaming Integration', description: 'Low-latency audio/video streaming via Cloudflare Stream.', icon: SoundWaveIcon, status: 'Completed' },
        { id: 't83', title: 'Event Registration Portal', description: 'Online and physical event management with shareable Grace Links.', icon: CommunityIcon, status: 'Completed' },
    ],
  },
  {
    id: 'phase-9',
    title: 'Phase 9: Monetization & Gateways',
    progress: 100,
    description: 'International and local payment infrastructure.',
    tasks: [
        { id: 't91', title: 'Stripe Integration', description: 'Global card processing and Apple/Google Pay for international users.', icon: DbIcon, status: 'Completed' },
        { id: 't92', title: 'Flutterwave Integration', description: 'Mobile money (M-Pesa, MTN, Airtel) and local card processing for African markets.', icon: DbIcon, status: 'Completed' },
    ],
  },
];

export const RoadmapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [phases, setPhases] = useState<PlanPhase[]>(initialPhases);

    const addCustomTask = (phaseId: string, taskData: Omit<PlanTask, 'icon'> & { iconName?: string }) => {
        setPhases(prev => prev.map(phase => {
            if (phase.id === phaseId) {
                const newTask: PlanTask = {
                    ...taskData,
                    icon: iconMap[taskData.iconName || 'AiIcon'] || AiIcon
                };
                return {
                    ...phase,
                    tasks: [...phase.tasks, newTask],
                    // Recalculate progress roughly
                    progress: Math.min(100, Math.floor(((phase.tasks.length + 1) * 20) + phase.progress / 2)) 
                };
            }
            return phase;
        }));
    };

    const updateTaskStatus = (phaseId: string, taskId: string, status: PlanTask['status']) => {
        setPhases(prev => prev.map(phase => {
            if (phase.id === phaseId) {
                return {
                    ...phase,
                    tasks: phase.tasks.map(t => t.id === taskId ? { ...t, status } : t)
                };
            }
            return phase;
        }));
    };

    return (
        <RoadmapContext.Provider value={{ phases, addCustomTask, updateTaskStatus }}>
            {children}
        </RoadmapContext.Provider>
    );
};

export const useRoadmap = () => {
    const context = useContext(RoadmapContext);
    if (!context) throw new Error('useRoadmap must be used within a RoadmapProvider');
    return context;
};
