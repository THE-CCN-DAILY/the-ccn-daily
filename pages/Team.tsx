
import React, { useState } from 'react';
import Card from '../components/Card';
import type { TeamMember } from '../types';
import { Users } from 'lucide-react';
import { CheckIcon, AiIcon, DbIcon, UiIcon, StepsIcon, CommunityIcon } from '../components/icons';

const teamData: TeamMember[] = [
  {
    name: 'Lead Architect',
    role: 'Team Lead',
    avatarUrl: 'https://picsum.photos/seed/architect/200',
    focus: 'Overseeing technical cohesion and Phase 5-7 delivery.'
  },
  {
    name: 'UX/UI Specialist',
    role: 'Design Lead',
    avatarUrl: 'https://picsum.photos/seed/designer/200',
    focus: 'Crafting multimodal immersive interfaces.'
  },
  {
    name: 'Cloudflare Systems Engineer',
    role: 'Infra Lead',
    avatarUrl: 'https://picsum.photos/seed/firebase/200',
    focus: 'Moving data, edge APIs, and operational dashboards onto Cloudflare services.'
  },
  {
    name: 'AI Integration Expert',
    role: 'AI Lead',
    avatarUrl: 'https://picsum.photos/seed/ai/200',
    focus: 'Implementing Cloudflare-routed reasoning and carefully gated multimodal flows.'
  }
];

const briefings = [
    {
        owner: 'AI Lead',
        target: 'Phase 5: Sentience & Grounding',
        status: '75%',
        plan: [
            'Pivoting devotional engine to source primary themes from https://theccndaily.substack.com/.',
            'Connect Kai (Sentient Guide) to User Journal context with long-term memory.',
            'Migrate Grounded Intercession to Prayer Wall (Live)'
        ],
        icon: AiIcon
    },
    {
        owner: 'Strategy Lead',
        target: 'Nas.io Enhanced Community',
        status: '25%',
        plan: [
            'Launched Multimodal Challenge Creator (Admin tool for Books/Newsletters).',
            'Integrating "Grace Link" spiritual gifting for frictionless growth.',
            'Deploying "Lumina" for automated community summaries and prayer digests.'
        ],
        icon: CommunityIcon
    },
    {
        owner: 'Design Lead',
        target: 'Phase 6: Multi-Sensory immersion',
        status: '15%',
        plan: [
            'Prototyping Veo-3.1 dynamic video backgrounds',
            'Haptic feedback integration for prayer breathing',
            'Adaptive UI based on "Sentinel Mood Analysis"'
        ],
        icon: UiIcon
    }
];

const Team: React.FC = () => {
  const [view, setView] = useState<'profiles' | 'briefing'>('briefing');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
        <div>
            <h1 className="text-4xl font-bold text-brand-text-primary mb-2">The Virtual Expert Team</h1>
            <p className="text-lg text-brand-text-secondary">
                Strategy Session: Implementing the Vision.
            </p>
        </div>
        <div className="flex bg-brand-secondary p-1 rounded-full border border-brand-border">
            <button 
                onClick={() => setView('briefing')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${view === 'briefing' ? 'bg-brand-accent text-white shadow-lg' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}
            >
                Strategy Briefing
            </button>
            <button 
                onClick={() => setView('profiles')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${view === 'profiles' ? 'bg-brand-accent text-white shadow-lg' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}
            >
                Team Profiles
            </button>
        </div>
      </div>

      {view === 'profiles' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
            {teamData.map((member) => (
            <Card key={member.name} className="flex flex-col items-center text-center">
                <img src={member.avatarUrl} alt={member.name} className="w-24 h-24 rounded-full mb-4 border-2 border-brand-accent" />
                <h3 className="text-xl font-bold text-brand-text-primary">{member.name}</h3>
                <p className="text-brand-accent font-semibold text-sm">{member.role}</p>
                <p className="text-xs text-brand-text-secondary mt-2">{member.focus}</p>
            </Card>
            ))}
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {briefings.map((brief, i) => (
                    <Card key={i} className="flex flex-col border-t-4 border-brand-accent">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-brand-accent/10 rounded-lg">
                                <brief.icon className="w-6 h-6 text-brand-accent"/>
                            </div>
                            <div className="text-right">
                                <p className="text-[12px] font-black uppercase text-brand-text-secondary tracking-widest">Progress</p>
                                <p className="text-xl font-black text-brand-accent">{brief.status}</p>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-brand-text-primary mb-1">{brief.target}</h3>
                        <p className="text-xs font-bold text-brand-accent mb-4">Lead: {brief.owner}</p>
                        
                        <div className="space-y-3 flex-1">
                            {brief.plan.map((step, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <div className="mt-1 w-4 h-4 rounded-full border border-brand-accent/30 flex items-center justify-center flex-shrink-0">
                                        <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse"></div>
                                    </div>
                                    <p className="text-sm text-brand-text-secondary leading-tight">{step}</p>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-brand-border flex justify-between items-center">
                            <span className="text-[12px] font-bold text-status-success flex items-center">
                                <CheckIcon className="w-3 h-3 mr-1"/> Architect Approved
                            </span>
                            <button className="text-[12px] font-bold text-brand-accent hover:underline uppercase tracking-widest">Deploy Logic</button>
                        </div>
                    </Card>
                ))}
            </div>
            
            <Card className="bg-brand-accent/5 border-brand-accent/20">
                <h3 className="text-xl font-bold text-brand-text-primary mb-4 flex items-center gap-2">
                    <Users className="w-6 h-6 text-brand-accent"/>
                    Strategic Implementation Priority
                </h3>
                <p className="text-brand-text-secondary mb-6 italic">
                    "Our focus has shifted to Community Architecture. By integrating Nas.io's high-conversion logic with our spiritual grounding, we are building more than an app—we are building a digital tabernacle. The Substack pivot ensures our content is always fresh and aligned with the latest teachings."
                </p>
                <div className="flex gap-4">
                    <div className="flex-1 bg-brand-dark p-4 rounded-xl border border-brand-border">
                        <p className="text-xs font-bold text-brand-text-secondary uppercase mb-2">Immediate Action</p>
                        <p className="text-sm text-brand-text-primary font-bold">Implement Grace Link & Lumina Summarizer.</p>
                    </div>
                    <div className="flex-1 bg-brand-dark p-4 rounded-xl border border-brand-border">
                        <p className="text-xs font-bold text-brand-text-secondary uppercase mb-2">Next Milestone</p>
                        <p className="text-sm text-brand-text-primary font-bold">Launch the Expert Council Portal.</p>
                    </div>
                </div>
            </Card>
        </div>
      )}
    </div>
  );
};

export default Team;
