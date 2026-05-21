import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { PaintBrushIcon, SparklesIcon } from '../components/icons';

type Mood = 'Reflective' | 'Joyful' | 'Hopeful' | 'Courageous';

interface MoodConfig {
  name: Mood;
  color: string; // RGB values as a string "R G B"
  className: string;
}

const moodConfigs: MoodConfig[] = [
  { name: 'Reflective', color: '43 108 176', className: 'bg-primary-blue' }, // --color-primary-blue
  { name: 'Joyful', color: '214 158 46', className: 'bg-accent-gold' }, // --color-accent-gold
  { name: 'Hopeful', color: '56 161 105', className: 'bg-status-success' }, // --color-success
  { name: 'Courageous', color: '128 90 213', className: 'bg-secondary-purple' }, // --color-secondary-purple
];

const DynamicTheming: React.FC = () => {
  const [activeMood, setActiveMood] = useState<Mood>('Reflective');

  useEffect(() => {
    const root = document.documentElement;
    const initialColor = getComputedStyle(root).getPropertyValue('--color-primary-blue').trim();
    
    // Set initial color
    root.style.setProperty('--color-dynamic-accent', initialColor);

    // Set the active mood's color
    const newColor = moodConfigs.find(m => m.name === activeMood)?.color || initialColor;
    root.style.setProperty('--color-dynamic-accent', newColor);
    
    // Cleanup function to reset the color when leaving the page
    return () => {
      root.style.setProperty('--color-dynamic-accent', initialColor);
    };
  }, [activeMood]);

  return (
    <div>
      <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Dynamic Theming Engine</h1>
      <p className="text-lg text-brand-text-secondary mb-8">
        AI-driven mood analysis that dynamically shifts the app's ambient theme color based on your content.
      </p>

      <Card>
        <div className="text-center">
            <h2 className="text-2xl font-bold text-brand-text-primary mb-2 flex items-center justify-center">
                <PaintBrushIcon className="w-6 h-6 mr-3 text-brand-accent"/>
                Select a Devotional Mood
            </h2>
            <p className="text-brand-text-secondary max-w-2xl mx-auto mb-6">
                Click a button below to simulate the mood of a daily devotional. Observe how the background "aurora" effect across the entire app smoothly transitions to a matching color.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
                {moodConfigs.map(mood => (
                    <button
                        key={mood.name}
                        onClick={() => setActiveMood(mood.name)}
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

            <div className="p-6 bg-brand-secondary/50 rounded-lg">
                <p className="text-lg font-semibold text-brand-text-primary">
                    Current Mood: <span className={`font-bold text-dynamic-accent`}>{activeMood}</span>
                </p>
                <p className="text-brand-text-secondary mt-1">
                    The background aurora is now tinted with the color associated with this mood. This subtle effect enhances the emotional resonance of the content without being distracting.
                </p>
            </div>
        </div>
      </Card>

      <Card className="mt-8">
        <h3 className="text-xl font-bold text-brand-text-primary mb-2 flex items-center">
            <SparklesIcon className="w-5 h-5 mr-2 text-brand-accent"/>
            How It Will Work
        </h3>
        <p className="text-brand-text-secondary">
            In the final implementation, a Genkit flow will run each time the daily devotional is generated. This flow will analyze the text to determine its primary mood (e.g., joyful, reflective, encouraging). It will then securely update a value in Firestore, and the app will automatically apply the corresponding theme color for all users that day, creating a shared, dynamic experience.
        </p>
      </Card>
    </div>
  );
};

export default DynamicTheming;