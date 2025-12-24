import React from 'react';
import Card from '../components/Card';
import type { TeamMember } from '../types';

const teamData: TeamMember[] = [
  {
    name: 'Lead Architect',
    role: 'Team Lead',
    avatarUrl: 'https://picsum.photos/seed/architect/200',
    focus: 'Overseeing the master plan, technical cohesion, and ensuring alignment with the founder\'s vision.'
  },
  {
    name: 'UX/UI Specialist',
    role: 'Design Lead',
    avatarUrl: 'https://picsum.photos/seed/designer/200',
    focus: 'Crafting an immersive, visually stunning, and psychologically engaging user experience.'
  },
  {
    name: 'Senior Firebase Engineer',
    role: 'Backend & Infra Lead',
    avatarUrl: 'https://picsum.photos/seed/firebase/200',
    focus: 'Leveraging the full Firebase ecosystem for performance, security, and real-time capabilities.'
  },
  {
    name: 'AI Integration Expert',
    role: 'AI Lead',
    avatarUrl: 'https://picsum.photos/seed/ai/200',
    focus: 'Integrating Gemini and Genkit to create deeply personal and innovative AI-powered features.'
  },
  {
    name: 'Frontend Performance Engineer',
    role: 'Frontend Lead',
    avatarUrl: 'https://picsum.photos/seed/frontend/200',
    focus: 'Ensuring the application is fast, responsive, and efficient on all devices.'
  },
];

const Team: React.FC = () => {
  return (
    <div>
      <h1 className="text-4xl font-bold text-brand-text-primary mb-2">The Virtual Expert Team</h1>
      <p className="text-lg text-brand-text-secondary mb-8">
        This is the core team dedicated to bringing Project Phoenix to life.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamData.map((member) => (
          <Card key={member.name} className="flex flex-col items-center text-center">
            <img src={member.avatarUrl} alt={member.name} className="w-24 h-24 rounded-full mb-4 border-2 border-brand-accent" />
            <h3 className="text-xl font-bold text-brand-text-primary">{member.name}</h3>
            <p className="text-brand-accent font-semibold">{member.role}</p>
            <p className="text-sm text-brand-text-secondary mt-2">{member.focus}</p>
          </Card>
        ))}
         <Card className="flex flex-col items-center text-center bg-brand-accent/20 border-brand-accent border-dashed">
            <div className="w-24 h-24 rounded-full mb-4 bg-brand-secondary flex items-center justify-center">
              <span className="text-4xl text-brand-accent">?</span>
            </div>
            <h3 className="text-xl font-bold text-brand-text-primary">New Roles Required</h3>
            <p className="text-brand-accent font-semibold">Data Scientist & Community Manager</p>
            <p className="text-sm text-brand-text-secondary mt-2">To analyze engagement and manage content and community interaction as we scale.</p>
          </Card>
      </div>
    </div>
  );
};

export default Team;