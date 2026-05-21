import React, { useState, useRef, useEffect } from 'react';
import Card from '../components/Card';
import { SparklesIcon, SoundWaveIcon, PlayIcon, PauseIcon, SpinnerIcon } from '../components/icons';
import type { Mood } from '../types';
import { getAtmosphericMusic } from '../services/musicService';

const moodConfigs: { name: Mood; className: string; }[] = [
  { name: 'Reflective', className: 'bg-primary-blue' },
  { name: 'Joyful', className: 'bg-accent-gold' },
  { name: 'Hopeful', className: 'bg-status-success' },
  { name: 'Courageous', className: 'bg-secondary-purple' },
];

import { useNotifications } from '../contexts/NotificationContext';

const AtmosphericMusicPage: React.FC = () => {
    const { notify } = useNotifications();
    const [activeMood, setActiveMood] = useState<Mood | null>(null);
    const [currentTrack, setCurrentTrack] = useState<{ title: string; url: string } | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => {
            setIsPlaying(false);
            // Optional: loop the music
            if(audio) {
                audio.currentTime = 0;
                audio.play();
            }
        };

        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const handleMoodSelect = async (mood: Mood) => {
        setIsLoading(true);
        setActiveMood(mood);
        if (audioRef.current) {
            audioRef.current.pause();
        }

        try {
            const track = await getAtmosphericMusic(mood);
            setCurrentTrack(track);
            if (audioRef.current) {
                const audio = audioRef.current;
                const handleCanPlay = () => {
                    const playPromise = audio.play();
                    if(playPromise !== undefined) {
                        playPromise.catch(() => {
                            // Autoplay blocked by browser — user interaction required
                        });
                    }
                };
                audio.addEventListener('canplay', handleCanPlay, { once: true });
                audio.src = track.url;
            }
        } catch {
            notify("Could not load atmospheric music.", "error");
        } finally {
            setIsLoading(false);
        }
    };
    
    const togglePlayPause = () => {
        if(audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
        }
    };

    return (
        <div>
            <audio ref={audioRef} />
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-3">Sanctuary</p>
              <h1 className="text-4xl font-black text-brand-text-primary mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                Atmospheric Prayer Music
              </h1>
              <p className="text-lg text-brand-text-secondary">
                Choose a mood and let the music create a space for focus, reflection, or quiet prayer.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
                <Card>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-brand-text-primary mb-2 flex items-center justify-center">
                            <SoundWaveIcon className="w-6 h-6 mr-3 text-brand-accent"/>
                            Set Your Mood
                        </h2>
                        <p className="text-brand-text-secondary max-w-2xl mx-auto mb-6">
                            Select a mood — the music will carry you into a space of quiet focus.
                        </p>
                        
                        <div className="flex flex-wrap justify-center gap-4 mb-8">
                            {moodConfigs.map(mood => (
                                <button
                                    key={mood.name}
                                    onClick={() => handleMoodSelect(mood.name)}
                                    className={`px-6 py-2 rounded-lg font-semibold shadow-md transition-all transform hover:scale-105 border-2 ${
                                        activeMood === mood.name
                                        ? `${mood.className} text-white border-transparent`
                                        : 'bg-brand-secondary border-brand-border text-brand-text-primary'
                                    }`}
                                >
                                    {mood.name}
                                </button>
                            ))}
                        </div>

                        {/* Player UI */}
                        {activeMood && (
                            <div className="p-4 bg-brand-secondary/50 rounded-lg animate-fade-in-up" style={{ animationDuration: '0.5s' }}>
                                <div className="flex items-center justify-between">
                                    <div className="text-left">
                                        <p className="text-xs text-brand-text-secondary">NOW PLAYING</p>
                                        <p className="font-semibold text-brand-text-primary">
                                            {isLoading ? 'Loading...' : currentTrack?.title}
                                        </p>
                                    </div>
                                    <button onClick={togglePlayPause} disabled={isLoading} className="w-14 h-14 bg-brand-accent rounded-full flex items-center justify-center text-white disabled:bg-opacity-50">
                                        {isLoading ? <SpinnerIcon className="w-7 h-7"/> : isPlaying ? <PauseIcon className="w-7 h-7" /> : <PlayIcon className="w-7 h-7" />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

            </div>
        </div>
    );
};

export default AtmosphericMusicPage;