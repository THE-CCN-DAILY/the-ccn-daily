import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../components/Card';
import { Mic } from 'lucide-react';
import { SoundWaveIcon, MicrophoneIcon, StopIcon, LockIcon } from '../components/icons';
import { connectToSentientGuide } from '../services/liveService';
import { useAuth } from '../contexts/AuthContext';
import { useUpgradeModal } from '../contexts/UpgradeModalContext';
import { getTierFeatures } from '../types/pricing';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const VoiceCompanion: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<{ text: string; isUser: boolean }[]>([]);
  const [status, setStatus] = useState('Standby');
  const sessionRef = useRef<{ close: () => void } | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { openUpgradeModal } = useUpgradeModal();

  const userTier = user?.tier || 'free';
  const canUseLiveVoice = getTierFeatures(userTier).canUseLiveVoiceCompanion;

  const scrollTranscriptToBottom = () => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startSession = async () => {
    if (!canUseLiveVoice) {
      openUpgradeModal('Guided Voice Prayer', 'max');
      return;
    }

    setIsActive(true);
    setStatus('Connecting…');
    try {
      const session = await connectToSentientGuide({
        onAudioData: () => {},
        onTranscription: (text, isUser) => {
          setTranscript(prev => {
            const next = [...prev.slice(-20), { text, isUser }];
            setTimeout(scrollTranscriptToBottom, 50);
            return next;
          });
        },
        onError: (err) => setStatus(err),
      });
      sessionRef.current = session;
      setStatus('Listening…');
    } catch {
      setStatus('Connection failed — please try again');
      setIsActive(false);
    }
  };

  const stopSession = () => {
    sessionRef.current?.close();
    setIsActive(false);
    setStatus('Standby');
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2">Pray</p>
        <h1 className="text-4xl font-black text-brand-text-primary mb-2 flex items-center gap-3"
          style={{ fontFamily: 'var(--font-display)' }}>
          <Mic className="w-9 h-9 text-brand-accent" />
          Kai — Prayer Companion
        </h1>
        <p className="text-brand-text-secondary">
          A calm voice companion for prayerful reflection, Scripture-aware listening, and gentle next steps.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Orb panel */}
        <div className="lg:col-span-3">
          <Card className="flex flex-col items-center justify-center py-16 relative overflow-hidden">
            {/* Ambient glow */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-48 opacity-20"
              aria-hidden
              style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgb(242 125 38) 0%, transparent 70%)' }}
            />

            {/* Orb */}
            <div className={`relative flex items-center justify-center transition-all duration-700 ${isActive ? 'scale-110' : 'scale-100'}`}>
              <div className={`w-48 h-48 rounded-full flex items-center justify-center ${isActive ? 'bg-brand-accent shadow-[0_0_80px_rgba(242,125,38,0.4)]' : 'bg-brand-secondary'} transition-all duration-700`}>
                <SoundWaveIcon className={`w-20 h-20 ${isActive ? 'text-white' : 'text-brand-text-secondary'} transition-colors`} />
              </div>
              {isActive && (
                <>
                  <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping" />
                  <div className="absolute -inset-8 rounded-full border border-brand-accent/20 animate-ping" style={{ animationDelay: '0.5s' }} />
                </>
              )}
            </div>

            {/* Status */}
            <motion.p
              key={status}
              className={`mt-8 text-xl font-black uppercase tracking-[0.15em] ${isActive ? 'text-brand-accent' : 'text-brand-text-secondary'}`}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {status}
            </motion.p>

            {/* CTA button */}
            <div className="mt-6">
              {!isActive ? (
                <motion.button
                  onClick={startSession}
                  className="px-10 py-4 bg-brand-accent text-white rounded-full font-bold text-lg shadow-2xl flex items-center gap-3 hover:bg-opacity-90 transition-opacity"
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  {canUseLiveVoice ? (
                    <><MicrophoneIcon className="w-5 h-5" /> Begin Session</>
                  ) : (
                    <><LockIcon className="w-5 h-5" /> Upgrade to Pray Aloud</>
                  )}
                </motion.button>
              ) : (
                <motion.button
                  onClick={stopSession}
                  className="px-10 py-4 bg-status-error text-white rounded-full font-bold text-lg shadow-2xl flex items-center gap-3 hover:bg-opacity-90 transition-opacity"
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <StopIcon className="w-5 h-5" /> End Session
                </motion.button>
              )}
            </div>
          </Card>
        </div>

        {/* Transcript panel */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card className="flex-1 flex flex-col" style={{ minHeight: '320px' }}>
            <h3 className="text-sm font-bold text-brand-text-secondary uppercase tracking-widest mb-4 flex-shrink-0">
              Conversation
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <AnimatePresence initial={false}>
                {transcript.length === 0 ? (
                  <motion.p
                    key="empty"
                    className="text-sm text-brand-text-secondary/60 text-center pt-8"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  >
                    {isActive ? 'Kai is listening…' : 'Start a session to begin'}
                  </motion.p>
                ) : (
                  transcript.map((t, i) => (
                    <motion.div
                      key={i}
                      className={`flex ${t.isUser ? 'justify-end' : 'justify-start'}`}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        t.isUser
                          ? 'bg-brand-accent/20 text-brand-text-primary rounded-tr-sm'
                          : 'bg-brand-secondary text-brand-accent font-semibold rounded-tl-sm'
                      }`}>
                        {!t.isUser && (
                          <span className="text-[12px] font-black uppercase tracking-widest text-brand-accent/70 block mb-0.5">Kai</span>
                        )}
                        {t.text}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
              <div ref={transcriptEndRef} />
            </div>
          </Card>

          {/* Feature chips */}
          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Attentive', desc: 'Shaped around reflective prompts and Scripture-aware guidance.' },
              { label: 'Private', desc: 'Real-time processing. Zero long-term audio storage.' },
            ].map(({ label, desc }) => (
              <motion.div
                key={label}
                className="px-4 py-3 bg-brand-accent/5 rounded-xl border border-brand-accent/20"
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <p className="text-xs font-bold text-brand-accent uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-xs text-brand-text-secondary">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceCompanion;
