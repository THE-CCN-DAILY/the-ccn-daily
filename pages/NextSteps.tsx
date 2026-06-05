import React from 'react';
import Card from '../components/Card';
import type { NextStepItem } from '../types';
import { StepsIcon } from '../components/icons';

const nextStepsData: NextStepItem[] = [
  {
    id: 'launch-visual-qa',
    text: 'Complete visual QA on landing, pricing, dashboard, admin dashboard, family dashboard, leader dashboard, scholarship, and sign-in.',
    isCompleted: false,
  },
  {
    id: 'launch-copy-qa',
    text: 'Finish the public-copy audit so every screen sells Scripture, prayer, formation, and community rather than background technology.',
    isCompleted: false,
  },
  {
    id: 'launch-data-boundaries',
    text: 'Confirm the source of truth for books, donations, announcements, scholarships, settings, and member records.',
    isCompleted: false,
  },
  {
    id: 'launch-payments',
    text: 'Verify subscription, giving, webhook, and access-grant flows end to end on staging.',
    isCompleted: false,
  },
  {
    id: 'launch-cloudflare',
    text: 'Add Cloudflare launch hardening where it matters most: Turnstile, rate limits, cache strategy, D1 migrations, and entitlement-aware media delivery.',
    isCompleted: false,
  },
  {
    id: 'launch-staging',
    text: 'Deploy to staging, test the signed-in member journey, then promote to production only after the release checklist passes.',
    isCompleted: false,
  },
];

const NextSteps: React.FC = () => {
  return (
    <div>
      <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Launch Readiness</h1>
      <p className="text-lg text-brand-text-secondary mb-8">
        The next actions focus the app into one coherent devotional product: beautiful, stable, paid-flow ready, and quietly powered by the infrastructure behind it.
      </p>
      <Card>
        <ul className="space-y-4">
          {nextStepsData.map((item) => (
            <li key={item.id} className="flex items-start p-3 bg-brand-secondary/50 rounded-lg">
              <StepsIcon className="w-6 h-6 mr-4 mt-1 flex-shrink-0 text-brand-accent" />
              <span className="text-lg text-brand-text-primary">{item.text}</span>
            </li>
          ))}
        </ul>
      </Card>
      <div className="mt-8 text-center text-brand-text-secondary">
        <p>Use this page as the operating checklist before any production promotion.</p>
      </div>
    </div>
  );
};

export default NextSteps;
