import React from 'react';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';
import { PlayIcon, PauseIcon, SpinnerIcon, CloseIcon } from '../icons';

const MiniPlayer: React.FC = () => {
    const { currentTrack, isPlaying, togglePlayPause, openDetailedPlayer, progress, isLoading, closePlayer } = useAudioPlayer();

    if (!currentTrack) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.3)]">
             <div className="h-1 w-full bg-white/10">
                <div 
                    className="h-1 bg-brand-accent transition-all duration-1000 linear" 
                    style={{ width: `${isLoading ? 0 : progress}%` }}
                ></div>
            </div>
            <div 
                className="bg-[#181818] border-t border-[#282828] p-4 flex items-center justify-between"
            >
                <div className="flex items-center space-x-4 min-w-0 cursor-pointer" onClick={openDetailedPlayer} >
                    <img src={currentTrack.coverArt} alt={currentTrack.title} className="w-12 h-12 rounded flex-shrink-0"/>
                    <div className="min-w-0">
                        <h4 className="font-bold text-white truncate">{currentTrack.title}</h4>
                        <p className="text-sm text-gray-400 truncate">{currentTrack.author}</p>
                    </div>
                </div>
                <div className="flex items-center flex-shrink-0">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent opening detailed view
                            togglePlayPause();
                        }}
                        className="p-2 text-white"
                        disabled={isLoading}
                        aria-label={isPlaying ? "Pause" : "Play"}
                    >
                        {isLoading ? <SpinnerIcon className="w-8 h-8"/> : isPlaying ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8"/>}
                    </button>
                     <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            closePlayer();
                        }}
                        className="p-2 text-gray-400 hover:text-white"
                        aria-label="Close Player"
                    >
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MiniPlayer;