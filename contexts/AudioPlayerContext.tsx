import React, { createContext, useState, useContext, useEffect, useMemo, useRef } from 'react';
import type { PodcastEpisode } from '../types';
import { useGamification } from './GamificationContext';

interface AudioPlayerContextType {
  currentTrack: PodcastEpisode | null;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number; // 0-100
  duration: number; // in seconds
  isDetailedPlayerOpen: boolean;
  playbackRate: number;
  sleepTimerRemaining: number | null; // in seconds
  playTrack: (track: PodcastEpisode) => void;
  togglePlayPause: () => void;
  seek: (percentage: number) => void;
  skip: (seconds: number) => void;
  openDetailedPlayer: () => void;
  closeDetailedPlayer: () => void;
  closePlayer: () => void;
  setPlaybackRate: (rate: number) => void;
  setSleepTimer: (duration: number | null | 'episodeEnd') => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<PodcastEpisode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDetailedPlayerOpen, setDetailedPlayerOpen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const sleepTimerId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepTimerIntervalId = useRef<ReturnType<typeof setInterval> | null>(null);
  const { dispatchGamificationEvent } = useGamification();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      // Award points for finishing the podcast
      dispatchGamificationEvent('e3');
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    const handleError = () => {
      const err = audio.error;
      if (err && err.code === 4) {
        setIsLoading(false);
        setIsPlaying(false);
        return;
      }
      
      if(err) {
          console.error(`Error loading audio source. Code: ${err.code}, Message: ${err.message}`);
      }
      setIsLoading(false);
      setIsPlaying(false);
    };


    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, [currentTrack, dispatchGamificationEvent]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (sleepTimerIntervalId.current) {
        clearInterval(sleepTimerIntervalId.current);
        sleepTimerIntervalId.current = null;
    }
    
    if (sleepTimerRemaining !== null && sleepTimerRemaining > 0) {
        sleepTimerIntervalId.current = setInterval(() => {
            setSleepTimerRemaining(prev => (prev !== null && prev > 1) ? prev - 1 : 0);
        }, 1000);
    } else if (sleepTimerRemaining === 0) {
        if (audioRef.current) audioRef.current.pause();
        setSleepTimerRemaining(null);
    }

    return () => {
        if (sleepTimerIntervalId.current) clearInterval(sleepTimerIntervalId.current);
    };
}, [sleepTimerRemaining]);

  const clearSleepTimer = () => {
    if (sleepTimerId.current) clearTimeout(sleepTimerId.current);
    if (sleepTimerIntervalId.current) clearInterval(sleepTimerIntervalId.current);
    sleepTimerId.current = null;
    sleepTimerIntervalId.current = null;
    setSleepTimerRemaining(null);
  };
  
  const setSleepTimer = (duration: number | null | 'episodeEnd') => {
    clearSleepTimer();
    if (duration === null) return;
    
    let durationInSeconds: number;
    if (duration === 'episodeEnd') {
        if (audioRef.current && isFinite(audioRef.current.duration)) {
            durationInSeconds = audioRef.current.duration - audioRef.current.currentTime;
        } else {
            return;
        }
    } else {
        durationInSeconds = duration;
    }

    if (durationInSeconds <= 0) return;
    
    setSleepTimerRemaining(Math.round(durationInSeconds));

    sleepTimerId.current = setTimeout(() => {
        if (audioRef.current) audioRef.current.pause();
        clearSleepTimer();
    }, durationInSeconds * 1000);
  };


  const playTrack = (track: PodcastEpisode) => {
    const audio = audioRef.current;
    if (!audio) return;

    clearSleepTimer();
    setCurrentTrack(track);
    setDetailedPlayerOpen(true);
    const handleCanPlay = () => {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
        }).catch(error => {
          if (error.name !== 'AbortError') {
            console.error(`Audio playback failed: ${error.name} - ${error.message}`);
          }
        }).finally(() => {
            setIsLoading(false);
        });
      } else {
        setIsLoading(false);
        setIsPlaying(true);
      }
    };

    setIsLoading(true);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);

    audio.addEventListener('canplay', handleCanPlay, { once: true });
    audio.src = track.audioUrl;
  };

  const togglePlayPause = () => {
    if (audioRef.current && !isLoading) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        if (!currentTrack || !audioRef.current.src) return;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error(`Audio playback failed: ${error.name} - ${error.message}`);
            setIsPlaying(false);
          });
        }
      }
    }
  };
  
  const seek = (percentage: number) => {
    if (audioRef.current && isFinite(duration) && !isLoading) {
        audioRef.current.currentTime = (percentage / 100) * duration;
    }
  };
  
  const skip = (seconds: number) => {
    if(audioRef.current && !isLoading) {
        audioRef.current.currentTime += seconds;
    }
  }

  const openDetailedPlayer = () => {
    if (currentTrack) {
        setDetailedPlayerOpen(true);
    }
  };
  const closeDetailedPlayer = () => setDetailedPlayerOpen(false);

  const closePlayer = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
    }
    clearSleepTimer();
    setCurrentTrack(null);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    setDetailedPlayerOpen(false);
    setIsLoading(false);
  };
  
  const value = useMemo(() => ({
    currentTrack,
    isPlaying,
    isLoading,
    progress,
    duration,
    isDetailedPlayerOpen,
    playbackRate,
    sleepTimerRemaining,
    playTrack,
    togglePlayPause,
    seek,
    skip,
    openDetailedPlayer,
    closeDetailedPlayer,
    closePlayer,
    setPlaybackRate,
    setSleepTimer,
  }), [currentTrack, isPlaying, isLoading, progress, duration, isDetailedPlayerOpen, playbackRate, sleepTimerRemaining]);

  return (
    <AudioPlayerContext.Provider value={value}>
      <audio ref={audioRef} />
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = (): AudioPlayerContextType => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};