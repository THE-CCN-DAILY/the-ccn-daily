import React from 'react';
import type { ReaderSettings } from '../types';
import { SunIcon, MoonIcon, ReaderIcon, TextIncreaseIcon, TextDecreaseIcon } from './icons';

interface ReaderSettingsModalProps {
    settings: ReaderSettings;
    onChange: (newSettings: Partial<ReaderSettings>) => void;
    onClose: () => void;
}

const fonts = [
    { name: 'Serif', class: 'font-serif' },
    { name: 'Sans-serif', class: 'font-sans' },
    { name: 'Dyslexia Friendly', class: 'font-readable' },
] as const;

const fontSizes = [14, 16, 18, 20, 24];

const SettingRow: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
    <div className="py-3">
        <p className="text-sm font-semibold text-brand-text-secondary mb-2">{label}</p>
        <div className="flex items-center justify-between">{children}</div>
    </div>
);

const OptionButton: React.FC<{ onClick: () => void, isActive: boolean, children: React.ReactNode, className?: string }> = ({ onClick, isActive, children, className }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm rounded-lg border transition-colors flex items-center justify-center ${
            isActive 
            ? 'bg-brand-accent text-white border-brand-accent' 
            : 'bg-brand-secondary border-brand-border hover:border-brand-accent/50'
        } ${className}`}
    >
        {children}
    </button>
);


const ReaderSettingsModal: React.FC<ReaderSettingsModalProps> = ({ settings, onChange, onClose }) => {
    return (
        <div 
            className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm z-30 flex justify-center items-center"
            onClick={onClose}
        >
            <div 
                className="bg-brand-secondary border border-brand-border rounded-xl shadow-2xl w-full max-w-sm m-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-brand-border">
                    <h3 className="text-lg font-bold text-brand-text-primary">Display Settings</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-secondary text-2xl leading-none">&times;</button>
                </div>
                <div className="p-4 divide-y divide-brand-border">
                    <SettingRow label="Font Size">
                        <button 
                            onClick={() => onChange({ fontSize: Math.max(0, settings.fontSize - 1)})}
                            disabled={settings.fontSize === 0}
                            className="p-2 rounded-md bg-brand-secondary hover:bg-brand-border disabled:opacity-50"
                        >
                           <TextDecreaseIcon className="w-5 h-5"/>
                        </button>
                        <span className="font-semibold text-brand-text-primary">{fontSizes[settings.fontSize]}pt</span>
                        <button 
                            onClick={() => onChange({ fontSize: Math.min(fontSizes.length - 1, settings.fontSize + 1)})}
                             disabled={settings.fontSize === fontSizes.length - 1}
                            className="p-2 rounded-md bg-brand-secondary hover:bg-brand-border disabled:opacity-50"
                        >
                            <TextIncreaseIcon className="w-5 h-5"/>
                        </button>
                    </SettingRow>

                    <SettingRow label="Font Family">
                        <div className="flex items-center space-x-2 w-full">
                            {fonts.map(font => (
                                <OptionButton key={font.name} onClick={() => onChange({ fontFamily: font.class })} isActive={settings.fontFamily === font.class} className="flex-1">
                                    {font.name}
                                </OptionButton>
                            ))}
                        </div>
                    </SettingRow>

                    <SettingRow label="Line Spacing">
                       <div className="flex items-center space-x-2 w-full">
                            {(['normal', 'relaxed', 'loose'] as const).map(spacing => (
                                <OptionButton key={spacing} onClick={() => onChange({ lineSpacing: spacing })} isActive={settings.lineSpacing === spacing} className="flex-1">
                                    {spacing.charAt(0).toUpperCase() + spacing.slice(1)}
                                </OptionButton>
                            ))}
                        </div>
                    </SettingRow>
                    
                    <SettingRow label="Reading Theme">
                        <div className="flex items-center space-x-2 w-full">
                             <OptionButton onClick={() => onChange({ theme: 'light' })} isActive={settings.theme === 'light'} className="flex-1"><SunIcon className="w-5 h-5 mr-2"/> Light</OptionButton>
                             <OptionButton onClick={() => onChange({ theme: 'sepia' })} isActive={settings.theme === 'sepia'} className="flex-1"><ReaderIcon className="w-5 h-5 mr-2"/> Sepia</OptionButton>
                             <OptionButton onClick={() => onChange({ theme: 'dark' })} isActive={settings.theme === 'dark'} className="flex-1"><MoonIcon className="w-5 h-5 mr-2"/> Dark</OptionButton>
                        </div>
                    </SettingRow>
                    
                    <SettingRow label="Page Margins">
                        <div className="flex items-center space-x-2 w-full">
                            {(['normal', 'wide'] as const).map(margin => (
                                <OptionButton key={margin} onClick={() => onChange({ margins: margin })} isActive={settings.margins === margin} className="flex-1">
                                    {margin.charAt(0).toUpperCase() + margin.slice(1)}
                                </OptionButton>
                            ))}
                        </div>
                    </SettingRow>
                </div>
            </div>
        </div>
    );
};

export default ReaderSettingsModal;
