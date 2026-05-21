import React, { useState, useEffect, useRef } from 'react';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { ChevronLeftIcon, ShareIcon, DownloadIcon, SkipBackIcon, SkipForwardIcon, PlayIcon, PauseIcon, SpinnerIcon, EllipsisHorizontalIcon, MoonIcon, CheckIcon, SparklesIcon, QueueListIcon, BookmarkSquareIcon, ChatBubbleLeftRightIcon } from '../icons';
import useMediaQuery from '../../hooks/useMediaQuery';
import CommentsSection from '../shared/CommentsSection';

const SeekBar: React.FC<{ progress: number, duration: number, onSeek: (percentage: number) => void, disabled: boolean }> = ({ progress, duration, onSeek, disabled }) => {
    const formatTime = (timeInSeconds: number) => {
        if (!isFinite(timeInSeconds)) return '0:00';
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const currentTime = formatTime(duration * (progress / 100));
    const totalTime = formatTime(duration);

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled) return;
        const bar = e.currentTarget;
        const rect = bar.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const percentage = (offsetX / rect.width) * 100;
        onSeek(Math.max(0, Math.min(100, percentage)));
    };

    return (
        <div className="w-full">
            <div 
                className={`h-1.5 w-full bg-white/20 rounded-full group ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
                onClick={handleSeek}
            >
                <div 
                    className="h-1.5 bg-brand-accent rounded-full relative" 
                    style={{ width: `${progress}%` }}
                >
                    <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full transition-opacity ${disabled ? '' : 'opacity-0 group-hover:opacity-100'}`}></div>
                </div>
            </div>
            <div className="flex justify-between text-xs text-white/70 mt-1">
                <span>{currentTime}</span>
                <span>{totalTime}</span>
            </div>
        </div>
    );
};

