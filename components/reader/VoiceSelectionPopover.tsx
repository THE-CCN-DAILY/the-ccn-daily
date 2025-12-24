import React from 'react';
import type { ReaderSettings } from '../../types';
import { UserCircleIcon, CheckIcon } from '../icons';

interface VoiceSelectionPopoverProps {
    currentVoice: ReaderSettings['narratorVoice'];
    onChange: (voice: ReaderSettings['narratorVoice']) => void;
    onClose: () => void;
}

const voices = ['Zephyr', 'Nova', 'Kore'] as const;

const VoiceSelectionPopover: React.FC<VoiceSelectionPopoverProps> = ({ currentVoice, onChange, onClose }) => {
    const popoverStyle: React.CSSProperties = {
        backgroundColor: `rgb(var(--reader-bg, var(--color-surface)))`,
        borderColor: `rgb(var(--reader-border, var(--color-border)))`,
    };

    const handleSelect = (voice: ReaderSettings['narratorVoice']) => {
        onChange(voice);
        onClose();
    }

    return (
        <div className="absolute top-16 right-4 z-20" onMouseDown={(e) => e.stopPropagation()}>
            <div 
                className="w-48 rounded-lg border shadow-lg overflow-hidden animate-fade-in-up"
                style={{ ...popoverStyle, animationDuration: '0.2s' }}
            >
                <ul>
                    {voices.map(voice => {
                        const isActive = voice === currentVoice;
                        return (
                             <li key={voice}>
                                <button
                                    onClick={() => handleSelect(voice)} 
                                    className={`w-full text-left flex items-center justify-between p-3 text-sm transition-colors ${isActive ? 'text-[rgb(var(--reader-accent))]' : 'hover:bg-black/5'}`}
                                >
                                    <div className="flex items-center">
                                        <UserCircleIcon className="w-5 h-5 mr-2"/>
                                        <span>{voice}</span>
                                    </div>
                                    {isActive && <CheckIcon className="w-5 h-5"/>}
                                </button>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    );
};

export default VoiceSelectionPopover;