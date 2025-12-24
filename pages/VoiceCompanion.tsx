
import React, { useState, useEffect, useRef } from 'react';
import Card from '../components/Card';
import { SoundWaveIcon, MicrophoneIcon, StopIcon, SparklesIcon } from '../components/icons';
import { connectToSentientGuide } from '../services/liveService';

const VoiceCompanion: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<{text: string, isUser: boolean}[]>([]);
  const [status, setStatus] = useState('Standby');
  const sessionRef = useRef<any>(null);

  const startSession = async () => {
    setIsActive(true);
    setStatus('Connecting...');
    try {
      const session = await connectToSentientGuide({
        onAudioData: () => {},
        onTranscription: (text, isUser) => {
          setTranscript(prev => [...prev.slice(-10), { text, isUser }]);
        },
        onError: (err) => setStatus(err),
      });
      sessionRef.current = session;
      setStatus('Listening...');
    } catch (e) {
      setStatus('Connection Failed');
      setIsActive(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) sessionRef.current.close();
    setIsActive(false);
    setStatus('Standby');
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-10rem)] flex flex-col">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-brand-text-primary mb-2 flex items-center">
          <SparklesIcon className="w-10 h-10 mr-4 text-brand-accent"/>
          Sentient Guide: Kai
        </h1>
        <p className="text-lg text-brand-text-secondary">Phase 5: Experience real-time, empathetic spiritual companionship.</p>
      </div>

      <Card className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <div className={`w-64 h-64 rounded-full flex items-center justify-center transition-all duration-1000 ${isActive ? 'bg-brand-accent/20 scale-110 shadow-[0_0_100px_rgba(var(--color-primary-blue),0.3)]' : 'bg-brand-secondary'}`}>
            <div className={`w-48 h-48 rounded-full bg-brand-accent flex items-center justify-center relative ${isActive ? 'animate-pulse' : ''}`}>
                <SoundWaveIcon className="w-24 h-24 text-white opacity-80" />
                {isActive && (
                    <>
                        <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>
                        <div className="absolute -inset-8 rounded-full border border-brand-accent/20 animate-ping [animation-delay:0.5s]"></div>
                    </>
                )}
            </div>
        </div>

        <div className="mt-12 text-center z-10">
            <p className={`text-2xl font-black uppercase tracking-[0.2em] ${isActive ? 'text-brand-accent' : 'text-brand-text-secondary'}`}>
                {status}
            </p>
            {!isActive ? (
                <button 
                    onClick={startSession}
                    className="mt-6 px-10 py-4 bg-brand-accent text-white rounded-full font-bold text-xl shadow-2xl hover:scale-105 transition-transform flex items-center gap-3"
                >
                    <MicrophoneIcon className="w-6 h-6"/> Begin Journey
                </button>
            ) : (
                <button 
                    onClick={stopSession}
                    className="mt-6 px-10 py-4 bg-status-error text-white rounded-full font-bold text-xl shadow-2xl hover:scale-105 transition-transform flex items-center gap-3"
                >
                    <StopIcon className="w-6 h-6"/> End Session
                </button>
            )}
        </div>

        {/* Live Transcription Overlay */}
        <div className="absolute bottom-8 left-8 right-8 max-h-32 overflow-y-auto pointer-events-none opacity-60">
            {transcript.map((t, i) => (
                <p key={i} className={`text-sm mb-1 ${t.isUser ? 'text-brand-text-secondary text-right' : 'text-brand-accent font-bold'}`}>
                    {t.text}
                </p>
            ))}
        </div>
      </Card>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-brand-accent/5">
            <p className="text-xs font-bold text-brand-accent uppercase mb-1">Affordability</p>
            <p className="text-sm text-brand-text-primary">Powered by Flash-Native models for 10x lower latency at 5x lower cost.</p>
        </Card>
        <Card className="p-4 bg-brand-accent/5">
            <p className="text-xs font-bold text-brand-accent uppercase mb-1">Sentience</p>
            <p className="text-sm text-brand-text-primary">Kai listens for emotional timber, not just keywords.</p>
        </Card>
        <Card className="p-4 bg-brand-accent/5">
            <p className="text-xs font-bold text-brand-accent uppercase mb-1">Privacy</p>
            <p className="text-sm text-brand-text-primary">Real-time processing with zero long-term audio storage.</p>
        </Card>
      </div>
    </div>
  );
};

export default VoiceCompanion;
