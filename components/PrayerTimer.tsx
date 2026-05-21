
import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, CheckIcon, SoundWaveIcon, PlusCircleIcon } from './icons';

interface PrayerTimerProps {
    duration: number; // in seconds
    onComplete: () => void;
}

const PrayerTimer: React.FC<PrayerTimerProps> = ({ duration, onComplete }) => {
    const [isActive, setIsActive] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(duration);
    const [isMusicOn, setIsMusicOn] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isFinished = secondsLeft === 0;

    useEffect(() => {
        let interval: any = null;
        if (isActive && secondsLeft > 0) {
            interval = setInterval(() => {
                setSecondsLeft(prev => prev - 1);
            }, 1000);
        } else if (secondsLeft === 0 && isActive) {
            setIsActive(false);
            onComplete();
            if (audioRef.current) audioRef.current.pause();
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, secondsLeft, onComplete]);

    const startTimer = () => {
        setSecondsLeft(duration);
        setIsActive(true);
        if (isMusicOn && audioRef.current) {
            audioRef.current.play().catch(() => { /* audio play blocked by browser */ });
        }
    };

    const extendTime = () => {
        setSecondsLeft(prev => prev + 60);
        if (!isActive) {
            setIsActive(true);
            if (isMusicOn && audioRef.current) audioRef.current.play();
        }
    };

    const progress = ((duration - secondsLeft) / duration) * 100;
    const radius = 55;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-brand-secondary/30 backdrop-blur-xl border border-brand-accent/20 rounded-3xl relative overflow-hidden">
            {/* Hidden Audio for Background Music */}
            <audio 
                ref={audioRef} 
                src="https://storage.googleapis.com/media-session/sintel/things-can-get-worse.mp3" 
                loop 
            />

            {/* Breathing Ambient Background */}
            <div className={`absolute inset-0 bg-brand-accent/5 transition-all duration-[4000ms] ease-in-out ${isActive ? 'animate-pulse scale-110' : 'scale-100'}`} />

            {isFinished ? (
                <div className="text-center z-10 animate-fade-in-up">
                    <CheckIcon className="w-16 h-16 text-status-success mx-auto mb-4"/>
                    <h3 className="text-xl font-bold text-brand-text-primary">Sanctuary Time Complete</h3>
                    <p className="text-brand-text-secondary mb-6">Your heart is open. Proceed when ready.</p>
                    <button 
                        onClick={extendTime} 
                        className="px-6 py-2 bg-brand-secondary text-brand-text-primary rounded-full text-sm font-bold border border-brand-border flex items-center mx-auto gap-2 hover:bg-brand-accent/10"
                    >
                        <PlusCircleIcon className="w-4 h-4"/> Linger 1 More Minute
                    </button>
                </div>
            ) : !isActive ? (
                <div className="text-center z-10">
                    <p className="text-lg font-bold text-brand-text-primary mb-6">Enter your focused prayer sanctuary</p>
                    <div className="flex gap-4 items-center justify-center">
                        <button 
                            onClick={startTimer} 
                            className="flex items-center gap-3 px-8 py-4 rounded-full bg-brand-accent text-white font-black text-xl shadow-xl hover:scale-105 transition-transform"
                        >
                            <PlayIcon className="w-6 h-6"/> Begin {formatTime(duration)}
                        </button>
                        <button 
                            onClick={() => setIsMusicOn(!isMusicOn)} 
                            className={`p-4 rounded-full border transition-colors ${isMusicOn ? 'bg-brand-accent/20 border-brand-accent text-brand-accent' : 'bg-brand-secondary border-brand-border text-brand-text-secondary'}`}
                            title="Toggle Ambient Music"
                        >
                            <SoundWaveIcon className="w-6 h-6"/>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center z-10">
                    <div className="relative w-48 h-48">
                        {/* Static Track */}
                        <svg className="w-full h-full" viewBox="0 0 120 120">
                            <circle
                                className="text-brand-border/30"
                                strokeWidth="4"
                                stroke="currentColor"
                                fill="transparent"
                                r={radius}
                                cx="60"
                                cy="60"
                            />
                            {/* Progress Fill */}
                            <circle
                                className="text-brand-accent"
                                strokeWidth="6"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                r={radius}
                                cx="60"
                                cy="60"
                                transform="rotate(-90 60 60)"
                                style={{ transition: 'stroke-dashoffset 1s linear' }}
                            />
                            {/* Inner Breathing Circle */}
                            <circle
                                className="text-brand-accent/20 animate-pulse"
                                r={radius - 10}
                                cx="60"
                                cy="60"
                                fill="currentColor"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black font-mono text-brand-text-primary">
                                {formatTime(secondsLeft)}
                            </span>
                            <span className="text-[10px] uppercase tracking-widest font-bold text-brand-text-secondary">Sanctuary</span>
                        </div>
                    </div>
                    
                    <div className="mt-8 flex gap-4 animate-fade-in">
                        <button 
                            onClick={extendTime}
                            className="px-4 py-2 bg-brand-secondary border border-brand-border rounded-full text-xs font-bold text-brand-text-secondary flex items-center gap-2 hover:bg-brand-accent/10"
                        >
                            <PlusCircleIcon className="w-4 h-4 text-brand-accent"/> Linger
                        </button>
                        <button 
                            onClick={() => setIsActive(false)}
                            className="px-4 py-2 text-xs font-bold text-status-error hover:underline"
                        >
                            Pause
                        </button>
                    </div>
                    
                    <p className="text-sm text-brand-text-secondary mt-6 italic">Focus on His presence...</p>
                </div>
            )}
        </div>
    );
};

export default PrayerTimer;
