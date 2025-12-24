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

const AtmosphericMusicPage: React.FC = () => {
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
                audioRef.current.src = track.url;
                audioRef.current.load();
                const playPromise = audioRef.current.play();
                if(playPromise !== undefined) {
                    playPromise.catch(error => console.error("Audio playback failed:", error));
                }
            }
        } catch (error) {
            console.error("Failed to get music:", error);
            alert("Could not load atmospheric music.");
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
            <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Atmospheric AI Music</h1>
            <p className="text-lg text-brand-text-secondary mb-8">
                This prototype demonstrates how AI-generated music (from Google's Lyria) can create an immersive spiritual atmosphere.
            </p>

            <div className="max-w-2xl mx-auto">
                <Card>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-brand-text-primary mb-2 flex items-center justify-center">
                            <SoundWaveIcon className="w-6 h-6 mr-3 text-brand-accent"/>
                            Simulate a Devotional Mood
                        </h2>
                        <p className="text-brand-text-secondary max-w-2xl mx-auto mb-6">
                            Select a mood below to hear the corresponding ambient music track.
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

                <Card className="mt-8">
                    <h3 className="text-xl font-bold text-brand-text-primary mb-2 flex items-center">
                        <SparklesIcon className="w-5 h-5 mr-2 text-brand-accent"/>
                        The Vision: Google Lyria
                    </h3>
                    <p className="text-brand-text-secondary">
                        In the final app, this won't be pre-selected music. Instead, we'll use Google's Lyria, a generative music model. After analyzing the devotional's mood, a Genkit flow will instruct Lyria to create a unique, instrumental audio stream in real-time that perfectly matches the tone of the message, ensuring a deeply personal and never-repeated immersive experience for the user.
                    </p>
                </Card>
            </div>
        </div>
    );
};

export default AtmosphericMusicPage;