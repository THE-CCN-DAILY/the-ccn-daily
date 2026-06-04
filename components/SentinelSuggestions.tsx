
import React, { useState } from 'react';
import Card from './Card';
import { Lightbulb } from 'lucide-react';
import { AiIcon, SoundWaveIcon, CheckIcon, TeamIcon } from './icons';
import { useRoadmap } from '../contexts/RoadmapContext';

interface Suggestion {
    id: string;
    title: string;
    description: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    iconName: string;
    benefit: string;
    status: 'Recommended' | 'Selected' | 'Implemented';
}

const suggestions: Suggestion[] = [
    {
        id: 's1',
        title: 'Prayer Memory',
        description: 'Let Kai draw on prior prayers, journal entries, and life events so guidance feels continuous without becoming noisy.',
        icon: SoundWaveIcon,
        iconName: 'SoundWaveIcon',
        benefit: 'Deepens user emotional connection and spiritual continuity.',
        status: 'Recommended'
    },
    {
        id: 's2',
        title: 'Expert Council',
        description: 'A dedicated set of pastoral, biblical, and care-oriented lenses speaking into a situation from different angles.',
        icon: TeamIcon,
        iconName: 'TeamIcon',
        benefit: 'Provides holistic care (Mind, Body, Spirit) in one interface.',
        status: 'Recommended'
    },
    {
        id: 's3',
        title: 'Teaching Notes Engine',
        description: 'Process uploaded or linked sermons and teachings into summaries, key takeaways, and actionable prayer points.',
        icon: Lightbulb,
        iconName: 'Lightbulb',
        benefit: 'Transforms passive watching into active spiritual growth.',
        status: 'Recommended'
    }
];

const SentinelSuggestions: React.FC = () => {
    const { addCustomTask } = useRoadmap();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const handleSelect = (s: Suggestion) => {
        addCustomTask('phase-5', {
            id: s.id,
            title: s.title,
            description: s.description,
            iconName: s.iconName,
            status: 'Planned'
        });
        setSelectedIds(prev => new Set(prev).add(s.id));
    };

    return (
        <div className="mb-12 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-brand-accent/20 rounded-lg">
                    <Lightbulb className="w-6 h-6 text-brand-accent animate-pulse" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-brand-text-primary">Sentinel Strategic Recommendations</h2>
                    <p className="text-sm text-brand-text-secondary">Background recommendations to strengthen care, content, and stewardship.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {suggestions.map((s) => (
                    <Card key={s.id} className="group hover:border-brand-accent/50 transition-all cursor-pointer relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2">
                            <span className={`text-[12px] font-black uppercase tracking-widest px-2 py-1 rounded ${selectedIds.has(s.id) ? 'text-status-success bg-status-success/10' : 'text-brand-accent bg-brand-accent/10'}`}>
                                {selectedIds.has(s.id) ? 'Selected' : s.status}
                            </span>
                        </div>
                        <div className="mb-4 p-3 bg-brand-secondary rounded-xl w-fit group-hover:bg-brand-accent/10 transition-colors">
                            <s.icon className="w-6 h-6 text-brand-accent" />
                        </div>
                        <h3 className="text-lg font-bold text-brand-text-primary mb-2">{s.title}</h3>
                        <p className="text-sm text-brand-text-secondary mb-4 leading-relaxed">
                            {s.description}
                        </p>
                        <div className="mt-auto pt-4 border-t border-brand-border">
                            <p className="text-[12px] font-bold text-brand-text-secondary uppercase tracking-widest mb-1">Impact</p>
                            <p className="text-xs text-brand-accent font-medium">{s.benefit}</p>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                            <button 
                                onClick={() => handleSelect(s)}
                                disabled={selectedIds.has(s.id)}
                                className={`text-xs font-bold flex items-center gap-1 ${selectedIds.has(s.id) ? 'text-status-success cursor-default' : 'text-brand-accent hover:underline'}`}
                            >
                                {selectedIds.has(s.id) ? (
                                    <><CheckIcon className="w-3 h-3" /> Added to Roadmap</>
                                ) : (
                                    <><CheckIcon className="w-3 h-3" /> Select for Roadmap</>
                                )}
                            </button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default SentinelSuggestions;
