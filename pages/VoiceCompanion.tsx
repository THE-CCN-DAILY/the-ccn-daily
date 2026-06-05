import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import Card from '../components/Card';
import { Mic, Send } from 'lucide-react';
import { SoundWaveIcon, MicrophoneIcon, StopIcon } from '../components/icons';
import { connectToPrayerCompanion, type PrayerCompanionSession } from '../services/liveService';
import { useAuth } from '../contexts/AuthContext';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const VoiceCompanion: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<{ text: string; isUser: boolean }[]>([]);
  const [status, setStatus] = useState('Ready');
  const [typedPrayer, setTypedPrayer] = useState('');
  const sessionRef = useRef<PrayerCompanionSession | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollTranscriptToBottom = () => transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });

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
          const next = [...prev.slice(-20), { text, isUser }];
          setTimeout(scrollTranscriptToBottom, 50);
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

  return (
    <div className="mx-auto max-w-4xl pb-20">
      <motion.div className="mb-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-accent">Pray</p>
        <h1 className="mb-2 flex items-center gap-3 text-4xl font-black text-brand-text-primary" style={{ fontFamily: 'var(--font-display)' }}>
          <Mic className="h-9 w-9 text-brand-accent" />
          Kai Prayer Companion
        </h1>
        <p className="text-brand-text-secondary">
          A calm guided prayer space with spoken prompts, browser voice capture where supported, and type-to-pray fallback everywhere.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card className="relative flex flex-col items-center justify-center overflow-hidden py-16">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-48 opacity-20" aria-hidden style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgb(242 125 38) 0%, transparent 70%)' }} />
            <div className={`relative flex items-center justify-center transition-all duration-700 ${isActive ? 'scale-110' : 'scale-100'}`}>
              <div className={`flex h-48 w-48 items-center justify-center rounded-full transition-all duration-700 ${isActive ? 'bg-brand-accent shadow-[0_0_80px_rgba(242,125,38,0.4)]' : 'bg-brand-secondary'}`}>
                <SoundWaveIcon className={`h-20 w-20 ${isActive ? 'text-white' : 'text-brand-text-secondary'}`} />
              </div>
              {isActive && (
                <>
                  <div className="absolute inset-0 animate-ping rounded-full border-4 border-white/20" />
                  <div className="absolute -inset-8 animate-ping rounded-full border border-brand-accent/20" style={{ animationDelay: '0.5s' }} />
                </>
              )}
            </div>

            <p className={`mt-8 text-center text-sm font-black uppercase tracking-[0.15em] ${isActive ? 'text-brand-accent' : 'text-brand-text-secondary'}`}>{status}</p>

            <div className="mt-6">
              {!isActive ? (
                <button onClick={startSession} className="flex items-center gap-3 rounded-full bg-brand-accent px-10 py-4 text-lg font-bold text-white shadow-2xl">
                  <MicrophoneIcon className="h-5 w-5" />
                  Begin Session
                </button>
              ) : (
                <button onClick={stopSession} className="flex items-center gap-3 rounded-full bg-status-error px-10 py-4 text-lg font-bold text-white shadow-2xl">
                  <StopIcon className="h-5 w-5" />
                  End Session
                </button>
              )}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card className="flex min-h-[320px] flex-1 flex-col">
            <h3 className="mb-4 flex-shrink-0 text-sm font-bold uppercase tracking-widest text-brand-text-secondary">Prayer Thread</h3>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {transcript.length === 0 ? (
                <p className="pt-8 text-center text-sm text-brand-text-secondary/60">{isActive ? 'Kai is listening...' : 'Start a session to begin'}</p>
              ) : transcript.map((item, index) => (
                <div key={`${item.text}-${index}`} className={`flex ${item.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${item.isUser ? 'rounded-tr-sm bg-brand-accent/20 text-brand-text-primary' : 'rounded-tl-sm bg-brand-secondary text-brand-accent'}`}>
                    {!item.isUser && <span className="mb-0.5 block text-[10px] font-black uppercase tracking-widest text-brand-accent/70">Kai</span>}
                    {item.text}
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
            <div className="mt-4 flex gap-2">
              <input
                value={typedPrayer}
                onChange={event => setTypedPrayer(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') submitTypedPrayer();
                }}
                className="min-w-0 flex-1 rounded-xl border border-brand-border bg-brand-secondary px-3 py-2 text-sm text-brand-text-primary outline-none focus:ring-2 focus:ring-brand-accent"
                placeholder="Type a prayer"
              />
              <button onClick={submitTypedPrayer} className="rounded-xl bg-brand-accent px-4 py-2 text-white" aria-label="Send prayer">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VoiceCompanion;
