
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../contexts/ThemeContext';
import Card from '../components/Card';
import ShareCardModal from '../components/ShareCardModal';
import { Share2 } from 'lucide-react';
import ManuscriptQuote from '../components/ManuscriptQuote';
import { Megaphone } from 'lucide-react';
import { CheckIcon, FlagIcon, PencilIcon, PrayingHandsIcon, ReaderIcon, CloseIcon, ChevronLeftIcon, SoundWaveIcon, PlayIcon, PauseIcon, MicrophoneIcon } from '../components/icons';
import RichTextJournal from '../components/RichTextJournal';
import PrayerTimer from '../components/PrayerTimer';
import VoiceCompanionDrawer from '../components/VoiceCompanionDrawer';
import ScriptureStudyCompanion from '../components/ScriptureStudyCompanion';
import { getScriptureSnippet } from '../services/bibleService';
import { getTodayDevotional } from '../services/contentService';
import { saveJournalEntry } from '../services/journalService';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { useAuth } from '../contexts/AuthContext';
import { useGamification } from '../contexts/GamificationContext';
import { useNotifications } from '../contexts/NotificationContext';
import { usePrayerCircle } from '../hooks/usePrayerCircle';
import ReactMarkdown from 'react-markdown';

interface Devotional {
  id: string;
  title: string;
  content: string;
  date: string;
  audioUrl?: string;
  author?: string;
  openingPrayer?: string;
  declaration?: string;
  furtherStudy?: string;
}

const journeySteps = [
  { id: 'start', name: 'Start', icon: FlagIcon },
  { id: 'opening-prayer', name: 'Opening Prayer', icon: PrayingHandsIcon },
  { id: 'devotional', name: 'Daily Devotional', icon: ReaderIcon },
  { id: 'journaling', name: 'Journaling', icon: PencilIcon },
  { id: 'guided-prayer', name: 'Guided Prayer', icon: PrayingHandsIcon },
  { id: 'declaration', name: 'Declaration', icon: Megaphone },
  { id: 'further-study', name: 'Further Study', icon: ReaderIcon },
  { id: 'finish', name: 'Finish', icon: FlagIcon },
];

