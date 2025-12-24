import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon, ReaderIcon } from './icons';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { name: 'dark', icon: MoonIcon },
    { name: 'light', icon: SunIcon },
    { name: 'sepia', icon: ReaderIcon },
  ];

  return (
    <div className="p-2">
        <p className="text-xs text-brand-text-secondary mb-2 px-1 font-semibold tracking-wider">THEME</p>
        <div className="flex items-center justify-around bg-brand-secondary rounded-full p-1 border border-brand-border">
        {themes.map((t) => (
            <button
            key={t.name}
            onClick={() => setTheme(t.name as any)}
            className={`p-2 rounded-full transition-colors duration-200 ${
                theme === t.name
                ? 'bg-brand-accent text-white'
                : 'text-brand-text-secondary hover:text-brand-text-primary'
            }`}
            aria-label={`Switch to ${t.name} theme`}
            >
            <t.icon className="h-5 w-5" />
            </button>
        ))}
        </div>
    </div>
  );
};

export default ThemeSwitcher;
