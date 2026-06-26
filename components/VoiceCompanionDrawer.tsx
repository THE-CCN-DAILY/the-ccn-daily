import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SoundWaveIcon, MicrophoneIcon, StopIcon } from './icons';
import { connectToPrayerCompanion, type PrayerCompanionSession } from '../services/liveService';
import { useAuth } from '../contexts/AuthContext';

interface VoiceCompanionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stepContext?: string;
}

const VoiceCompanionDrawer: React.FC<VoiceCompanionDrawerProps> = ({ isOpen, onClose, stepContext }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<{ text: string; isUser: boolean }[]>([]);
  const [status, setStatus] = useState('Ready');
  const [typedPrayer, setTypedPrayer] = useState('');
  const sessionRef = useRef<PrayerCompanionSession | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const startSession = async () => {
    if (!user) {
      setStatus('Sign in to begin a guided prayer session.');
      return;
    }
    setIsActive(true);
    setStatus('Listening');
    const session = await connectToPrayerCompanion({
      onAudioData: () => {},
      onTranscription: (text, isUser) => {
        setTranscript(prev => {
          const next = [...prev.slice(-11), { text, isUser }];
          setTimeout(scrollToBottom, 50);
          return next;
        });
      },
      onError: msg => setStatus(msg),
    });
    sessionRef.current = session;
    if (!session.isSpeechSupported) setStatus('Type-to-pray ready');
  };

  const stopSession = () => {
    sessionRef.current?.close();
    sessionRef.current = null;
    setIsActive(false);
    setStatus('Ready');
  };

  const submitTypedPrayer = () => {
    if (!typedPrayer.trim()) return;
    if (!sessionRef.current) void startSession().then(() => {
      sessionRef.current?.sendText(typedPrayer);
      setTypedPrayer('');
    });
    else {
      sessionRef.current.sendText(typedPrayer);
      setTypedPrayer('');
    }
  };

  const handleClose = () => {
    stopSession();
    setTranscript([]);
    setTypedPrayer('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            aria-hidden
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 overflow-hidden rounded-t-3xl border-t border-brand-border bg-brand-primary shadow-2xl"
            style={{ maxHeight: '84dvh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 38 }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-15" aria-hidden style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgb(242 125 38) 0%, transparent 70%)' }} />
            <div className="relative z-10 flex items-center justify-between px-6 pb-3 pt-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-accent">Prayer Companion</p>
                {stepContext && <p className="mt-0.5 text-sm text-brand-text-secondary">Praying through: {stepContext}</p>}
              </div>
              <button onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-secondary text-brand-text-secondary hover:text-brand-text-primary" aria-label="Close prayer companion">
                <span aria-hidden>×</span>
              </button>
            </div>

            <div className="relative z-10 overflow-y-auto px-6 pb-8" style={{ maxHeight: 'calc(84dvh - 80px)' }}>
              <div className="flex flex-col items-center gap-5">
                <div className={`relative flex items-center justify-center transition-all duration-700 ${isActive ? 'scale-105' : 'scale-100'}`}>
                  <div className={`flex h-28 w-28 items-center justify-center rounded-full transition-all duration-700 ${isActive ? 'bg-brand-accent shadow-[0_0_60px_rgba(242,125,38,0.45)]' : 'bg-brand-secondary'}`}>
                    <SoundWaveIcon className={`h-12 w-12 ${isActive ? 'text-white' : 'text-brand-text-secondary'}`} />
                  </div>
                  {isActive && <div className="absolute inset-0 animate-ping rounded-full border-4 border-white/20" />}
                </div>

                <p className={`text-center text-xs font-black uppercase tracking-[0.15em] ${isActive ? 'text-brand-accent' : 'text-brand-text-secondary'}`}>{status}</p>

                {!isActive ? (
                  <button onClick={startSession} className="flex items-center gap-2 rounded-full bg-brand-accent px-8 py-3 font-bold text-white shadow-lg">
                    <MicrophoneIcon className="h-4 w-4" />
                    Begin Prayer
                  </button>
                ) : (
                  <button onClick={stopSession} className="flex items-center gap-2 rounded-full bg-status-error px-8 py-3 font-bold text-white shadow-lg">
                    <StopIcon className="h-4 w-4" />
                    End Session
                  </button>
                )}

                <div className="w-full space-y-2">
                  {transcript.map((item, index) => (
                    <div key={`${item.text}-${index}`} className={`flex ${item.isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${item.isUser ? 'rounded-tr-sm bg-brand-accent/20 text-brand-text-primary' : 'rounded-tl-sm bg-brand-secondary text-brand-accent'}`}>
                        {!item.isUser && <span className="mb-1 block text-[9px] font-black uppercase tracking-widest text-brand-accent/70">Companion</span>}
                        {item.text}
                      </div>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>

                <div className="flex w-full gap-2">
                  <input
                    value={typedPrayer}
                    onChange={event => setTypedPrayer(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === 'Enter') submitTypedPrayer();
                    }}
                    className="min-w-0 flex-1 rounded-xl border border-brand-border bg-brand-secondary px-3 py-2 text-sm text-brand-text-primary outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="Type a prayer if speaking is not available"
                  />
                  <button onClick={submitTypedPrayer} className="rounded-xl bg-brand-accent px-4 py-2 text-sm font-bold text-white">Send</button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VoiceCompanionDrawer;