const ScriptureSnippetModal: React.FC<{ 
    reference: string; 
    onClose: () => void; 
}> = ({ reference, onClose }) => {
    const navigate = useNavigate();
    const [snippet, setSnippet] = useState<{ref: string, text: string, book: string, chapter: number} | null>(null);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        getScriptureSnippet(reference).then(res => {
            setSnippet(res);
            setLoading(false);
        });
    }, [reference]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-md animate-fade-in">
            <Card className="w-full max-w-lg border-brand-accent/30 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-brand-text-secondary hover:text-brand-accent transition-colors">
                    <CloseIcon className="w-6 h-6" />
                </button>
                
                {loading ? (
                    <div className="py-12 text-center text-brand-text-secondary animate-pulse">Preparing your encounter...</div>
                ) : (
                    <div className="animate-fade-in-up">
                        <h3 style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--crimson, #8E1B1B)', marginBottom: '1rem' }}>{snippet?.ref}</h3>
                        <div style={{ fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)', fontStyle: 'italic', fontSize: '20px', lineHeight: 1.6, borderLeft: '2px solid var(--crimson, #8E1B1B)', padding: '1em 1.5em', background: 'var(--bg-paper, #F6EFE1)', color: 'var(--fg-1, #2A1C15)', margin: '0 0 2rem 0' }} dangerouslySetInnerHTML={{ __html: snippet?.text || '' }} />
                        
                        <div className="flex gap-4">
                            <button 
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-brand-secondary border border-brand-border rounded-lg text-sm font-bold text-brand-text-secondary hover:bg-brand-border"
                            >
                                Close
                            </button>
                            <button 
                                onClick={() => navigate(`/bible?book=${snippet?.book}&chapter=${snippet?.chapter}`)}
                                className="flex-1 px-4 py-2 bg-brand-accent text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-opacity-90"
                            >
                                <ReaderIcon className="w-4 h-4"/> Full Study
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

const FURTHER_STUDY_REFS = ['Joshua 1:9', 'Deuteronomy 31:6', '2 Timothy 1:7'];

const FURTHER_STUDY_TEXTS: Record<string, string> = {
    'Joshua 1:9': 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.',
    'Deuteronomy 31:6': 'Be strong and courageous. Do not be afraid or terrified because of them, for the Lord your God goes with you; he will never leave you nor forsake you.',
    '2 Timothy 1:7': 'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.',
};

const getStepTonalStyle = (step: number, isDark: boolean) => {
  if (isDark) {
    switch (step) {
      case 0: return { bg: 'rgba(23, 19, 16, 0.98)', border: 'rgba(242, 125, 38, 0.1)' };
      case 1: return { bg: 'rgba(27, 20, 20, 0.98)', border: 'rgba(232, 100, 90, 0.15)' };
      case 2: return { bg: 'rgba(17, 19, 21, 0.98)', border: 'rgba(240, 128, 96, 0.1)' };
      case 3: return { bg: 'rgba(24, 22, 19, 0.98)', border: 'rgba(214, 168, 64, 0.1)' };
      case 4: return { bg: 'rgba(10, 13, 16, 0.98)', border: 'rgba(94, 136, 181, 0.15)' }; // Deep silent prayer navy
      case 5: return { bg: 'rgba(25, 21, 16, 0.98)', border: 'rgba(245, 168, 85, 0.1)' };
      case 6: return { bg: 'rgba(16, 21, 17, 0.98)', border: 'rgba(142, 180, 112, 0.1)' };
      case 7: return { bg: 'rgba(26, 24, 16, 0.98)', border: 'rgba(212, 168, 64, 0.2)' };
      default: return { bg: 'var(--bg-card, #1A1310)', border: 'rgba(255,255,255,0.08)' };
    }
  } else {
    switch (step) {
      case 0: return { bg: '#FBF6EA', border: 'rgba(42, 28, 21, 0.08)' };
      case 1: return { bg: '#FFF5F4', border: 'rgba(232, 100, 90, 0.15)' }; // Rose/Crimson tint
      case 2: return { bg: '#FDFBFA', border: 'rgba(240, 128, 96, 0.12)' }; // Devotional paper white
      case 3: return { bg: '#FAF6EF', border: 'rgba(214, 168, 64, 0.15)' }; // Journal cream
      case 4: return { bg: '#F0F4F8', border: 'rgba(94, 136, 181, 0.18)' }; // Soft calm blue/gray
      case 5: return { bg: '#FFFBF5', border: 'rgba(245, 168, 85, 0.15)' }; // Amber glow
      case 6: return { bg: '#F6F9F5', border: 'rgba(142, 180, 112, 0.15)' }; // Sage green tint
      case 7: return { bg: '#FFFDF0', border: 'rgba(212, 168, 64, 0.25)' }; // Celebration gold tint
      default: return { bg: 'var(--bg-card, #FBF6EA)', border: 'rgba(42, 28, 21, 0.08)' };
    }
  }
};

const BreathingGuide: React.FC = () => {
    const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
    const [seconds, setSeconds] = useState(4);

    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds((prev) => {
                if (prev <= 1) {
                    if (phase === 'inhale') {
                        setPhase('hold');
                        return 4;
                    } else if (phase === 'hold') {
                        setPhase('exhale');
                        return 4;
                    } else {
                        setPhase('inhale');
                        return 4;
                    }
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [phase]);

    return (
        <div className="flex flex-col items-center justify-center my-6">
            <div className="relative w-40 h-40 flex items-center justify-center">
                <motion.div
                    animate={{
                        scale: phase === 'inhale' ? [1, 1.4] : phase === 'hold' ? 1.4 : [1.4, 1],
                    }}
                    transition={{
                        duration: 4,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-0 rounded-full bg-brand-accent/10 border border-brand-accent/30"
                />
                <motion.div
                    animate={{
                        scale: phase === 'inhale' ? [1, 1.25] : phase === 'hold' ? 1.25 : [1.25, 1],
                        backgroundColor: phase === 'inhale' ? 'rgba(242, 125, 38, 0.15)' : phase === 'hold' ? 'rgba(242, 125, 38, 0.25)' : 'rgba(242, 125, 38, 0.08)',
                    }}
                    transition={{
                        duration: 4,
                        ease: "easeInOut"
                    }}
                    className="w-28 h-28 rounded-full flex flex-col items-center justify-center border border-brand-accent/20 shadow-lg z-10"
                >
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">
                        {phase}
                    </span>
                    <span className="text-xl font-bold mt-1 text-brand-text-primary">
                        {seconds}s
                    </span>
                </motion.div>
            </div>
            <p className="mt-6 text-sm text-brand-text-secondary italic font-serif text-center">
                {phase === 'inhale' && "Slowly fill your lungs with His presence..."}
                {phase === 'hold' && "Rest in the stillness of His sanctuary..."}
                {phase === 'exhale' && "Exhale all stress, worry, and distractions..."}
            </p>
        </div>
    );
};

const StepContent: React.FC<{ stepIndex: number; onComplete: () => void; devotional: Devotional | null; onOpenVoice: (ctx: string) => void; onSaveJournal: (text: string) => void; prayerPeople?: Array<{ id: string; name: string; prayerPoints: string[]; }> }> = ({ stepIndex, onComplete, devotional, onOpenVoice, onSaveJournal, prayerPeople = [] }) => {
    const [isPrayerComplete, setIsPrayerComplete] = useState(false);
    const [activeSnippet, setActiveSnippet] = useState<string | null>(null);
    const [journalText, setJournalText] = useState('');
    const [isStudyOpen, setIsStudyOpen] = useState(false);
    const [studyPassage, setStudyPassage] = useState('');
    const [studyText, setStudyText] = useState('');
    const [shareCompletionOpen, setShareCompletionOpen] = useState(false);

    useEffect(() => {
        if (stepIndex === 7) {
            if (!(window as any).confetti) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
                script.onload = () => {
                    (window as any).confetti({
                        particleCount: 150,
                        spread: 80,
                        origin: { y: 0.6 }
                    });
                };
                document.body.appendChild(script);
            } else {
                (window as any).confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 }
                });
            }
        }
    }, [stepIndex]);
    const isPrayerStep = stepIndex === 4;
    const { playTrack, currentTrack, isPlaying, togglePlayPause } = useAudioPlayer();

    const openStudy = (passage: string, text: string) => {
        setStudyPassage(passage);
        setStudyText(text);
        setIsStudyOpen(true);
    };

    const handleOpenStudy = async (ref: string) => {
        if (FURTHER_STUDY_TEXTS[ref]) {
            openStudy(ref, FURTHER_STUDY_TEXTS[ref]);
        } else {
            try {
                const res = await getScriptureSnippet(ref);
                const plainText = res.text.replace(/<[^>]*>/g, '');
                openStudy(ref, plainText);
            } catch {
                openStudy(ref, "Scripture passage for study.");
            }
        }
    };

    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const tonal = getStepTonalStyle(stepIndex, isDark);

    const renderContent = () => {
        switch (stepIndex) {
            case 0:
                return (
                    <div className="text-center py-8">
                        <p style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--crimson, #8E1B1B)', marginBottom: '0.75rem' }}>Daily Sanctuary</p>
                        <h2 style={{ fontFamily: 'var(--serif-display, "Cormorant Garamond", "Didot", Georgia, serif)', fontWeight: 600, fontSize: '1.75rem', lineHeight: 1.2, color: 'var(--fg-1, #2A1C15)', marginBottom: '1rem' }}>Prepare Your Heart</h2>
                        <p style={{ fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)', fontSize: '18px', lineHeight: 1.75, color: 'var(--fg-2, #5B4A3C)', marginBottom: '1.5rem' }}>A space designed for peace. Pause before the day takes your attention.</p>
                    </div>
                );
            case 1:
                return (
                    <div className="py-4 relative overflow-hidden min-h-[16rem] flex flex-col justify-center">
                        {/* Praying Hands watermark background */}
                        <div className="absolute right-0 bottom-0 w-36 h-36 opacity-[0.03] text-brand-accent pointer-events-none">
                            <PrayingHandsIcon className="w-full h-full" />
                        </div>
                        <p style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--crimson, #8E1B1B)', marginBottom: '0.5rem' }}>Step 1</p>
                        <h2 style={{ fontFamily: 'var(--serif-display, "Cormorant Garamond", "Didot", Georgia, serif)', fontWeight: 600, fontSize: '1.75rem', lineHeight: 1.2, color: 'var(--fg-1, #2A1C15)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <PrayingHandsIcon className="w-8 h-8 text-brand-accent animate-pulse"/>
                            Opening Prayer
                        </h2>
                        <div className="p-6 relative overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(42,28,21,0.03)', borderRadius: '1.5rem' }}>
                            <blockquote style={{ fontFamily: 'var(--serif-display, "Cormorant Garamond", "Didot", Georgia, serif)', fontStyle: 'italic', fontSize: '20px', lineHeight: 1.6, textAlign: 'center', maxWidth: '440px', margin: '0 auto', color: isDark ? '#E5E7FA' : '#2A1C15' }}>
                                {devotional?.openingPrayer || "Father, I acknowledge Your presence here with me. As I step away from the noise of the world, I ask that You would tune my heart to Your frequency. Speak through the stillness."}
                                <cite style={{ display: 'block', marginTop: '1em', fontStyle: 'normal', fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--crimson, #8E1B1B)' }}>Amen</cite>
                            </blockquote>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="py-4">
                        <p style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--crimson, #8E1B1B)', marginBottom: '0.5rem', textAlign: 'center' }}>Step 2</p>
                        <h2 style={{ fontFamily: 'var(--serif-display, "Cormorant Garamond", "Didot", Georgia, serif)', fontWeight: 600, fontSize: '1.75rem', lineHeight: 1.2, color: 'var(--fg-1, #2A1C15)', marginBottom: '1.5rem', textAlign: 'center' }}>Today's Reflection</h2>
                        {devotional ? (
                            <div className="text-left max-w-2xl mx-auto">
                                <h3 style={{ fontFamily: 'var(--serif-display, "Cormorant Garamond", "Didot", Georgia, serif)', fontWeight: 600, fontSize: '1.4rem', color: 'var(--crimson, #8E1B1B)', marginBottom: '1rem', textAlign: 'center' }}>{devotional.title}</h3>
                                
                                <div className="mb-5 flex justify-center">
                                    <button
                                        onClick={() => openStudy(devotional.title, devotional.content.slice(0, 300))}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-brand-accent/40 text-brand-accent text-sm font-bold hover:bg-brand-accent/10 transition-all"
                                        style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)' }}
                                    >
                                        <ReaderIcon className="w-4 h-4" />
                                        Study this passage
                                    </button>
                                </div>
                                {devotional.audioUrl && (() => {
                                    const isThisTrack = currentTrack?.id === devotional.id;
                                    const isThisPlaying = isThisTrack && isPlaying;
                                    const handleAudio = () => {
                                        if (isThisTrack) {
                                            togglePlayPause();
                                        } else {
                                            playTrack({
                                                id: devotional.id,
                                                title: devotional.title,
                                                description: 'Daily Devotional',
                                                author: 'THE CCN DAILY',
                                                coverArt: '',
                                                audioUrl: devotional.audioUrl!,
                                                duration: 0,
                                                releaseDate: devotional.date,
                                            });
                                        }
                                    };
                                    return (
                                        <div className="mb-6 flex items-center gap-4 p-4 bg-brand-secondary/40 rounded-2xl border border-brand-border/40">
                                            <button
                                                onClick={handleAudio}
                                                aria-label={isThisPlaying ? 'Pause devotional audio' : 'Play devotional audio'}
                                                className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-accent flex items-center justify-center text-white hover:scale-105 transition-transform shadow-lg"
                                            >
                                                {isThisPlaying
                                                    ? <PauseIcon className="w-5 h-5" />
                                                    : <PlayIcon className="w-5 h-5 ml-0.5" />}
                                            </button>
                                            <div>
                                                <p style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--crimson, #8E1B1B)' }}>Audio Reflection</p>
                                                <p className="text-sm text-brand-text-primary font-semibold mt-0.5">{devotional.title}</p>
                                                {isThisPlaying && (
                                                    <p className="text-xs text-brand-text-secondary mt-0.5 animate-pulse">Now playing in the audio player below</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}
                                <div style={{ fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)', fontSize: '18px', lineHeight: 1.75, color: isDark ? '#E5E7FA' : '#2A1C15' }}>
                                    <ReactMarkdown>{devotional.content}</ReactMarkdown>
                                </div>
                            </div>
                        ) : (
                            <p style={{ fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)', fontSize: '18px', lineHeight: 1.75, color: 'var(--fg-2, #5B4A3C)', maxWidth: '28rem', margin: '0 auto', textAlign: 'center' }}>
                                Today's devotional is not available yet. Focus on the core message of <strong>"Unshakeable Peace"</strong>.
                            </p>
                        )}
                    </div>
                );
            case 3:
                return (
                     <div className="py-4">
                        <p style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--crimson, #8E1B1B)', marginBottom: '0.5rem' }}>Step 3</p>
                        <h2 style={{ fontFamily: 'var(--serif-display, "Cormorant Garamond", "Didot", Georgia, serif)', fontWeight: 600, fontSize: '1.75rem', lineHeight: 1.2, color: 'var(--fg-1, #2A1C15)', marginBottom: '1rem' }}>Journal Your Response</h2>
                        <p style={{ fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)', fontSize: '18px', lineHeight: 1.75, color: 'var(--fg-2, #5B4A3C)', marginBottom: '1.5rem' }}>Where in your life do you need God's strength today? Type it out—the act of writing is an act of release.</p>
                        
                        <textarea
                            value={journalText}
                            onChange={(e) => setJournalText(e.target.value)}
                            placeholder="Where in your life do you need God's strength today?..."
                            className="w-full h-44 bg-transparent text-brand-text-primary placeholder-brand-text-secondary/40 focus:outline-none border-b border-brand-accent/30 focus:border-brand-accent py-2 resize-none transition-all duration-300"
                            style={{
                                fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)',
                                fontSize: '20px',
                                lineHeight: 1.75,
                            }}
                        />
                        <p style={{ marginTop: '0.5rem', fontSize: '12px', color: 'var(--fg-3, #9B8E87)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span aria-hidden="true">🎙</span>
                            Type or speak your reflection.
                        </p>
                    </div>
                );
            case 4:
                return (
                    <div className="py-4">
                        <p style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--crimson, #8E1B1B)', marginBottom: '0.5rem' }}>Step 4</p>
                        {prayerPeople.length > 0 && (
                            <motion.div
                                className="mb-6 rounded-xl border border-brand-accent/20 bg-brand-accent/5 p-4"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <p style={{ fontFamily: 'var(--sans-ui)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--crimson, #8E1B1B)', marginBottom: '0.75rem' }}>
                                    Praying for today
                                </p>
                                <div className="space-y-3">
                                    {prayerPeople.map((person) => (
                                        <div key={person.id} className="flex items-start gap-3">
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-accent/20 text-sm font-bold text-brand-accent">
                                                {person.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-brand-text-primary">{person.name}</p>
                                                {person.prayerPoints.slice(0, 2).map((pt, i) => (
                                                    <p key={i} className="text-xs text-brand-text-secondary">· {pt}</p>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                        <h2 style={{ fontFamily: 'var(--serif-display, "Cormorant Garamond", "Didot", Georgia, serif)', fontWeight: 600, fontSize: '1.75rem', lineHeight: 1.2, color: isDark ? '#E5E7FA' : '#2A1C15', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <SoundWaveIcon className="w-8 h-8 text-brand-accent animate-pulse"/>
                            Guided Prayer Sanctuary
                        </h2>
                        
                        {/* Interactive breathing pulsing visual guide */}
                        <BreathingGuide />
                        
                        <PrayerTimer duration={120} onComplete={() => setIsPrayerComplete(true)} />
                    </div>
                );
            case 5:
                return (
                     <div className="py-8 max-w-xl mx-auto text-center relative">
                        <span className="absolute -top-6 left-4 text-7xl font-serif text-brand-accent/15 pointer-events-none">“</span>
                        <div className="p-8 sm:p-12 rounded-3xl border-2 border-double border-brand-accent/20 bg-brand-accent/5 shadow-inner">
                            <p style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--crimson, #8E1B1B)', marginBottom: '1.5rem', textAlign: 'center' }}>Daily Declaration</p>
                            <blockquote style={{ fontFamily: 'var(--serif-display, "Cormorant Garamond", "Didot", Georgia, serif)', fontStyle: 'italic', fontSize: '24px', lineHeight: 1.6, textAlign: 'center', maxWidth: '440px', margin: '0 auto', color: isDark ? '#E5E7FA' : '#2A1C15' }}>
                                "{devotional?.declaration || "I am not a slave to fear. I am a child of God. His peace, which surpasses understanding, guards my mind and my heart today."}"
                            </blockquote>
                            <div className="w-16 h-px bg-brand-accent/30 mx-auto my-6" />
                            <cite className="block not-italic text-xs font-semibold tracking-widest uppercase text-brand-text-secondary" style={{ fontFamily: 'var(--sans-ui, "Inter Tight", sans-serif)' }}>
                                Speak it aloud. Receive it.
                            </cite>
                        </div>
                    </div>
                );
            case 6: {
                const furtherStudyStr = devotional?.furtherStudy;
                const furtherStudyRefs = furtherStudyStr
                    ? furtherStudyStr.split(',').map(r => r.trim()).filter(Boolean)
                    : FURTHER_STUDY_REFS;

                return (
                     <div>
                        <p style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--crimson, #8E1B1B)', marginBottom: '0.5rem' }}>Step 6</p>
                        <h2 style={{ fontFamily: 'var(--serif-display, "Cormorant Garamond", "Didot", Georgia, serif)', fontWeight: 600, fontSize: '1.75rem', lineHeight: 1.2, color: 'var(--fg-1, #2A1C15)', marginBottom: '1.5rem' }}>For Further Study</h2>
                        <p style={{ fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)', fontSize: '18px', lineHeight: 1.75, color: 'var(--fg-2, #5B4A3C)', marginBottom: '1.5rem' }}>Click a verse to read it instantly in your sanctuary. Tap "Study" to go deeper.</p>
                        
                        {/* Selected passage display styled as a beautiful dark black well */}
                        {activeSnippet && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-6 rounded-2xl bg-black border border-brand-accent/20 relative shadow-2xl overflow-hidden"
                            >
                                <span className="absolute -top-3 -left-1 text-8xl font-serif text-brand-accent/5 pointer-events-none">“</span>
                                <p style={{ fontFamily: 'var(--sans-ui)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--crimson, #8E1B1B)', marginBottom: '0.5rem' }}>
                                    {activeSnippet}
                                </p>
                                <blockquote
                                    style={{
                                        fontFamily: 'var(--serif-body, "EB Garamond", serif)',
                                        fontStyle: 'italic',
                                        fontSize: '18px',
                                        lineHeight: 1.65,
                                        color: '#F3EFE9'
                                    }}
                                >
                                    {studyText || "Loading scripture text..."}
                                </blockquote>
                            </motion.div>
                        )}

                        <div className="grid gap-3">
                            {furtherStudyRefs.map(ref => (
                                <div
                                    key={ref}
                                    className="p-5 bg-brand-secondary/40 rounded-2xl border border-brand-border/40 flex items-center justify-between gap-4 group hover:border-brand-accent transition-all"
                                >
                                    <button
                                        onClick={() => setActiveSnippet(ref)}
                                        className="flex-1 text-left"
                                    >
                                        <span className="font-bold text-brand-text-primary group-hover:text-brand-accent transition-colors">{ref}</span>
                                    </button>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleOpenStudy(ref)}
                                            className="px-3 py-1.5 rounded-lg border border-brand-accent/40 text-brand-accent text-xs font-bold hover:bg-brand-accent/10 transition-all"
                                            style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)' }}
                                        >
                                            Study
                                        </button>
                                        <ReaderIcon className="w-5 h-5 text-brand-text-secondary opacity-30 group-hover:opacity-100 group-hover:scale-110 transition-all"/>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {activeSnippet && <ScriptureSnippetModal reference={activeSnippet} onClose={() => setActiveSnippet(null)} />}
                    </div>
                );
            }
            case 7:
                 return (
                    <div className="text-center py-12">
                        <div className="relative inline-block mb-6">
                            <CheckIcon className="w-20 h-20 text-status-success"/>
                            <div className="absolute inset-0 bg-status-success/20 rounded-full animate-ping"></div>
                        </div>
                        <h2 style={{ fontFamily: 'var(--serif-display, "Cormorant Garamond", "Didot", Georgia, serif)', fontWeight: 600, fontSize: '1.75rem', lineHeight: 1.2, color: 'var(--fg-1, #2A1C15)', marginBottom: '0.5rem' }}>Well done. You showed up.</h2>
                        <p style={{ fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)', fontSize: '18px', lineHeight: 1.75, color: 'var(--fg-2, #5B4A3C)', marginBottom: '1.5rem' }}>You have set a firm foundation for your day. Go in peace and power.</p>
                        <div className="flex justify-center mb-8">
                            <button
                                onClick={() => setShareCompletionOpen(true)}
                                className="bg-brand-accent hover:opacity-90 active:scale-95 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2"
                                style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)' }}
                            >
                                <Share2 className="w-4 h-4" /> Share Completion Card
                            </button>
                        </div>
                        <div className="max-w-xs mx-auto">
                            <ManuscriptQuote
                                quote="Faithfulness matters more than flash."
                                source="The Passion Path"
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };
    
    return (
        <>
            <Card
                className="relative flex flex-col items-center justify-center overflow-hidden p-6 sm:p-10 min-h-[30rem] sm:min-h-[35rem] transition-all duration-500 border-2"
                style={{
                    background: tonal.bg,
                    borderColor: tonal.border,
                    boxShadow: 'var(--sh-card, 0 1px 2px rgba(42,28,21,.06), 0 8px 24px rgba(42,28,21,.05))'
                }}
            >
                {/* Ambient inner glow */}
                <div
                    className="pointer-events-none absolute inset-x-0 -top-24 h-64 opacity-10"
                    aria-hidden
                    style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgb(242 125 38) 0%, transparent 70%)' }}
                />
                <div className="relative z-10 w-full max-w-xl">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={stepIndex}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full"
                        >
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                    
                    <div className="mt-12 flex flex-col items-center gap-4">
                        <motion.button
                            onClick={() => {
                                // Save the journal step's reflection into the user's journal/Library.
                                if (stepIndex === 3 && journalText.trim()) onSaveJournal(journalText);
                                onComplete();
                            }}
                            disabled={isPrayerStep && !isPrayerComplete}
                            className="group relative px-10 py-4 rounded-full bg-brand-accent text-white font-black text-lg shadow-2xl disabled:opacity-40"
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        >
                            <span className="flex items-center gap-2">
                                {stepIndex === 0 ? "Step Inside" : stepIndex === journeySteps.length - 1 ? "Carry the Light" : "I've Finished This Step"}
                                <ChevronLeftIcon className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </motion.button>
                        <button
                            onClick={() => onOpenVoice(journeySteps[stepIndex]?.name || 'Daily Journey')}
                            className="flex items-center gap-2 text-xs font-bold text-brand-text-secondary transition-colors hover:text-brand-accent"
                        >
                            <MicrophoneIcon className="h-3.5 w-3.5" />
                            Pray Aloud
                        </button>
                    </div>
                </div>
            </Card>

            <ScriptureStudyCompanion
                passage={studyPassage}
                passageText={studyText}
                isOpen={isStudyOpen}
                onClose={() => setIsStudyOpen(false)}
            />

            {/* Share Card Modal */}
            <ShareCardModal
                isOpen={shareCompletionOpen}
                onClose={() => setShareCompletionOpen(false)}
                title="Sanctuary Encounter"
                text={`I completed my Daily Devotional Journey: "${devotional?.title || 'Daily Sanctuary Walk'}" on CCN Daily.`}
                author={devotional?.author || "CCN Daily"}
                type="completion"
            />
        </>
    );
}

const STEP_EASE = [0.2, 0.6, 0.2, 1] as [number, number, number, number];

const GuidedJourneyPage: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
    const [devotional, setDevotional] = useState<Devotional | null>(null);
    const [voiceDrawerOpen, setVoiceDrawerOpen] = useState(false);
    const [voiceStepContext, setVoiceStepContext] = useState('');
    const { user } = useAuth();
    const { dispatchGamificationEvent } = useGamification();
    const { notify } = useNotifications();
    const { todaysPeople } = usePrayerCircle(user?.uid);
    const checkedInRef = React.useRef(false);

    useEffect(() => {
        const fetchTodayDevotional = async () => {
            try {
                const today = new Date();
                const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                const item = await getTodayDevotional(todayString);
                if (item) setDevotional(item as Devotional);
            } catch {
                // No devotional published today — journey continues without it
            }
        };
        fetchTodayDevotional();
    }, []);

    // Daily check-in: opening the journey counts toward the streak (once per mount).
    useEffect(() => {
        if (user?.uid && !checkedInRef.current) {
            checkedInRef.current = true;
            dispatchGamificationEvent('e1');
        }
    }, [user?.uid, dispatchGamificationEvent]);

    // Save the journal-step reflection into the user's journal (feeds the Library).
    const handleSaveJournal = async (text: string) => {
        if (!user?.uid) return;
        try {
            await saveJournalEntry(user.uid, {
                id: (globalThis.crypto?.randomUUID?.() ?? `j-${Date.now()}`),
                text,
                color: 'blue',
                createdAt: new Date().toISOString(),
                prompt: 'Daily Journey reflection',
            });
        } catch {
            // Non-blocking — journaling save failures shouldn't interrupt the journey
        }
    };

    const handleNextStep = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setDirection(1);
        if (currentStep < journeySteps.length - 1) {
            // Reaching the final (completion) step = the devotional journey is complete.
            if (currentStep + 1 === journeySteps.length - 1) {
                dispatchGamificationEvent('e2');
                notify('Daily journey complete — your streak is updated.', 'success');
            }
            setCurrentStep(s => s + 1);
        } else {
            setCurrentStep(0);
        }
    };

    const progressPct = (currentStep / (journeySteps.length - 1)) * 100;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">

            {/* Header */}
            <motion.div
                className="mb-10 text-center"
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.42, ease: STEP_EASE }}
            >
                <p style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--crimson, #8E1B1B)', marginBottom: '0.5rem' }}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <h1 style={{ fontFamily: 'var(--serif-display, "Cormorant Garamond", "Didot", Georgia, serif)', fontWeight: 600, fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.15, color: 'var(--fg-1, #2A1C15)', letterSpacing: '-0.01em' }}>
                    The Daily Sanctuary
                </h1>
                {/* Progress bar */}
                <div className="mt-5 mx-auto h-0.5 w-48 rounded-full bg-brand-border overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-brand-accent"
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.42, ease: STEP_EASE }}
                    />
                </div>
            </motion.div>

            {/* Stepper — circles only; the active step name is captioned below the row so
                edge labels (e.g. "Start") are never clipped by a scroll container. */}
            <div className="mb-5 py-4">
                <ol className="flex items-center w-full max-w-4xl mx-auto px-4">
                    {journeySteps.map((step, index) => {
                        const isCompleted = index < currentStep;
                        const isCurrent = index === currentStep;
                        return (
                            <li
                                key={step.id}
                                className={`relative flex w-full items-center ${index < journeySteps.length - 1 ? "after:content-[''] after:w-full after:h-px after:inline-block" : ''} ${isCompleted ? 'after:bg-brand-accent' : 'after:bg-brand-border'}`}
                            >
                                <motion.div
                                    animate={{
                                        scale: isCurrent ? 1.22 : 1,
                                        boxShadow: isCurrent ? '0 0 18px rgb(242 125 38 / 0.45)' : '0 0 0px transparent',
                                    }}
                                    transition={{ duration: 0.35, ease: STEP_EASE }}
                                    className={`flex flex-shrink-0 items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-full ${isCurrent ? 'bg-brand-accent text-white' : isCompleted ? 'bg-brand-accent/60 text-white' : 'bg-brand-secondary text-brand-text-secondary border border-brand-border'}`}
                                >
                                    {isCompleted ? <CheckIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5" /> : <step.icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />}
                                </motion.div>
                            </li>
                        );
                    })}
                </ol>
                {/* Active step name — centered caption, always fully visible */}
                <p className="mt-5 text-center text-[13px] font-bold uppercase tracking-widest text-brand-accent">
                    {journeySteps[currentStep]?.name}
                </p>
            </div>

            {/* Step content — direction-aware transition */}
            <div className="mt-10 overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentStep}
                        custom={direction}
                        variants={{
                            enter: (d: number) => ({ opacity: 0, x: d * 40 }),
                            center: { opacity: 1, x: 0 },
                            exit: (d: number) => ({ opacity: 0, x: d * -30 }),
                        }}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.42, ease: STEP_EASE }}
                    >
                        <StepContent
                            stepIndex={currentStep}
                            onComplete={handleNextStep}
                            onSaveJournal={handleSaveJournal}
                            devotional={devotional}
                            prayerPeople={todaysPeople}
                            onOpenVoice={(ctx) => {
                                setVoiceStepContext(ctx);
                                setVoiceDrawerOpen(true);
                            }}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            <VoiceCompanionDrawer
                isOpen={voiceDrawerOpen}
                onClose={() => setVoiceDrawerOpen(false)}
                stepContext={voiceStepContext}
            />

        </div>
    );
};

export default GuidedJourneyPage;
