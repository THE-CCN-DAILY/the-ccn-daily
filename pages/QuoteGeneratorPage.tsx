import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Player } from '@remotion/player';
import Card from '../components/Card';
import { Quote } from 'lucide-react';
import { AiIcon, SpinnerIcon, ShareIcon, DownloadIcon, CheckIcon, LockIcon } from '../components/icons';
import { generateQuoteImage } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useUpgradeModal } from '../contexts/UpgradeModalContext';
import { getTierFeatures } from '../types/pricing';
import { useNotifications } from '../contexts/NotificationContext';
import { VerseCard, type VerseCardProps } from '../remotion/VerseCard';

const DEFAULT_FLUTTERWAVE_KEY = (import.meta as any).env.VITE_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-SANDBOXDEMOKEY-X';
void DEFAULT_FLUTTERWAVE_KEY;

type Tab = 'image' | 'video';
type VideoTheme = 'dark' | 'light' | 'sepia';
type VideoFormat = 'portrait' | 'square' | 'landscape';

const FORMAT_DIMS: Record<VideoFormat, { w: number; h: number; label: string }> = {
  portrait:  { w: 1080, h: 1920, label: 'Stories (9:16)' },
  square:    { w: 1080, h: 1080, label: 'Feed (1:1)' },
  landscape: { w: 1920, h: 1080, label: 'Wide (16:9)' },
};

