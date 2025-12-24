import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import { SparklesIcon, UserIcon, SendIcon } from '../components/icons';
import type { PrayerRequest, StandaloneTestimony } from '../types';

// Data that would come from the Prayer Wall collection
const mockAnsweredPrayers: PrayerRequest[] = [
    { 
        id: 5, 
        text: "For a job interview I had last week. Praying for favor and a positive outcome.", 
        author: 'Emily R.', 
        prayerCount: 51,
        testimony: "Thank you all for your prayers! I got the job! God is so faithful and truly opened the right doors. I'm so grateful for this community." 
    },
    { 
        id: 6, 
        text: "Please pray for my mother's surgery to go well and for a speedy recovery.", 
        author: 'David L.', 
        prayerCount: 103,
        testimony: "The surgery was a complete success, and my mom is recovering faster than the doctors expected. Your prayers made a tangible difference. All glory to God!" 
    },
    { 
        id: 7, 
        text: "I was struggling with a creative block on a very important project. Praying for a breakthrough.", 
        author: 'Anonymous', 
        prayerCount: 45,
        testimony: "The morning after I posted this, I woke up with a completely fresh perspective and finished the project that day. The block is gone! Thank you, Jesus." 
    },
];

// Data that would come from the dedicated Testimonies collection
const mockStandaloneTestimonies: StandaloneTestimony[] = [
     { 
        id: 8, 
        author: 'Maria G.', 
        title: 'An Unexpected Reconciliation',
        text: "I hadn't spoken to my brother in years after a painful disagreement. I've been praying for restoration but didn't know how it could happen. Out of the blue, he called me. We had the most healing conversation we've had in a decade. A true miracle. Don't ever stop praying for restoration." 
    },
    {
        id: 9,
        author: 'Samuel T.',
        title: 'Gratitude for the "Small" Things',
        text: "Today I was just overwhelmed with gratitude. Not for any huge miracle, but for the warmth of the sun, the taste of my coffee, and the sound of my children laughing. It's in these small, everyday moments that I feel God's presence most profoundly. He is in everything."
    }
];

// A unified type for display purposes
type UnifiedTestimony = {
    id: string;
    author: string;
    testimonyText: string;
    contextTitle: string;
    contextText: string | null;
}

const ShareStoryModal: React.FC<{
    onClose: () => void;
    onSave: (testimony: StandaloneTestimony) => void;
}> = ({ onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');

    const handleSave = () => {
        if (title.trim() && text.trim()) {
            onSave({
                id: Date.now(),
                author: 'Founder (You)',
                title,
                text,
            });
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center" onClick={onClose}>
            <div 
                className="bg-brand-secondary rounded-xl shadow-lg w-full max-w-md p-6 m-4 animate-fade-in-up"
                onClick={e => e.stopPropagation()}
                style={{ animationDuration: '0.3s' }}
            >
                <h2 className="text-2xl font-bold text-brand-text-primary mb-4 flex items-center">
                    <SparklesIcon className="w-6 h-6 mr-3 text-brand-gold"/>
                    Share Your Story
                </h2>
                <div className="space-y-4">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="A title for your testimony"
                        className="w-full bg-brand-dark border border-brand-border rounded-lg py-2 px-3 text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full h-40 p-3 bg-brand-dark border border-brand-border rounded-lg text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                        placeholder="Share your story of faith, gratitude, or a moment of blessing..."
                    />
                </div>
                <div className="flex justify-end gap-4 mt-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg hover:bg-brand-border">Cancel</button>
                    <button 
                        onClick={handleSave} 
                        disabled={!title.trim() || !text.trim()}
                        className="px-6 py-2 rounded-lg bg-brand-accent hover:bg-opacity-90 text-white font-semibold shadow-md disabled:bg-opacity-50"
                    >
                        Share Story
                    </button>
                </div>
            </div>
        </div>
    );
};


const TestimonyCard: React.FC<{ testimony: UnifiedTestimony }> = ({ testimony }) => (
    <Card className="flex flex-col h-full animate-fade-in-up" style={{ animationDelay: `${parseInt(testimony.id.split('-')[1]) * 50}ms` }}>
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-brand-border">
            <h3 className="text-lg font-bold text-brand-gold flex items-center">
                <SparklesIcon className="w-5 h-5 mr-2"/> {testimony.contextTitle}
            </h3>
             <div className="flex items-center text-sm text-brand-text-secondary">
                <UserIcon className="w-4 h-4 mr-2" />
                <span>{testimony.author}</span>
            </div>
        </div>
        <div className="flex-grow space-y-3">
            <p className="text-brand-text-primary text-base">{testimony.testimonyText}</p>
            {testimony.contextText && (
                <div className="p-3 bg-brand-secondary rounded-lg">
                    <p className="text-xs font-semibold text-brand-text-secondary mb-1">Original Prayer:</p>
                    <p className="text-sm text-brand-text-secondary italic">"{testimony.contextText}"</p>
                </div>
            )}
        </div>
    </Card>
);

const TestimoniesPage: React.FC = () => {
    const [standaloneTestimonies, setStandaloneTestimonies] = useState(mockStandaloneTestimonies);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const unifiedTestimonies = useMemo<UnifiedTestimony[]>(() => {
        const fromAnsweredPrayers: UnifiedTestimony[] = mockAnsweredPrayers
            .filter(r => r.testimony)
            .map(r => ({
                id: `p-${r.id}`,
                author: r.author,
                testimonyText: r.testimony!,
                contextTitle: "Answered Prayer",
                contextText: r.text
            }));
        
        const fromStandalone: UnifiedTestimony[] = standaloneTestimonies.map(t => ({
            id: `s-${t.id}`,
            author: t.author,
            testimonyText: t.text,
            contextTitle: t.title,
            contextText: null
        }));

        return [...fromStandalone, ...fromAnsweredPrayers].sort((a, b) => parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1]));

    }, [standaloneTestimonies]);
    
    const handleSaveStory = (newStory: StandaloneTestimony) => {
        setStandaloneTestimonies([newStory, ...standaloneTestimonies]);
        setIsModalOpen(false);
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Wall of Testimony</h1>
                    <p className="text-lg text-brand-text-secondary max-w-2xl">
                        A dedicated space to celebrate God's faithfulness. Share answered prayers or standalone stories of His goodness.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex-shrink-0 px-6 py-3 rounded-lg bg-brand-accent hover:bg-opacity-90 text-white font-semibold shadow-md transition-transform transform hover:scale-105 flex items-center gap-2 self-start sm:self-center"
                >
                    <SendIcon className="w-5 h-5"/>
                    Share Your Story
                </button>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {unifiedTestimonies.map(item => (
                    <TestimonyCard key={item.id} testimony={item} />
                ))}
            </div>

            {isModalOpen && (
                <ShareStoryModal 
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveStory}
                />
            )}
        </div>
    );
};

export default TestimoniesPage;