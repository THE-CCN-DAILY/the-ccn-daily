import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SoundWaveIcon, MicrophoneIcon, StopIcon } from './icons';
import { connectToSentientGuide } from '../services/liveService';
import { useAuth } from '../contexts/AuthContext';
import { useUpgradeModal } from '../contexts/UpgradeModalContext';
import { getTierFeatures } from '../types/pricing';

interface VoiceCompanionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stepContext?: string;
}

const VoiceCompanionDrawer: React.FC<VoiceCompanionDrawerProps> = ({ isOpen, onClose, stepContext }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<{ text: string; isUser: boolean }[]>([]);
  const [status, setStatus] = useState('Standby');
  const sessionRef = useRef<{ close: () => void } | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { openUpgradeModal } = useUpgradeModal();
  const userTier = user?.tier || 'free';
  const canUseLiveVoice = getTierFeatures(userTier).canUseLiveVoiceCompanion;

  const scrollToBottom = () => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startSession = async () => {
    if (!user) return;
    if (!canUseLiveVoice) {
      openUpgradeModal('Guided Voice Prayer', 'max');
      return;
    }
    setIsActive(true);
    setStatus('Connecting…');
    try {
      const session = await connectToSentientGuide({
        onAudioData: () => {},
        onTranscription: (text: string, isUser: boolean) => {
          setTranscript(prev => {
            const next = [...prev.slice(-9), { text, isUser }];
            setTimeout(scrollToBottom, 50);
            return next;
          });
        },
        onError: (err: string) => setStatus(err),
      });
      sessionRef.current = session;
      setStatus('Listening…');
    } catch {
      setStatus('Connection failed — try again');
      setIsActive(false);
    }
  };

  const stopSession = () => {
    sessionRef.current?.close();
    sessionRef.current = null;
    setIsActive(false);
    setStatus('Standby');
  };

  const handleClose = () => {
    if (isActive) stopSession();
    setTranscript([]);
    setStatus('Standby');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleClose}
            aria-hidden
          />

          {/* Drawer panel */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-brand-primary border-t border-brand-border shadow-2xl overflow-hidden"
            style={{ maxHeight: '82dvh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 38 }}
          >
            {/* Ambient glow */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-15"
              aria-hidden
              style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgb(242 125 38) 0%, transparent 70%)' }}
            />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-3">
              <div>
                <p style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--crimson, #8E1B1B)' }}>Kai — Prayer Companion</p>
                {stepContext && (
                  <p style={{ fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)', fontSize: '14px', lineHeight: 1.5, color: 'var(--fg-3, #8A7A6A)', marginTop: '0.125rem' }}>Praying through: {stepContext}</p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-brand-secondary text-brand-text-secondary hover:text-brand-text-primary transition-colors"
                aria-label="Close prayer companion"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="relative z-10 px-6 pb-8 overflow-y-auto" style={{ maxHeight: 'calc(82dvh - 80px)' }}>
              {!user ? (
                /* Not signed in */
                <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-brand-secondary flex items-center justify-center">
                    <MicrophoneIcon className="w-7 h-7 text-brand-text-secondary" />
                  </div>
                  <p className="text-brand-text-secondary text-sm max-w-xs">
                    Sign in to access your voice prayer companion.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  {/* Orb */}
                  <div className={`relative flex items-center justify-center transition-all duration-700 ${isActive ? 'scale-110' : 'scale-100'}`}>
                    <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-700 ${isActive ? 'bg-brand-accent shadow-[0_0_60px_rgba(242,125,38,0.45)]' : 'bg-brand-secondary'}`}>
                      <SoundWaveIcon className={`w-12 h-12 transition-colors ${isActive ? 'text-white' : 'text-brand-text-secondary'}`} />
                    </div>
                    {isActive && (
                      <>
                        <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping" />
                        <div className="absolute -inset-6 rounded-full border border-brand-accent/20 animate-ping" style={{ animationDelay: '0.5s' }} />
                      </>
                    )}
                  </div>

                  {/* Status */}
                  <motion.p
                    key={status}
                    className={`text-sm font-black uppercase tracking-[0.15em] ${isActive ? 'text-brand-accent' : 'text-brand-text-secondary'}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {status}
                  </motion.p>

                  {/* Start / Stop button */}
                  {!isActive ? (
                    <motion.button
                      onClick={startSession}
                      className="px-8 py-3 bg-brand-accent text-white rounded-full font-bold flex items-center gap-2 shadow-lg hover:bg-opacity-90 transition-opacity"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <MicrophoneIcon className="w-4 h-4" />
                      {canUseLiveVoice ? 'Begin Prayer' : 'Upgrade to Pray Aloud'}
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={stopSession}
                      className="px-8 py-3 bg-status-error text-white rounded-full font-bold flex items-center gap-2 shadow-lg hover:bg-opacity-90 transition-opacity"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <StopIcon className="w-4 h-4" />
                      End Session
                    </motion.button>
                  )}

                  {/* Transcript */}
                  {transcript.length > 0 && (
                    <div className="w-full space-y-2 max-h-48 overflow-y-auto pr-1">
                      <AnimatePresence initial={false}>
                        {transcript.map((t, i) => (
                          <motion.div
                            key={i}
                            className={`flex ${t.isUser ? 'justify-end' : 'justify-start'}`}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className={`max-w-[80%] px-3 py-2 rounded-2xl leading-relaxed ${
                              t.isUser
                                ? 'bg-brand-accent/20 text-brand-text-primary rounded-tr-sm'
                                : 'bg-brand-secondary text-brand-accent font-semibold rounded-tl-sm'
                            }`} style={{ fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)', fontSize: '15px' }}>
                              {!t.isUser && (
                                <span style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '9px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(142,27,27,0.7)', display: 'block', marginBottom: '0.125rem' }}>Kai</span>
                              )}
                              {t.text}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <div ref={transcriptEndRef} />
                    </div>
                  )}

                  {transcript.length === 0 && isActive && (
                    <p className="text-xs text-brand-text-secondary/60 animate-pulse">Kai is listening…</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VoiceCompanionDrawer;