const OptionsMenu: React.FC<{
    onClose: () => void;
    playbackRate: number;
    setPlaybackRate: (rate: number) => void;
    sleepTimerRemaining: number | null;
    setSleepTimer: (duration: number | null | 'episodeEnd') => void;
}> = ({ onClose, playbackRate, setPlaybackRate, sleepTimerRemaining, setSleepTimer }) => {
    
    const playbackRates = [0.75, 1, 1.25, 1.5, 2];
    const timerOptions: { label: string; value: number | null | 'episodeEnd' }[] = [
        { label: 'Off', value: null },
        { label: '15 min', value: 15 * 60 },
        { label: '30 min', value: 30 * 60 },
        { label: 'End of Episode', value: 'episodeEnd' },
    ];

    const formatTimerLabel = (seconds: number | null) => {
        if (seconds === null) return 'Off';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center" onClick={onClose}>
            <div 
                className="bg-[#282828] rounded-xl shadow-lg w-full max-w-xs p-4 text-white animate-fade-in-up"
                onClick={e => e.stopPropagation()}
                style={{ animationDuration: '0.3s' }}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold">Player Options</h3>
                    <button onClick={onClose} className="p-1 text-2xl leading-none text-white/70 hover:text-white">&times;</button>
                </div>
                
                <div className="mb-4">
                    <p className="text-sm text-white/80 mb-2">Playback Speed</p>
                    <div className="flex justify-around bg-black/20 rounded-full p-1">
                        {playbackRates.map(rate => (
                            <button 
                                key={rate} 
                                onClick={() => setPlaybackRate(rate)}
                                className={`px-3 py-1 text-sm rounded-full transition-colors ${playbackRate === rate ? 'bg-brand-accent text-black font-semibold' : 'hover:bg-white/10'}`}
                            >
                                {rate}x
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-sm text-white/80 mb-2 flex items-center">
                        <MoonIcon className="w-4 h-4 mr-2"/>
                        Sleep Timer 
                        {sleepTimerRemaining !== null && <span className="ml-2 font-mono">({formatTimerLabel(sleepTimerRemaining)})</span>}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                         {timerOptions.map(opt => (
                            <button 
                                key={opt.label} 
                                onClick={() => { setSleepTimer(opt.value); onClose(); }}
                                className="p-2 text-sm bg-black/20 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DetailedPlayerModal: React.FC = () => {
    const { 
        currentTrack, isPlaying, progress, duration, togglePlayPause, closeDetailedPlayer, seek, skip, isLoading,
        playbackRate, setPlaybackRate, sleepTimerRemaining, setSleepTimer 
    } = useAudioPlayer();
    const { notify } = useNotifications();
    const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'chapters' | 'comments'>('summary');
    const [isOptionsOpen, setOptionsOpen] = useState(false);
    const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');
    const isMobileScreen = useMediaQuery('(max-width: 768px)');
    
    const activeLineRef = useRef<HTMLLIElement>(null);

    const currentTime = duration * (progress / 100);
    // FIX: Replace findLastIndex with a compatible method to support older JS targets.
    // `findLastIndex` is an ES2023 feature and may not be available in the project's configured environment.
    let activeTranscriptIndex = -1;
    if (currentTrack?.transcript) {
        for (let i = currentTrack.transcript.length - 1; i >= 0; i--) {
            if (currentTrack.transcript[i].time <= currentTime) {
                activeTranscriptIndex = i;
                break;
            }
        }
    }

    let activeChapterIndex = -1;
    if (currentTrack?.chapters) {
        for (let i = currentTrack.chapters.length - 1; i >= 0; i--) {
            if (currentTrack.chapters[i].time <= currentTime) {
                activeChapterIndex = i;
                break;
            }
        }
    }
    
     useEffect(() => {
        // When the track changes, reset the active tab to summary if available
        if (currentTrack) {
            setActiveTab(currentTrack.summary ? 'summary' : 'transcript');
        }
    }, [currentTrack]);


    useEffect(() => {
        if (activeLineRef.current) {
            activeLineRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [activeTranscriptIndex, activeTab]);

    const handleShare = async () => {
        if (!currentTrack) return;

        const shareData = {
            title: currentTrack.title,
            text: `Listen to "${currentTrack.title}" on THE CCN DAILY.`,
            url: new URL(window.location.pathname, window.location.origin).href,
        };
        
        if (isMobileScreen && navigator.share) {
            try {
                await navigator.share(shareData);
            } catch {
                // Share cancelled or unavailable
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareData.url);
                setShareStatus('copied');
                setTimeout(() => setShareStatus('idle'), 2000);
            } catch {
                notify("Failed to copy link.", "error");
            }
        }
    };
    
    const handleSeekToTime = (time: number) => {
        if (duration > 0) {
            const percentage = (time / duration) * 100;
            seek(percentage);
        }
    };

    if (!currentTrack) return null;

    const TabButton: React.FC<{ label: string, icon: React.FC<any>, name: typeof activeTab, disabled?: boolean }> = ({ label, icon: Icon, name, disabled }) => (
        <button
            onClick={() => !disabled && setActiveTab(name)}
            disabled={disabled}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors duration-200 ${
                activeTab === name
                ? 'text-brand-accent border-brand-accent'
                : 'text-white/60 border-transparent hover:text-white disabled:text-white/30 disabled:cursor-not-allowed'
            }`}
        >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </button>
    );
    
    const formatTime = (timeInSeconds: number) => {
        if (!isFinite(timeInSeconds)) return '0:00';
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };


    return (
        <div className="fixed inset-0 z-50 animate-fade-in-up overflow-hidden">
             <div 
                className="absolute inset-0 bg-cover bg-center filter blur-2xl scale-110 brightness-50"
                style={{ backgroundImage: `url(${currentTrack.coverArt})` }}
            />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <div className="relative z-10 h-full flex flex-col p-4 sm:p-6 text-white">
                {/* Header */}
                <header className="flex items-center justify-between flex-shrink-0">
                    <button onClick={closeDetailedPlayer} className="p-2 -ml-2 text-white/80 hover:text-white"><ChevronLeftIcon className="w-8 h-8" /></button>
                    <div className="text-center">
                        <p className="text-sm text-white/80">NOW PLAYING</p>
                        <h1 className="font-bold truncate max-w-[200px] sm:max-w-xs">{currentTrack.author}</h1>
                    </div>
                    <div className="flex items-center space-x-0">
                        <button onClick={handleShare} className="p-2 text-white/80 hover:text-white">
                            {shareStatus === 'copied' ? <CheckIcon className="w-6 h-6 text-green-400" /> : <ShareIcon className="w-6 h-6" />}
                        </button>
                        <button className="p-2 text-white/80 hover:text-white"><DownloadIcon className="w-6 h-6" /></button>
                        <button onClick={() => setOptionsOpen(true)} className="p-2 text-white/80 hover:text-white"><EllipsisHorizontalIcon className="w-6 h-6" /></button>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 flex flex-col my-4 min-h-0">
                    <div className="flex-shrink-0 flex justify-center px-4">
                        <img src={currentTrack.coverArt} alt={currentTrack.title} className="w-full max-w-xs rounded-lg shadow-2xl shadow-black/50 object-cover"/>
                    </div>
                    <div className="text-center my-4 flex-shrink-0">
                        <h2 className="text-xl sm:text-2xl font-bold">{currentTrack.title}</h2>
                        <p className="text-white/80 mt-1">{currentTrack.author}</p>
                    </div>

                    {/* Info Tabs */}
                    <div className="flex-1 min-h-0 flex flex-col bg-black/20 rounded-lg overflow-hidden">
                        <div className="flex items-center border-b border-white/10 flex-shrink-0">
                            <TabButton label="Summary" icon={SparklesIcon} name="summary" disabled={!currentTrack.summary} />
                            <TabButton label="Transcript" icon={QueueListIcon} name="transcript" disabled={!currentTrack.transcript || currentTrack.transcript.length === 0} />
                            <TabButton label="Chapters" icon={BookmarkSquareIcon} name="chapters" disabled={!currentTrack.chapters || currentTrack.chapters.length === 0} />
                            <TabButton label="Comments" icon={ChatBubbleLeftRightIcon} name="comments" />
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 text-sm">
                            {activeTab === 'summary' && currentTrack.summary && (
                                <div className="animate-fade-in-up" style={{animationDuration: '0.3s'}}>
                                    <p className="text-white/90 mb-4">{currentTrack.summary}</p>
                                    <h3 className="font-bold mb-2">Key Takeaways</h3>
                                    <ul className="space-y-2">
                                        {currentTrack.keyTakeaways?.map((item, index) => (
                                            <li key={index} className="flex items-start">
                                                <CheckIcon className="w-4 h-4 text-brand-accent mr-2 mt-0.5 flex-shrink-0"/>
                                                <span className="text-white/80">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                             {activeTab === 'transcript' && (
                                <ul className="space-y-3">
                                    {currentTrack.transcript?.map((line, index) => {
                                        const isActive = index === activeTranscriptIndex;
                                        return (
                                            <li
                                                key={`${line.time}-${index}`}
                                                ref={isActive ? activeLineRef : null}
                                                onClick={() => handleSeekToTime(line.time)}
                                                className={`cursor-pointer p-1 rounded transition-colors ${
                                                    isActive ? 'text-brand-accent font-semibold' : 'text-white/70 hover:text-white hover:bg-white/10'
                                                }`}
                                            >
                                                {line.text}
                                            </li>
                                        );
                                    })}
                                </ul>
                             )}
                             {activeTab === 'chapters' && (
                                <ul className="space-y-1">
                                    {currentTrack.chapters?.map((chapter, index) => {
                                        const isActive = index === activeChapterIndex;
                                        return (
                                            <li key={`${chapter.time}-${index}`}>
                                                <button
                                                    onClick={() => handleSeekToTime(chapter.time)}
                                                    className={`w-full text-left flex items-center justify-between p-3 rounded transition-colors ${
                                                        isActive ? 'bg-brand-accent/20 text-brand-accent font-semibold' : 'hover:bg-white/10'
                                                    }`}
                                                >
                                                    <span className="truncate">{chapter.title}</span>
                                                    <span className="font-mono text-xs text-white/60">{formatTime(chapter.time)}</span>
                                                </button>
                                            </li>
                                        )
                                    })}
                                </ul>
                             )}
                             {activeTab === 'comments' && (
                                <CommentsSection
                                    contentId={currentTrack.id.toString()}
                                    contentType="podcast"
                                    isPlayer={true}
                                />
                            )}
                        </div>
                    </div>
                </main>

                {/* Controls */}
                <footer className="flex-shrink-0 flex flex-col items-center w-full max-w-sm mx-auto">
                    <SeekBar progress={progress} duration={duration} onSeek={seek} disabled={isLoading} />
                    <div className="flex items-center justify-center space-x-6 sm:space-x-8 mt-4">
                        <button onClick={() => skip(-15)} className="text-white/80 hover:text-white transition-colors disabled:opacity-50" disabled={isLoading}>
                            <SkipBackIcon className="w-10 h-10"/>
                        </button>
                        <button onClick={togglePlayPause} className="w-20 h-20 bg-brand-accent rounded-full flex items-center justify-center text-brand-dark disabled:bg-brand-accent/50 shadow-lg shadow-brand-accent/20" disabled={isLoading}>
                            {isLoading ? <SpinnerIcon className="w-10 h-10"/> : isPlaying ? <PauseIcon className="w-10 h-10" /> : <PlayIcon className="w-10 h-10" />}
                        </button>
                        <button onClick={() => skip(15)} className="text-white/80 hover:text-white transition-colors disabled:opacity-50" disabled={isLoading}>
                            <SkipForwardIcon className="w-10 h-10"/>
                        </button>
                    </div>
                </footer>
            </div>

            {isOptionsOpen && (
                <OptionsMenu 
                    onClose={() => setOptionsOpen(false)}
                    playbackRate={playbackRate}
                    setPlaybackRate={setPlaybackRate}
                    sleepTimerRemaining={sleepTimerRemaining}
                    setSleepTimer={setSleepTimer}
                />
            )}
        </div>
    );
};

export default DetailedPlayerModal;