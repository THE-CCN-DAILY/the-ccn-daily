import React, { useState } from 'react';
import Card from '../components/Card';
import { PrayingHandsIcon, SendIcon, UserIcon, SparklesIcon, CheckIcon } from '../components/icons';
import type { PrayerRequest } from '../types';
import { useGamification } from '../contexts/GamificationContext';

const initialPrayerRequests: PrayerRequest[] = [
    { 
        id: 5, 
        text: "For a job interview I had last week. Praying for favor and a positive outcome.", 
        author: 'Emily R.', 
        prayerCount: 51,
        testimony: "Thank you all for your prayers! I got the job! God is so faithful and truly opened the right doors. I'm so grateful for this community." 
    },
    { id: 1, text: "Please pray for my family's health and protection this week.", author: 'John D.', prayerCount: 15 },
    { id: 2, text: "Praying for wisdom and guidance on a major career decision I have to make.", author: 'Anonymous', prayerCount: 28 },
    { id: 3, text: "For my friend who is going through a difficult time, that they would feel God's peace.", author: 'Sarah K.', prayerCount: 8 },
    { id: 4, text: "That our community would grow in love and unity.", author: 'Anonymous', prayerCount: 42 },
];


const TestimonyModal: React.FC<{
    request: PrayerRequest;
    onClose: () => void;
    onSave: (testimonyText: string) => void;
}> = ({ request, onClose, onSave }) => {
    const [testimonyText, setTestimonyText] = useState('');

    const handleSave = () => {
        if(testimonyText.trim()) {
            onSave(testimonyText);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center" onClick={onClose}>
            <div 
                className="bg-brand-secondary rounded-xl shadow-lg w-full max-w-md p-6 m-4 animate-fade-in-up"
                onClick={e => e.stopPropagation()}
                style={{ animationDuration: '0.3s' }}
            >
                <h2 className="text-2xl font-bold text-brand-text-primary mb-2 flex items-center">
                    <SparklesIcon className="w-6 h-6 mr-3 text-brand-gold"/>
                    Share Your Testimony
                </h2>
                <p className="text-sm text-brand-text-secondary mb-4">
                    Regarding your prayer for: <span className="italic">"{request.text}"</span>
                </p>
                <textarea
                    value={testimonyText}
                    onChange={(e) => setTestimonyText(e.target.value)}
                    className="w-full h-32 p-3 bg-brand-dark border border-brand-border rounded-lg text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="How did God answer this prayer?"
                />
                <div className="flex justify-end gap-4 mt-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg hover:bg-brand-border">Cancel</button>
                    <button 
                        onClick={handleSave} 
                        disabled={!testimonyText.trim()}
                        className="px-6 py-2 rounded-lg bg-brand-accent hover:bg-opacity-90 text-white font-semibold shadow-md disabled:bg-opacity-50"
                    >
                        Save Testimony
                    </button>
                </div>
            </div>
        </div>
    );
};


const PrayerWall: React.FC = () => {
    const [requests, setRequests] = useState<PrayerRequest[]>(initialPrayerRequests);
    const [newRequestText, setNewRequestText] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [prayedFor, setPrayedFor] = useState<number[]>([]);
    const [editingTestimonyFor, setEditingTestimonyFor] = useState<PrayerRequest | null>(null);
    const { dispatchGamificationEvent } = useGamification();

    const handlePray = (id: number) => {
        if (prayedFor.includes(id)) return;
        setRequests(requests.map(r => r.id === id ? { ...r, prayerCount: r.prayerCount + 1 } : r));
        setPrayedFor([...prayedFor, id]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRequestText.trim()) return;
        const newRequest: PrayerRequest = {
            id: Date.now(),
            text: newRequestText,
            author: isAnonymous ? 'Anonymous' : 'Founder (You)',
            prayerCount: 1,
            isUserSubmitted: true,
        };
        setRequests([newRequest, ...requests]);
        setPrayedFor([newRequest.id]);
        setNewRequestText('');
        setIsAnonymous(false);

        // Award points for posting a prayer
        dispatchGamificationEvent('e5');
    };

    const handleSaveTestimony = (testimonyText: string) => {
        if(!editingTestimonyFor) return;
        setRequests(requests.map(r => 
            r.id === editingTestimonyFor.id 
            ? { ...r, testimony: testimonyText } 
            : r
        ));
        setEditingTestimonyFor(null);
    };

    const RequestCard: React.FC<{ request: PrayerRequest }> = ({ request }) => {
        const hasPrayed = prayedFor.includes(request.id);

        if(request.testimony) {
            return (
                 <Card className="border-2 border-brand-gold/50 shadow-lg shadow-brand-gold/10">
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-brand-border">
                        <h3 className="text-lg font-bold text-brand-gold flex items-center">
                            <SparklesIcon className="w-5 h-5 mr-2"/> Answered!
                        </h3>
                         <div className="flex items-center text-sm text-brand-text-secondary">
                            <UserIcon className="w-4 h-4 mr-2" />
                            <span>{request.author}</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs font-semibold text-brand-text-secondary mb-1">Original Prayer:</p>
                            <p className="text-brand-text-secondary italic">"{request.text}"</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-brand-text-primary mb-1">Testimony:</p>
                            <p className="text-brand-text-primary">{request.testimony}</p>
                        </div>
                    </div>
                     <div className="flex justify-end mt-4">
                        <button 
                            onClick={() => handlePray(request.id)}
                            disabled={hasPrayed}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-full font-semibold transition-colors ${
                                hasPrayed 
                                ? 'bg-secondary-purple/20 text-secondary-purple' 
                                : 'bg-brand-secondary hover:bg-brand-border text-brand-text-secondary'
                            }`}
                        >
                            <PrayingHandsIcon className="w-5 h-5" />
                            <span>{hasPrayed ? 'Rejoiced' : 'Rejoice'} ({request.prayerCount})</span>
                        </button>
                    </div>
                </Card>
            );
        }

        return (
            <Card className={`transition-all duration-500 ${request.isUserSubmitted ? 'animate-fade-in-up' : ''}`}>
                <p className="text-brand-text-primary mb-4">{request.text}</p>
                {request.isUserSubmitted && !request.testimony && (
                    <div className="text-right mb-2 -mt-2">
                        <button 
                            onClick={() => setEditingTestimonyFor(request)}
                            className="text-sm font-semibold text-brand-accent hover:underline"
                        >
                            Add Testimony
                        </button>
                    </div>
                )}
                <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-brand-text-secondary">
                        <UserIcon className="w-4 h-4 mr-2" />
                        <span>{request.author}</span>
                    </div>
                    <button 
                        onClick={() => handlePray(request.id)}
                        disabled={hasPrayed}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-full font-semibold transition-colors ${
                            hasPrayed 
                            ? 'bg-secondary-purple/20 text-secondary-purple' 
                            : 'bg-brand-secondary hover:bg-brand-border text-brand-text-secondary'
                        }`}
                    >
                        <PrayingHandsIcon className="w-5 h-5" />
                        <span>{hasPrayed ? 'Prayed' : 'I Prayed'} ({request.prayerCount})</span>
                    </button>
                </div>
            </Card>
        );
    };

    return (
        <div>
            <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Community Prayer Wall</h1>
            <p className="text-lg text-brand-text-secondary mb-8">
                Share a request, pray for others, and post a testimony when your prayer is answered.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Submit Request Column */}
                <div className="md:sticky top-8 self-start">
                    <Card>
                        <h2 className="text-2xl font-bold text-brand-text-primary mb-4">Share a Prayer Request</h2>
                        <form onSubmit={handleSubmit}>
                            <textarea
                                value={newRequestText}
                                onChange={(e) => setNewRequestText(e.target.value)}
                                className="w-full h-32 p-3 bg-brand-secondary border border-brand-border rounded-lg text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                                placeholder="What's on your heart today?"
                            />
                            <div className="flex items-center justify-between mt-4">
                                <label className="flex items-center text-sm text-brand-text-secondary cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isAnonymous}
                                        onChange={(e) => setIsAnonymous(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
                                    />
                                    <span className="ml-2">Post Anonymously</span>
                                </label>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-lg bg-brand-accent hover:bg-opacity-90 text-white font-semibold shadow-md transition-transform transform hover:scale-105 flex items-center gap-2 disabled:bg-opacity-50"
                                    disabled={!newRequestText.trim()}
                                >
                                    <SendIcon className="w-5 h-5" />
                                    Post
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>

                {/* Prayer Wall Column */}
                <div className="space-y-6">
                    {requests.map(req => <RequestCard key={req.id} request={req} />)}
                </div>
            </div>

            {editingTestimonyFor && (
                <TestimonyModal 
                    request={editingTestimonyFor}
                    onClose={() => setEditingTestimonyFor(null)}
                    onSave={handleSaveTestimony}
                />
            )}
        </div>
    );
};

export default PrayerWall;