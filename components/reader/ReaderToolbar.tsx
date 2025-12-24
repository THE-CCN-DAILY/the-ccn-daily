import React from 'react';
import { ContentsIcon, SettingsIcon, SpeakerWaveIcon, ChevronDownIcon } from '../icons';
import type { ReaderSettings } from '../../types';

interface ReaderToolbarProps {
    title: string;
    isReadAloud: boolean;
    narratorVoice: ReaderSettings['narratorVoice'];
    onToggleReadAloud: () => void;
    onContentsClick: () => void;
    onSettingsClick: () => void;
    onVoiceSelectorClick: () => void;
}

const ReaderToolbar: React.FC<ReaderToolbarProps> = ({ title, isReadAloud, narratorVoice, onToggleReadAloud, onContentsClick, onSettingsClick, onVoiceSelectorClick }) => {
    const toolbarStyle: React.CSSProperties = {
        color: `rgb(var(--reader-text-secondary))`,
        borderBottomColor: `rgb(var(--reader-border))`,
    };
    const titleStyle: React.CSSProperties = {
        color: `rgb(var(--reader-text-primary))`
    };
    const buttonStyle: React.CSSProperties = {
        color: `rgb(var(--reader-text-secondary))`
    };

    return (
        <div style={toolbarStyle} className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b">
            <div>
                <h3 style={titleStyle} className="font-bold">{title}</h3>
                <p className="text-sm">by Unknown Author</p>
            </div>
            <div className="flex items-center space-x-2 self-end sm:self-auto">
                <div className="flex items-center rounded-full" style={{backgroundColor: `rgba(0,0,0,0.1)`}}>
                    <button style={buttonStyle} onClick={onToggleReadAloud} className={`p-2 rounded-full hover:bg-black/10 ${isReadAloud ? 'text-[rgb(var(--reader-accent))]' : ''}`} aria-label="Toggle text to speech"><SpeakerWaveIcon className="w-6 h-6"/></button>
                    <div className="w-px h-5 bg-[rgb(var(--reader-border))]"></div>
                    <button style={buttonStyle} onClick={onVoiceSelectorClick} className="px-3 py-2 text-sm flex items-center rounded-full hover:bg-black/10">
                        <span>{narratorVoice}</span>
                        <ChevronDownIcon className="w-4 h-4 ml-1"/>
                    </button>
                </div>
                <button style={buttonStyle} onClick={onContentsClick} className="p-2 rounded-full hover:bg-black/10" aria-label="Open contents"><ContentsIcon className="w-6 h-6"/></button>
                <button style={buttonStyle} onClick={onSettingsClick} className="p-2 rounded-full hover:bg-black/10" aria-label="Open display settings"><SettingsIcon className="w-6 h-6"/></button>
            </div>
        </div>
    );
};

export default ReaderToolbar;