
import React from 'react';
import Card from '../components/Card';
import { useTheme } from '../contexts/ThemeContext';
import { PlayIcon } from '../components/icons';

const ColorSwatch: React.FC<{ name: string; className: string; hex: string; rgb: string; }> = ({ name, className, hex, rgb }) => (
    <div className="flex items-center space-x-4">
        <div className={`w-16 h-16 rounded-lg ${className} border border-brand-border shadow-inner`}></div>
        <div>
            <p className="font-semibold text-brand-text-primary">{name}</p>
            <p className="font-mono text-sm text-brand-text-secondary">{hex}</p>
            <p className="font-mono text-xs text-brand-text-secondary/70">{`rgb(${rgb})`}</p>
        </div>
    </div>
);

const DesignSystem: React.FC = () => {
    const { theme } = useTheme();

    return (
        <div>
            <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Design System Prototype</h1>
            <p className="text-lg text-brand-text-secondary mb-8">
                This is the living style guide for Project Phoenix, establishing our premium look and feel. Your feedback here will shape the entire application.
            </p>

            {/* Color Palette Section */}
            <Card className="mb-8">
                <h2 className="text-2xl font-bold text-brand-text-primary mb-4 border-b border-brand-border pb-2">Global App Color System <span className="text-base font-normal text-brand-text-secondary capitalize">({theme} Mode)</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                    <ColorSwatch name="Primary Blue (Faith)" className="bg-primary-blue" hex="#2B6CB0" rgb="43 108 176" />
                    <ColorSwatch name="Secondary Purple" className="bg-secondary-purple" hex="#805AD5" rgb="128 90 213" />
                    <ColorSwatch name="Accent Gold (Divine)" className="bg-accent-gold" hex="#D69E2E" rgb="214 158 46" />
                    <ColorSwatch name="Background" className="bg-background" hex="#FAFBFC" rgb="250 251 252" />
                    <ColorSwatch name="Surface" className="bg-surface" hex="#FFFFFF" rgb="255 255 255" />
                    <ColorSwatch name="Border" className="bg-brand-border" hex="#E2E8F0" rgb="226 232 240" />
                    <ColorSwatch name="Primary Text" className="bg-brand-text-primary" hex="#2D3748" rgb="45 55 72" />
                    <ColorSwatch name="Secondary Text" className="bg-brand-text-secondary" hex="#4A5568" rgb="74 85 104" />
                </div>
                <div className="mt-6 pt-6 border-t border-brand-border">
                     <h3 className="text-xl font-bold text-brand-text-primary mb-4">Spiritual Color Palette</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
                        <ColorSwatch name="Prayer" className="bg-secondary-purple" hex="#805AD5" rgb="128 90 213" />
                        <ColorSwatch name="Worship" className="bg-accent-gold" hex="#D69E2E" rgb="214 158 46" />
                        <ColorSwatch name="Growth" className="bg-status-success" hex="#38A169" rgb="56 161 105" />
                        <ColorSwatch name="Community" className="bg-primary-blue" hex="#2B6CB0" rgb="43 108 176" />
                     </div>
                </div>
                 <div className="mt-6 pt-6 border-t border-brand-border">
                     <h3 className="text-xl font-bold text-brand-text-primary mb-4">Status Colors</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                        <ColorSwatch name="Success" className="bg-status-success" hex="#38A169" rgb="56 161 105" />
                        <ColorSwatch name="Warning" className="bg-status-warning" hex="#D69E2E" rgb="214 158 46" />
                        <ColorSwatch name="Error" className="bg-status-error" hex="#E53E3E" rgb="229 62 62" />
                     </div>
                </div>
            </Card>

            {/* Typography Section */}
            <Card className="mb-8">
                <h2 className="text-2xl font-bold text-brand-text-primary mb-4 border-b border-brand-border pb-2">Typography</h2>
                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-brand-text-secondary mb-1">Heading 1</p>
                        <h1 className="text-4xl font-bold text-brand-text-primary">The Journey of a Thousand Miles</h1>
                    </div>
                    <div>
                        <p className="text-sm text-brand-text-secondary mb-1">Heading 2</p>
                        <h2 className="text-3xl font-bold text-brand-text-primary">Begins with a Single Step</h2>
                    </div>
                    <div>
                        <p className="text-sm text-brand-text-secondary mb-1">Heading 3</p>
                        <h3 className="text-2xl font-bold text-brand-text-primary">A New Path Forward</h3>
                    </div>
                    <div>
                        <p className="text-sm text-brand-text-secondary mb-1">Body Text</p>
                        <p className="text-brand-text-primary">
                            This is how the main body text will appear. We are aiming for a clean, legible, and immersive experience. The background and text colors automatically adapt to the selected theme—<strong>light, dark, or the paper-like sepia mode</strong>. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Components Section */}
            <Card>
                <h2 className="text-2xl font-bold text-brand-text-primary mb-4 border-b border-brand-border pb-2">Components</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Buttons */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-brand-text-primary">Buttons</h3>
                        <div className="flex flex-wrap items-center gap-4">
                            <button className="px-6 py-2 rounded-lg bg-brand-accent hover:bg-opacity-90 text-white font-semibold shadow-md transition-transform transform hover:scale-105">Primary Action</button>
                            <button className="px-6 py-2 rounded-lg bg-secondary-purple hover:bg-opacity-90 text-white font-semibold shadow-md transition-transform transform hover:scale-105">Secondary Action</button>
                            <button className="px-6 py-2 rounded-lg bg-brand-secondary hover:bg-brand-border text-brand-text-primary font-semibold transition-colors border border-brand-border">Tertiary Action</button>
                             <button className="p-3 rounded-full bg-accent-gold hover:bg-opacity-90 text-white font-semibold shadow-md transition-transform transform hover:scale-105">
                                <PlayIcon className="w-5 h-5"/>
                             </button>
                        </div>
                    </div>

                    {/* Form Inputs */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-brand-text-primary">Form Inputs</h3>
                        <input
                          type="text"
                          placeholder="Enter your email..."
                          className="w-full bg-surface border border-brand-border rounded-lg py-2 px-4 text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default DesignSystem;