const QuoteGeneratorPage: React.FC = () => {
  const { notify } = useNotifications();
  const { user } = useAuth();
  const { openUpgradeModal } = useUpgradeModal();

  /* ── Tab ─────────────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState<Tab>('video');

  /* ── Static image state ───────────────────────────────────────── */
  const [quoteText, setQuoteText] = useState('Commit your way to the LORD, trust also in Him, and He shall bring it to pass. - Psalm 37:5, NKJV');
  const [attribution, setAttribution] = useState('Psalm 37:5');
  void attribution; // used indirectly via quoteText
  const [style, setStyle] = useState('Spiritual');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared'>('idle');
  const [error, setError] = useState<string | null>(null);

  /* ── Video card state ─────────────────────────────────────────── */
  const [videoVerse, setVideoVerse] = useState('But those who hope in the Lord will renew their strength. They will soar on wings like eagles.');
  const [videoRef, setVideoRef] = useState('Isaiah 40:31');
  const [videoTheme, setVideoTheme] = useState<VideoTheme>('dark');
  const [videoFormat, setVideoFormat] = useState<VideoFormat>('portrait');

  const userTier = user?.tier || 'free';
  const canGenerateQuoteImages = getTierFeatures(userTier).canGenerateQuoteImages;
  const styles = ['Spiritual', 'Nature', 'Abstract', 'Modern', 'Vintage'];

  const handleGenerate = async () => {
    if (!canGenerateQuoteImages) {
      openUpgradeModal('AI Quote Image Generation', 'pro');
      return;
    }
    setIsLoading(true);
    setGeneratedImageUrl(null);
    setError(null);
    try {
      const prompt = `A beautiful ${style} style background for a spiritual quote. Background only, no text. High quality, inspirational, ${style === 'Spiritual' ? 'ethereal lights and divine atmosphere' : style === 'Nature' ? 'serene mountain landscape at sunrise' : 'minimalist aesthetic'}.`;
      const imageUrl = await generateQuoteImage(prompt, user?.tier || 'free');
      setGeneratedImageUrl(imageUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg.includes('PREMIUM_FEATURE')) {
        setError(msg.replace('PREMIUM_FEATURE: ', ''));
      } else {
        setError('AI image generation is currently unavailable. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && generatedImageUrl) {
      try {
        await navigator.share({ title: 'Daily Inspiration', text: quoteText, url: window.location.href });
        setShareStatus('shared');
        setTimeout(() => setShareStatus('idle'), 2000);
      } catch (e) { /* share cancelled or unsupported */ }
    } else {
      notify('Sharing not supported on this device. Download the image instead.', 'error');
    }
  };

  const dims = FORMAT_DIMS[videoFormat];
  const playerWidth  = 360;
  const playerHeight = Math.round(playerWidth * (dims.h / dims.w));

  const videoProps: VerseCardProps = {
    verseText: videoVerse,
    verseRef: videoRef,
    brandName: 'THE CCN DAILY',
    theme: videoTheme,
  };

  const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2">Publish</p>
        <h1 className="text-4xl font-black text-brand-text-primary mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Quote Graphics
        </h1>
        <p className="text-brand-text-secondary">
          Turn Scripture into shareable images and animated video cards — built for Instagram, WhatsApp, and beyond.
        </p>
      </motion.div>

      {/* ── Tab switcher ────────────────────────────────────────────── */}
      <div className="mb-8 inline-flex rounded-sm border border-brand-border overflow-hidden">
        {([['video', '🎬 Animated Video Card'], ['image', '🖼 Static Image']] as [Tab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 text-sm font-semibold transition-colors ${activeTab === tab ? 'bg-brand-accent text-white' : 'bg-brand-secondary text-brand-text-secondary hover:text-brand-text-primary'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Animated Video Card tab ──────────────────────────────────── */}
      {activeTab === 'video' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Settings */}
          <div className="space-y-6">
            <Card>
              <h2 className="mb-4 flex items-center text-xl font-bold text-brand-text-primary">
                <Quote className="mr-2 h-6 w-6 text-brand-accent" />
                Video Card Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-brand-text-secondary">Verse Text</label>
                  <textarea
                    value={videoVerse}
                    onChange={e => setVideoVerse(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-sm border border-brand-border bg-brand-secondary p-3 text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent"
                    placeholder="Enter scripture text..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-brand-text-secondary">Reference</label>
                  <input
                    value={videoRef}
                    onChange={e => setVideoRef(e.target.value)}
                    className="w-full rounded-sm border border-brand-border bg-brand-secondary p-3 text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent"
                    placeholder="e.g. Psalm 23:1"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-brand-text-secondary">Theme</label>
                  <div className="flex gap-2">
                    {(['dark', 'light', 'sepia'] as VideoTheme[]).map(t => (
                      <button
                        key={t}
                        onClick={() => setVideoTheme(t)}
                        className={`px-4 py-2 text-sm rounded-sm capitalize transition-colors ${videoTheme === t ? 'bg-brand-accent text-white' : 'bg-brand-secondary border border-brand-border text-brand-text-secondary hover:border-brand-accent/40'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-brand-text-secondary">Format</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(FORMAT_DIMS) as [VideoFormat, typeof FORMAT_DIMS[VideoFormat]][]).map(([fmt, meta]) => (
                      <button
                        key={fmt}
                        onClick={() => setVideoFormat(fmt)}
                        className={`px-4 py-2 text-xs rounded-sm transition-colors ${videoFormat === fmt ? 'bg-brand-accent text-white' : 'bg-brand-secondary border border-brand-border text-brand-text-secondary hover:border-brand-accent/40'}`}
                      >
                        {meta.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-text-secondary">Render to File</h3>
              <p className="mb-4 text-sm leading-relaxed text-brand-text-secondary">
                To export this card as an MP4 video, run in your terminal:
              </p>
              <pre className="overflow-x-auto rounded-sm bg-brand-dark p-4 text-xs text-brand-accent">
{`npx remotion render remotion/index.ts \\
  VerseCard${videoFormat === 'square' ? 'Square' : videoFormat === 'landscape' ? 'Landscape' : ''} \\
  --props='${JSON.stringify({ verseText: videoVerse, verseRef: videoRef, theme: videoTheme })}' \\
  out/verse-card.mp4`}
              </pre>
              <p className="mt-3 text-xs text-brand-text-secondary italic">
                Or open the full studio: <code className="text-brand-accent">npm run remotion:studio</code>
              </p>
            </Card>
          </div>

          {/* Live preview */}
          <div className="flex flex-col items-center">
            <Card className="w-full flex flex-col items-center p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-text-secondary">
                Live Preview — {dims.w}×{dims.h}
              </p>
              <div className="overflow-hidden rounded-sm border border-brand-border shadow-2xl">
                <Player
                  component={VerseCard as unknown as React.ComponentType<Record<string, unknown>>}
                  compositionWidth={dims.w}
                  compositionHeight={dims.h}
                  durationInFrames={300}
                  fps={30}
                  style={{ width: playerWidth, height: playerHeight }}
                  inputProps={videoProps as unknown as Record<string, unknown>}
                  controls
                  loop
                />
              </div>
              <p className="mt-4 text-center text-xs italic text-brand-text-secondary">
                Press play to preview the full 10-second animation.
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* ── Static Image tab ─────────────────────────────────────────── */}
      {activeTab === 'image' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Settings */}
          <div className="space-y-6">
            <Card>
              <h2 className="mb-4 flex items-center text-xl font-bold text-brand-text-primary">
                <AiIcon className="mr-2 h-6 w-6 text-brand-accent" />
                Compose Your Quote
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-brand-text-secondary">Quote Text</label>
                  <textarea
                    value={quoteText}
                    onChange={e => setQuoteText(e.target.value)}
                    className="h-32 w-full resize-none rounded-sm border border-brand-border bg-brand-secondary p-3 text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent"
                    placeholder="Paste text from the reader or your journal..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-brand-text-secondary">Visual Style</label>
                  <div className="flex flex-wrap gap-2">
                    {styles.map(s => (
                      <button
                        key={s}
                        onClick={() => setStyle(s)}
                        className={`rounded-full px-4 py-2 text-sm transition-all ${style === s ? 'bg-brand-accent text-white shadow-md' : 'bg-brand-secondary text-brand-text-secondary hover:bg-brand-border'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  className={`flex w-full items-center justify-center gap-2 rounded-sm py-3 font-bold transition-colors ${canGenerateQuoteImages ? 'bg-brand-accent text-white hover:bg-opacity-90' : 'bg-brand-secondary text-brand-text-secondary hover:bg-brand-border'}`}
                >
                  {canGenerateQuoteImages
                    ? <><Quote className="h-5 w-5" /> Generate Image</>
                    : <><LockIcon className="h-5 w-5" /> Access Image Generation</>}
                </button>
                {error && (
                  <div className="rounded-sm border border-brand-accent/20 bg-brand-accent/10 p-3 text-xs text-brand-accent">
                    {error}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Preview */}
          <div className="flex flex-col">
            <Card className="group relative flex min-h-[400px] flex-1 flex-col items-center justify-center overflow-hidden">
              {!generatedImageUrl && !isLoading && (
                <div className="p-8 text-center">
                  {!canGenerateQuoteImages && (
                    <div className="mb-4 inline-flex items-center rounded-full border border-brand-accent/20 bg-brand-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-accent">
                      Premium Tier
                    </div>
                  )}
                  <Quote className="mx-auto mb-4 h-16 w-16 text-brand-text-secondary/20" />
                  <p className="mx-auto max-w-xs italic text-brand-text-secondary">
                    {canGenerateQuoteImages
                      ? 'Ready to generate your visual inspiration.'
                      : 'AI Visual Generation is a premium feature. Switch to the Video Card tab for free animated cards.'}
                  </p>
                </div>
              )}
              {isLoading && (
                <div className="text-center">
                  <SpinnerIcon className="mx-auto mb-4 h-12 w-12 text-brand-accent" />
                  <p className="animate-pulse text-brand-text-secondary">Preparing your visual inspiration...</p>
                </div>
              )}
              {generatedImageUrl && (
                <div className="relative h-full w-full animate-fade-in-up">
                  <img src={generatedImageUrl} className="h-full w-full rounded-sm object-cover" alt="AI Generated Background" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-sm bg-black/40 p-12 text-center">
                    <p className="font-serif text-2xl font-bold leading-relaxed text-white drop-shadow-md md:text-3xl">
                      "{quoteText}"
                    </p>
                    <p className="mt-4 border-t border-white/30 pt-2 text-sm font-bold uppercase tracking-widest text-brand-accent">
                      THE CCN DAILY
                    </p>
                  </div>
                  <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={handleShare} className="rounded-full bg-white/10 p-3 text-white backdrop-blur-md hover:bg-white/20">
                      {shareStatus === 'shared' ? <CheckIcon className="h-5 w-5 text-green-400" /> : <ShareIcon className="h-5 w-5" />}
                    </button>
                    <a href={generatedImageUrl} download="CCN-Quote.png" className="rounded-full bg-white/10 p-3 text-white backdrop-blur-md hover:bg-white/20">
                      <DownloadIcon className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              )}
            </Card>
            <p className="mt-4 text-center text-xs italic text-brand-text-secondary">
              Premium image generation is gated until the production AI budget and provider limits are confirmed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteGeneratorPage;
