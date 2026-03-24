
import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { PrayingHandsIcon, SendIcon, UserIcon, SparklesIcon, CheckIcon, SearchIcon, SpinnerIcon, AiIcon, CommunityIcon } from '../components/icons';
import type { PrayerRequest } from '../types';
import { useGamification } from '../contexts/GamificationContext';
import { getGroundedPrayerTopics } from '../services/geminiService';
import { db, auth } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, increment, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { useAuth } from '../contexts/AuthContext';

const TheCommunity: React.FC = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [newRequestText, setNewRequestText] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [prayedFor, setPrayedFor] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'wall' | 'lumina'>('lumina');
    const [isLoading, setIsLoading] = useState(true);
    
    // Grounded AI state
    const [groundedTopics, setGroundedTopics] = useState<any[]>([]);
    const [isFetchingGrounded, setIsFetchingGrounded] = useState(false);

    const { dispatchGamificationEvent } = useGamification();

    useEffect(() => {
        if (!user) {
            setRequests([]);
            setIsLoading(false);
            return;
        }
        const q = query(collection(db, 'prayerRequests'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRequests(data);
            setIsLoading(false);
        }, (error) => {
            handleFirestoreError(error, OperationType.GET, 'prayerRequests');
        });

        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        const fetchGrounded = async () => {
            setIsFetchingGrounded(true);
            try {
                const topics = await getGroundedPrayerTopics();
                setGroundedTopics(topics);
            } catch (error) {
                console.error('Error fetching grounded topics:', error);
            } finally {
                setIsFetchingGrounded(false);
            }
        };
        fetchGrounded();
    }, []);

    const handlePray = async (id: string) => {
        if (prayedFor.includes(id)) return;
        try {
            const docRef = doc(db, 'prayerRequests', id);
            await updateDoc(docRef, {
                prayerCount: increment(1)
            });
            setPrayedFor([...prayedFor, id]);
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `prayerRequests/${id}`);
        }
    };

    const addGroundedToWall = async (topic: any) => {
        try {
            await addDoc(collection(db, 'prayerRequests'), {
                text: `[Grounded Prayer] ${topic.title}: ${topic.snippet}`,
                author: 'Strategic Sentinel',
                prayerCount: 1,
                createdAt: serverTimestamp(),
                isAnonymous: false
            });
            setGroundedTopics(prev => prev.filter(t => t.title !== topic.title));
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'prayerRequests');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRequestText.trim()) return;
        
        try {
            const user = auth.currentUser;
            await addDoc(collection(db, 'prayerRequests'), {
                text: newRequestText,
                author: isAnonymous ? 'Anonymous' : (user?.displayName || 'Community Member'),
                authorUid: user?.uid || null,
                prayerCount: 1,
                createdAt: serverTimestamp(),
                isAnonymous
            });
            
            setNewRequestText('');
            setIsAnonymous(false);
            dispatchGamificationEvent('e5');
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'prayerRequests');
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-brand-text-primary mb-2 flex items-center gap-3">
                        <CommunityIcon className="w-10 h-10 text-brand-accent"/>
                        The Community
                    </h1>
                    <p className="text-lg text-brand-text-secondary">
                        A global network of professionals and seekers, united in faith and purpose.
                    </p>
                </div>
                <div className="flex bg-brand-secondary p-1 rounded-full border border-brand-border">
                    <button 
                        onClick={() => setActiveTab('lumina')}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'lumina' ? 'bg-brand-accent text-white shadow-lg' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}
                    >
                        <AiIcon className="w-4 h-4"/> Lumina Digest
                    </button>
                    <button 
                        onClick={() => setActiveTab('wall')}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'wall' ? 'bg-brand-accent text-white shadow-lg' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}
                    >
                        <PrayingHandsIcon className="w-4 h-4"/> Prayer Wall
                    </button>
                </div>
            </div>

            {activeTab === 'lumina' ? (
                <div className="space-y-6 animate-fade-in">
                    <Card className="border-2 border-brand-accent/30 bg-gradient-to-br from-brand-dark to-brand-accent/5">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-brand-accent/20 flex items-center justify-center border border-brand-accent/50">
                                <AiIcon className="w-6 h-6 text-brand-accent"/>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-brand-text-primary">Lumina Daily Digest</h2>
                                <p className="text-sm text-brand-text-secondary">AI-Synthesized insights from The Community • {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-brand-secondary p-4 rounded-xl border border-brand-border">
                                <p className="text-xs font-bold text-brand-text-secondary uppercase mb-1">Total Prayers</p>
                                <p className="text-3xl font-black text-brand-text-primary">{requests.reduce((acc, curr) => acc + (curr.prayerCount || 0), 0).toLocaleString()}</p>
                                <p className="text-xs text-status-success mt-1">+12% from yesterday</p>
                            </div>
                            <div className="bg-brand-secondary p-4 rounded-xl border border-brand-border">
                                <p className="text-xs font-bold text-brand-text-secondary uppercase mb-1">Testimonies</p>
                                <p className="text-3xl font-black text-brand-text-primary">{requests.filter(r => r.testimony).length}</p>
                                <p className="text-xs text-brand-accent mt-1">Success stories shared</p>
                            </div>
                            <div className="bg-brand-secondary p-4 rounded-xl border border-brand-border">
                                <p className="text-xs font-bold text-brand-text-secondary uppercase mb-1">Active Requests</p>
                                <p className="text-3xl font-black text-status-error">{requests.length}</p>
                                <p className="text-xs text-status-error/80 mt-1">Ongoing prayer needs</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-brand-text-primary mb-2 flex items-center gap-2">
                                    <SparklesIcon className="w-5 h-5 text-brand-accent"/>
                                    Community Pulse
                                </h3>
                                <p className="text-brand-text-secondary leading-relaxed bg-brand-secondary/50 p-4 rounded-xl border border-brand-border">
                                    "Today, the community is heavily focused on <strong>healing and restoration</strong>. 
                                    There was a significant spike in prayers regarding family health following yesterday's devotional on 'Faith in the Fire'. 
                                    We also celebrated {requests.filter(r => r.testimony).length} testimonies of financial breakthrough this morning."
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-bold text-brand-text-secondary uppercase mb-3">Trending Topics</h3>
                                    <ul className="space-y-2">
                                        <li className="flex items-center justify-between p-2 bg-brand-secondary rounded-lg">
                                            <span className="text-sm text-brand-text-primary">Family Health</span>
                                            <span className="text-xs font-bold text-brand-accent">34%</span>
                                        </li>
                                        <li className="flex items-center justify-between p-2 bg-brand-secondary rounded-lg">
                                            <span className="text-sm text-brand-text-primary">Career Guidance</span>
                                            <span className="text-xs font-bold text-brand-accent">28%</span>
                                        </li>
                                        <li className="flex items-center justify-between p-2 bg-brand-secondary rounded-lg">
                                            <span className="text-sm text-brand-text-primary">Financial Peace</span>
                                            <span className="text-xs font-bold text-brand-accent">15%</span>
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-status-error uppercase mb-3">Support Alerts (Admin Only)</h3>
                                    <div className="p-3 bg-status-error/10 border border-status-error/30 rounded-xl">
                                        <p className="text-xs font-bold text-status-error mb-1">High Distress Flag</p>
                                        <p className="text-sm text-brand-text-primary mb-2">User 'Anonymous' expressed severe burnout and isolation in the late-night support channel.</p>
                                        <button className="text-[10px] uppercase font-bold text-white bg-status-error px-3 py-1 rounded hover:bg-opacity-80 transition-colors">
                                            Review & Connect
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row gap-8 animate-fade-in-up">
                    {/* Left Column: Submit & Grounded */}
                    <div className="md:w-1/3 space-y-6">
                        <Card className="border-brand-accent/30 bg-brand-accent/5">
                            <h2 className="text-xl font-bold text-brand-text-primary mb-4 flex items-center gap-2">
                                <SearchIcon className="w-5 h-5 text-brand-accent"/>
                                Grounded Insights
                            </h2>
                            {isFetchingGrounded ? (
                                <div className="py-8 text-center text-brand-text-secondary animate-pulse flex flex-col items-center">
                                    <SpinnerIcon className="w-8 h-8 mb-2"/>
                                    <p className="text-xs">Sentinel scanning global events...</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {groundedTopics.map((topic, i) => (
                                        <div key={i} className="p-3 bg-brand-dark rounded-lg border border-brand-border">
                                            <p className="text-xs font-bold text-brand-accent uppercase mb-1">Global Need</p>
                                            <p className="text-sm font-bold text-brand-text-primary mb-1">{topic.title}</p>
                                            <p className="text-xs text-brand-text-secondary mb-3 line-clamp-2">{topic.snippet}</p>
                                            <button 
                                                onClick={() => addGroundedToWall(topic)}
                                                className="w-full py-1.5 bg-brand-secondary text-brand-accent text-[10px] font-bold rounded uppercase hover:bg-brand-accent hover:text-white transition-colors"
                                            >
                                                Post to Prayer Wall
                                            </button>
                                        </div>
                                    ))}
                                    {groundedTopics.length === 0 && <p className="text-xs text-brand-text-secondary text-center">No new insights available.</p>}
                                </div>
                            )}
                        </Card>

                        <Card>
                            <h2 className="text-xl font-bold text-brand-text-primary mb-4">Share a Request</h2>
                            <form onSubmit={handleSubmit}>
                                <textarea
                                    value={newRequestText}
                                    onChange={(e) => setNewRequestText(e.target.value)}
                                    className="w-full h-24 p-3 bg-brand-secondary border border-brand-border rounded-lg text-brand-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                                    placeholder="What's on your heart?"
                                />
                                <div className="flex items-center gap-4 mt-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={isAnonymous} 
                                            onChange={(e) => setIsAnonymous(e.target.checked)}
                                            className="w-4 h-4 rounded border-brand-border text-brand-accent focus:ring-brand-accent bg-brand-dark"
                                        />
                                        <span className="text-xs text-brand-text-secondary">Post Anonymously</span>
                                    </label>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-2 rounded-lg bg-brand-accent text-white font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50"
                                        disabled={!newRequestText.trim()}
                                    >
                                        <SendIcon className="w-4 h-4" /> Post Prayer
                                    </button>
                                </div>
                            </form>
                        </Card>
                    </div>

                    {/* Right Column: The Wall */}
                    <div className="md:w-2/3 space-y-6">
                        {isLoading ? (
                            <div className="py-20 text-center">
                                <SpinnerIcon className="w-10 h-10 text-brand-accent mx-auto mb-4 animate-spin" />
                                <p className="text-brand-text-secondary">Loading prayer wall...</p>
                            </div>
                        ) : (
                            <>
                                {requests.map(req => (
                                    <Card key={req.id} className={req.author === 'Strategic Sentinel' ? 'border-brand-accent/50 bg-brand-accent/5' : ''}>
                                         <div className="flex items-center justify-between mb-3 text-xs text-brand-text-secondary">
                                            <div className="flex items-center gap-2">
                                                <UserIcon className="w-3 h-3" />
                                                <span className="font-bold">{req.author}</span>
                                            </div>
                                            <span>{req.testimony ? 'ANSWERED' : 'ONGOING'}</span>
                                        </div>
                                        <p className={`text-brand-text-primary ${req.author === 'Strategic Sentinel' ? 'italic font-serif' : ''}`}>{req.text}</p>
                                        {req.testimony && (
                                            <div className="mt-4 p-3 bg-status-success/10 border-l-4 border-status-success rounded">
                                                <p className="text-xs font-bold text-status-success uppercase mb-1">Answered Prayer Testimony</p>
                                                <p className="text-sm text-brand-text-primary italic">{req.testimony}</p>
                                            </div>
                                        )}
                                        <div className="mt-4 flex justify-end">
                                            <button 
                                                onClick={() => handlePray(req.id)}
                                                disabled={prayedFor.includes(req.id)}
                                                className={`flex items-center gap-2 px-4 py-1.5 text-xs rounded-full font-bold transition-all ${prayedFor.includes(req.id) ? 'bg-status-success/20 text-status-success' : 'bg-brand-secondary text-brand-text-secondary hover:bg-brand-border'}`}
                                            >
                                                <PrayingHandsIcon className="w-4 h-4" />
                                                {prayedFor.includes(req.id) ? 'Prayed' : 'I Am Praying'} ({req.prayerCount || 0})
                                            </button>
                                        </div>
                                    </Card>
                                ))}
                                {requests.length === 0 && (
                                    <div className="py-20 text-center bg-brand-secondary/30 rounded-2xl border border-dashed border-brand-border">
                                        <PrayingHandsIcon className="w-12 h-12 text-brand-text-secondary mx-auto mb-4 opacity-20" />
                                        <p className="text-brand-text-secondary">The prayer wall is quiet. Be the first to share a request.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TheCommunity;
