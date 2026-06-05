import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { PenLine } from 'lucide-react';
import { SpinnerIcon, UserIcon, CheckIcon, LockIcon } from '../components/icons';
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
    } catch { /* localStorage read failed — start fresh */ }
  }, []);

  useEffect(() => {
    if (dailyDevotional) {
        try {
            // Now only saving the devotional data, not highlights
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dailyDevotional));
        } catch { /* localStorage write failed — non-critical */ }
    }
  }, [dailyDevotional]);

  const handleGenerate = async () => {
    if (!user) {
        setError("Please sign in to prepare a devotional.");
        return;
    }

    const userTier = user.tier || 'free';
    if (!getTierFeatures(userTier).canGeneratePersonalizedDevotionals) {
        openUpgradeModal('Personal Devotionals', 'pro');
        return;
    }

    setIsLoading(true);
    setError(null);
    setDailyDevotional(null);
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    localStorage.removeItem(LOCAL_STORAGE_KEY);

    try {
      const generatedObject = await generatePersonalizedDevotional(user.uid, user.displayName || 'Friend', user.tier || 'free');
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
    const bodyHtml = data.body.split('\n\n').map(p => `<p style="font-family:var(--serif-body,'EB Garamond','Garamond',Georgia,serif);font-size:18px;line-height:1.75;color:var(--fg-1,#2A1C15);margin-bottom:1em">${p.trim()}</p>`).join('');
    const eyebrowStyle = `font-family:var(--sans-ui,'Inter Tight',-apple-system,sans-serif);font-size:12px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;color:var(--crimson,#8E1B1B)`;
    const scriptureBlockStyle = `font-family:var(--serif-body,'EB Garamond','Garamond',Georgia,serif);font-style:italic;font-size:20px;line-height:1.6;border-left:2px solid var(--crimson,#8E1B1B);padding:1em 1.5em;background:var(--bg-paper,#F6EFE1);color:var(--fg-1,#2A1C15);margin:1.5em 0`;
    const citeStyle = `display:block;margin-top:0.75em;font-style:normal;font-family:var(--sans-ui,'Inter Tight',-apple-system,sans-serif);font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--crimson,#8E1B1B)`;
    const prayerStyle = `font-family:var(--serif-display,'Cormorant Garamond','Didot',Georgia,serif);font-style:italic;font-size:21px;line-height:1.6;text-align:center;max-width:440px;margin:1.5em auto;color:var(--fg-1,#2A1C15)`;

    return `
      <p style="text-align:center;${eyebrowStyle};margin-bottom:1.5rem">${formattedDate}</p>
      <blockquote style="${scriptureBlockStyle}">
        "${data.openingVerse.split('" - ')[0]}"
        <cite style="${citeStyle}">${data.openingVerse.split('" - ')[1] || ''}</cite>
      </blockquote>
      ${bodyHtml}
      <div style="margin-top:2.5rem;padding-top:1.5rem;border-top:1px solid rgba(42,28,21,0.1)">
        <p style="${eyebrowStyle};margin-bottom:1rem">Prayer</p>
        <blockquote style="${prayerStyle}">
          ${data.prayer}
        </blockquote>
      </div>
      <div style="margin-top:2rem;padding:1.5rem;border-radius:0.75rem;background:var(--bg-paper,#F6EFE1);border:1px solid rgba(142,27,27,0.15)">
        <p style="${eyebrowStyle};margin-bottom:0.75rem">Declaration</p>
        <p style="font-family:var(--serif-display,'Cormorant Garamond','Didot',Georgia,serif);font-weight:600;font-size:1.2rem;line-height:1.5;color:var(--fg-1,#2A1C15)">${data.declaration}</p>
      </div>
      <div style="margin-top:2.5rem;padding-top:1.5rem;border-top:1px solid rgba(42,28,21,0.1)">
        <p style="${eyebrowStyle};margin-bottom:1rem">For Further Study</p>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.5rem">
            ${data.furtherStudy.map(s => `<li style="display:flex;align-items:center"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:1rem;height:1rem;margin-right:0.75rem;color:var(--fg-3,#8A7A6A);flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"></path></svg><span style="font-family:var(--serif-body,'EB Garamond','Garamond',Georgia,serif);font-size:17px;color:var(--fg-2,#5B4A3C)">${s}</span></li>`).join('')}
        </ul>
      </div>
    `;
  };
  
  const userTier = user?.tier || 'free';
  const canGenerate = getTierFeatures(userTier).canGeneratePersonalizedDevotionals;

  return (
    <div>
      <div className="mb-8">
        <p style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--crimson, #8E1B1B)', marginBottom: '0.5rem' }}>Daily Formation</p>
        <h1 style={{ fontFamily: 'var(--serif-display, "Cormorant Garamond", "Didot", Georgia, serif)', fontWeight: 600, fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.15, color: 'var(--fg-1, #2A1C15)', marginBottom: '0.75rem' }}>
          Your Devotional
        </h1>
        <p style={{ fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)', fontSize: '18px', lineHeight: 1.75, color: 'var(--fg-2, #5B4A3C)' }}>
          A reflection written for you, from Scripture — shaped around where you are with God today.
        </p>
      </div>

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
                    <p style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-2, #5B4A3C)' }}>User</p>
                    <p className="text-brand-text-primary">{user?.displayName || 'Guest'}</p>
                </div>
                <div className="p-3 bg-brand-accent/5 rounded border border-brand-accent/10">
                    <p className="text-xs text-brand-text-secondary italic">
                        Your recent notes can help prepare a reflection that fits your current season.
                    </p>
                </div>
            </div>
            <button 
              onClick={handleGenerate} 
              disabled={isLoading || !!dailyDevotional} 
              className="w-full mt-6 px-4 py-2 rounded-lg bg-brand-accent text-white font-semibold flex items-center justify-center disabled:bg-opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? <SpinnerIcon className="w-5 h-5" /> : dailyDevotional ? 'Prepared for Today' : canGenerate ? <><PenLine className="w-5 h-5 mr-2"/> Prepare Devotional</> : <><LockIcon className="w-5 h-5 mr-2"/> Access Devotionals</>}
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
              <Card className="h-full flex flex-col items-center justify-center text-center" style={{ background: 'var(--bg-paper, #F6EFE1)', boxShadow: 'var(--sh-card, 0 1px 2px rgba(42,28,21,.06), 0 8px 24px rgba(42,28,21,.05))' }}>
                  <PenLine className="w-16 h-16 text-brand-text-secondary/30 mb-4"/>
                  <h3 style={{ fontFamily: 'var(--serif-display, "Cormorant Garamond", "Didot", Georgia, serif)', fontWeight: 600, fontSize: '1.4rem', lineHeight: 1.2, color: 'var(--fg-1, #2A1C15)', marginBottom: '0.5rem' }}>Your Personal Devotional Awaits</h3>
                  <p style={{ fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)', fontSize: '17px', lineHeight: 1.7, color: 'var(--fg-2, #5B4A3C)' }}>Prepare a Scripture-rooted reflection for today.</p>
              </Card>
          )}

          {isLoading && (
              <Card className="h-full flex flex-col items-center justify-center text-center" style={{ background: 'var(--bg-paper, #F6EFE1)', boxShadow: 'var(--sh-card, 0 1px 2px rgba(42,28,21,.06), 0 8px 24px rgba(42,28,21,.05))' }}>
                  <SpinnerIcon className="w-12 h-12 text-brand-accent mb-4"/>
                  <p style={{ fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)', fontSize: '17px', lineHeight: 1.7, color: 'var(--fg-2, #5B4A3C)' }}>Preparing a personal message...</p>
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
