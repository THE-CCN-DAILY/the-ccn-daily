import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { SparklesIcon, SpinnerIcon, UserIcon, CheckIcon, LockIcon } from '../components/icons';
import { generatePersonalizedDevotional } from '../services/geminiService';
import type { DevotionalOutput } from '../types';
import { useGamification } from '../contexts/GamificationContext';
import { useAuth } from '../contexts/AuthContext';
import ContentDisplay from '../components/reader/ContentDisplay';
import { getTierFeatures } from '../types/pricing';
import { useUpgradeModal } from '../contexts/UpgradeModalContext';

const LOCAL_STORAGE_KEY = 'ccn_daily_devotional_data';

type DailyDevotionalData = {
    data: DevotionalOutput;
    date: string; // YYYY-MM-DD
    isCompleted?: boolean;
}

const DevotionalGeneratorPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [dailyDevotional, setDailyDevotional] = useState<DailyDevotionalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { dispatchGamificationEvent } = useGamification();
  const { openUpgradeModal } = useUpgradeModal();
  
  const getTodayDateString = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    try {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
            const parsedData: DailyDevotionalData = JSON.parse(savedData);
            if (parsedData.date === getTodayDateString()) {
                setDailyDevotional(parsedData);
            }
        }
    } catch (e) { console.error("Failed to load devotional from storage", e); }
  }, []);

  useEffect(() => {
    if (dailyDevotional) {
        try {
            // Now only saving the devotional data, not highlights
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dailyDevotional));
        } catch (e) { console.error("Failed to save devotional to storage", e); }
    }
  }, [dailyDevotional]);

  const handleGenerate = async () => {
    if (!user) {
        setError("Please sign in to generate a personalized devotional.");
        return;
    }

    const userTier = user.tier || 'free';
    if (!getTierFeatures(userTier).canGeneratePersonalizedDevotionals) {
        openUpgradeModal('Deeply Personalized AI Devotionals', 'pro');
        return;
    }

    setIsLoading(true);
    setError(null);
    setDailyDevotional(null);
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    localStorage.removeItem(LOCAL_STORAGE_KEY);

    try {
      const generatedObject = await generatePersonalizedDevotional(user.uid, user.displayName || 'Friend');
      setDailyDevotional({
          data: generatedObject,
          date: getTodayDateString()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMarkComplete = () => {
    if (dailyDevotional && !dailyDevotional.isCompleted) {
        dispatchGamificationEvent('e2');
        setDailyDevotional(prev => prev ? { ...prev, isCompleted: true } : null);
    }
  };

  const devotionalHtmlContent = (data: DevotionalOutput, date: string) => {
    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const bodyHtml = data.body.split('\n\n').map(p => `<p>${p.trim()}</p>`).join('');

    return `
      <p class="text-center text-sm text-brand-text-secondary mb-4">${formattedDate}</p>
      <blockquote class="text-center italic text-brand-text-secondary border-y-2 border-brand-border py-4 my-6">
        <p>"${data.openingVerse.split('" - ')[0]}"</p>
        <cite class="not-italic mt-2 block text-sm">- ${data.openingVerse.split('" - ')[1]}</cite>
      </blockquote>
      ${bodyHtml}
      <div class="mt-8 pt-6 border-t border-brand-border">
        <h4 class="text-lg font-bold text-brand-text-primary mb-2">Prayer</h4>
        <p class="italic text-brand-text-secondary">${data.prayer}</p>
      </div>
      <div class="mt-6 p-4 bg-brand-accent/10 rounded-lg">
        <h4 class="text-lg font-bold text-brand-text-primary mb-2">Declaration</h4>
        <p class="font-semibold text-brand-accent">${data.declaration}</p>
      </div>
       <div class="mt-8 pt-6 border-t border-brand-border">
        <h4 class="text-lg font-bold text-brand-text-primary mb-2">For Further Study</h4>
        <ul class="list-none !pl-0 space-y-2">
            ${data.furtherStudy.map(s => `<li class="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-3 text-brand-text-secondary flex-shrink-0"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"></path></svg><span class="text-brand-text-secondary">${s}</span></li>`).join('')}
        </ul>
      </div>
    `;
  };
  
  const userTier = user?.tier || 'free';
  const canGenerate = getTierFeatures(userTier).canGeneratePersonalizedDevotionals;

  return (
    <div>
      <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Personalized Devotional</h1>
      <p className="text-lg text-brand-text-secondary mb-8">
        This page now uses the unified reader. It has themes, font controls, and a Smart Library, just like the ePub prototype.
      </p>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Controls Column */}
        <div className="xl:w-80 flex-shrink-0">
          <Card>
            <h3 className="text-lg font-bold text-brand-text-primary mb-4 flex items-center">
                <UserIcon className="w-5 h-5 mr-2 text-brand-accent"/>
                Personal Context
            </h3>
            <div className="space-y-3 text-sm">
                <div>
                    <p className="text-xs font-semibold text-brand-text-secondary/80">User</p>
                    <p className="text-brand-text-primary">{user?.displayName || 'Guest'}</p>
                </div>
                <div className="p-3 bg-brand-accent/5 rounded border border-brand-accent/10">
                    <p className="text-xs text-brand-text-secondary italic">
                        The Genkit Orchestrator will fetch your recent notes to personalize this devotional.
                    </p>
                </div>
            </div>
            <button 
              onClick={handleGenerate} 
              disabled={isLoading || !!dailyDevotional} 
              className="w-full mt-6 px-4 py-2 rounded-lg bg-brand-accent text-white font-semibold flex items-center justify-center disabled:bg-opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? <SpinnerIcon className="w-5 h-5" /> : dailyDevotional ? 'Generated for Today' : canGenerate ? <><SparklesIcon className="w-5 h-5 mr-2"/> Generate Devotional</> : <><LockIcon className="w-5 h-5 mr-2"/> Unlock Devotionals</>}
            </button>
            {dailyDevotional && (
                 <button
                    onClick={handleMarkComplete}
                    disabled={dailyDevotional.isCompleted}
                    className="w-full mt-4 px-4 py-2 rounded-lg bg-status-success/20 text-status-success font-semibold flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed hover:bg-status-success/30 transition-colors"
                >
                    <CheckIcon className="w-5 h-5 mr-2"/>
                    {dailyDevotional.isCompleted ? 'Completed for Today' : 'Mark as Complete'}
                </button>
            )}
          </Card>
        </div>
        
        {/* Reader Column */}
        <div className="flex-1 min-h-[50rem]">
          {error && <Card><p className="text-red-400 text-center">{error}</p></Card>}
          
          {!dailyDevotional && !isLoading && !error && (
              <Card className="h-full flex flex-col items-center justify-center text-center">
                  <SparklesIcon className="w-16 h-16 text-brand-text-secondary/30 mb-4"/>
                  <h3 className="text-xl font-bold text-brand-text-primary">Your Personal Devotional Awaits</h3>
                  <p className="text-brand-text-secondary">Click the generate button to create a unique reflection for today.</p>
              </Card>
          )}

          {isLoading && (
              <Card className="h-full flex flex-col items-center justify-center text-center">
                  <SpinnerIcon className="w-12 h-12 text-brand-accent mb-4"/>
                  <p className="text-brand-text-secondary">Crafting a personal message...</p>
              </Card>
          )}
          
          {dailyDevotional && (
            <ContentDisplay
              key={dailyDevotional.date}
              contentId={`devotional-${dailyDevotional.date}`}
              initialContent={devotionalHtmlContent(dailyDevotional.data, dailyDevotional.date)}
              title={dailyDevotional.data.title}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DevotionalGeneratorPage;