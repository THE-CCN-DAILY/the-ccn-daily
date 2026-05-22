import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../components/Card';
import { PrayingHandsIcon, SendIcon, UserIcon, SparklesIcon, SearchIcon, SpinnerIcon, AiIcon, CommunityIcon } from '../components/icons';
import { useGamification } from '../contexts/GamificationContext';
import { getGroundedPrayerTopics } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { CommunityPrayerRequest, createPrayerRequest, listPrayerRequests, prayForRequest } from '../services/communityService';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } } };

const TheCommunity: React.FC = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<CommunityPrayerRequest[]>([]);
    const [newRequestText, setNewRequestText] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [prayedFor, setPrayedFor] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'wall' | 'lumina'>('lumina');
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    // Grounded AI state
    const [groundedTopics, setGroundedTopics] = useState<{ title: string; snippet: string }[]>([]);
    const [isFetchingGrounded, setIsFetchingGrounded] = useState(false);

    const { dispatchGamificationEvent } = useGamification();
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        let cancelled = false;

        const loadRequests = async (showSpinner = false) => {
            if (showSpinner) setIsLoading(true);
            setLoadError('');
            try {
                const data = await listPrayerRequests();
                if (!cancelled) setRequests(data);
            } catch {
                if (!cancelled) setLoadError('The prayer wall could not refresh. Please try again shortly.');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        loadRequests(true);
        const interval = window.setInterval(() => loadRequests(false), 15000);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        const fetchGrounded = async () => {
            if (!user) return;
            setIsFetchingGrounded(true);
            try {
                const topics = await getGroundedPrayerTopics(user.tier || 'free', user.uid);
                setGroundedTopics(topics);
            } catch {
                // Grounded topics unavailable — no action needed
            } finally {
                setIsFetchingGrounded(false);
            }
        };
        fetchGrounded();
    }, [user]);

    const handlePray = async (id: string) => {
        if (prayedFor.includes(id)) return;
        try {
            const updatedRequest = await prayForRequest(id, user?.uid || user?.email || 'anonymous');
            if (updatedRequest) {
                setRequests(prev => prev.map(req => req.id === id ? updatedRequest : req));
            }
            setPrayedFor(prev => [...prev, id]);
        } catch (err) {
            setLoadError(err instanceof Error ? err.message : 'Could not update that prayer request.');
        }
    };

    const addGroundedToWall = async (topic: { title: string; snippet: string }) => {
        try {
            const createdRequest = await createPrayerRequest({
                text: `${topic.title}: ${topic.snippet}`,
                author: 'Strategic Sentinel',
                authorUid: 'strategic-sentinel',
                prayerCount: 1,
                isAnonymous: false
            });
            if (createdRequest) {
                setRequests(prev => [createdRequest, ...prev]);
            }
            setGroundedTopics(prev => prev.filter(t => t.title !== topic.title));
        } catch (err) {
            setLoadError(err instanceof Error ? err.message : 'Could not post that prayer.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRequestText.trim()) return;

        try {
            const createdRequest = await createPrayerRequest({
                text: newRequestText,
                author: isAnonymous ? 'Anonymous' : (user?.displayName || 'A Community Member'),
                authorUid: user?.uid || undefined,
                prayerCount: 1,
                isAnonymous
            });
            if (createdRequest) {
                setRequests(prev => [createdRequest, ...prev]);
            }
            setNewRequestText('');
            setIsAnonymous(false);
            dispatchGamificationEvent('e5');
        } catch (err) {
            setLoadError(err instanceof Error ? err.message : 'Could not post that prayer request.');
        }
    };

    const totalPrayers = requests.reduce((acc, curr) => acc + (curr.prayerCount || 0), 0);
    const testimoniesCount = requests.filter(r => r.testimony).length;

    return (
        <div className="max-w-6xl mx-auto pb-20">

            {/* Header */}
            <motion.div
                className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
            >
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2">Community</p>
                    <h1 className="text-4xl font-black text-brand-text-primary mb-2 flex items-center gap-3"
                        style={{ fontFamily: 'var(--font-display)' }}>
                        <CommunityIcon className="w-9 h-9 text-brand-accent" />
                        The Community
                    </h1>
                    <p className="text-brand-text-secondary">
                        A global family united in prayer, faith, and purpose.
                    </p>
                </div>
                <div className="flex bg-brand-secondary p-1 rounded-full border border-brand-border">
                    <button
                        onClick={() => setActiveTab('lumina')}
                        className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'lumina' ? 'bg-brand-accent text-white shadow-lg' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}
                    >
                        <AiIcon className="w-4 h-4" /> Lumina Digest
                    </button>
                    <button
                        onClick={() => setActiveTab('wall')}
                        className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'wall' ? 'bg-brand-accent text-white shadow-lg' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}
                    >
                        <PrayingHandsIcon className="w-4 h-4" /> Prayer Wall
                    </button>
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                {activeTab === 'lumina' ? (
                    <motion.div
                        key="lumina"
                        variants={fadeUp} initial="hidden" animate="visible"
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: EASE }}
                        className="space-y-6"
                    >
                        <Card className="border-2 border-brand-accent/30 bg-gradient-to-br from-brand-dark to-brand-accent/5">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-brand-accent/20 flex items-center justify-center border border-brand-accent/50">
                                    <AiIcon className="w-6 h-6 text-brand-accent" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-brand-text-primary">Lumina Daily Digest</h2>
                                    <p className="text-sm text-brand-text-secondary">
                                        AI-synthesised insights from The Community · {new Date().toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Stats — real data only */}
                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
                                variants={stagger} initial="hidden" animate="visible"
                            >
                                <motion.div variants={fadeUp} transition={{ duration: 0.4, ease: EASE }}
                                    className="bg-brand-secondary p-4 rounded-xl border border-brand-border">
                                    <p className="text-xs font-bold text-brand-text-secondary uppercase mb-1">Prayers Offered</p>
                                    <p className="text-3xl font-black text-brand-text-primary">{totalPrayers.toLocaleString()}</p>
                                    <p className="text-xs text-brand-accent mt-1">Across all active requests</p>
                                </motion.div>
                                <motion.div variants={fadeUp} transition={{ duration: 0.4, ease: EASE }}
                                    className="bg-brand-secondary p-4 rounded-xl border border-brand-border">
                                    <p className="text-xs font-bold text-brand-text-secondary uppercase mb-1">Testimonies</p>
                                    <p className="text-3xl font-black text-brand-text-primary">{testimoniesCount}</p>
                                    <p className="text-xs text-brand-accent mt-1">Answered prayer stories shared</p>
                                </motion.div>
                            </motion.div>

                            {/* Community pulse */}
                            <div className="space-y-4">
                                <h3 className="text-base font-bold text-brand-text-primary flex items-center gap-2">
                                    <SparklesIcon className="w-5 h-5 text-brand-accent" />
                                    Community Pulse
                                </h3>
                                <p className="text-brand-text-secondary leading-relaxed bg-brand-secondary/50 p-4 rounded-xl border border-brand-border">
                                    {requests.length > 0
                                        ? `The community is praying across ${requests.length} active request${requests.length !== 1 ? 's' : ''} today${testimoniesCount > 0 ? `, with ${testimoniesCount} answered prayer stor${testimoniesCount !== 1 ? 'ies' : 'y'} to celebrate` : ''}.`
                                        : 'The prayer wall is quiet today. Be the first to bring a need.'}
                                </p>
                            </div>

                            {/* Admin-only section — hidden from non-admins */}
                            {isAdmin && (
                                <motion.div
                                    className="mt-6 pt-6 border-t border-brand-border"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <h3 className="text-xs font-bold text-status-error uppercase tracking-widest mb-3">
                                        Support Alerts — Admin
                                    </h3>
                                    <div className="p-3 bg-status-error/10 border border-status-error/30 rounded-xl">
                                        <p className="text-xs font-bold text-status-error mb-1">Review needed</p>
                                        <p className="text-sm text-brand-text-primary">
                                            Check the prayer wall for any requests flagged for pastoral follow-up.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="wall"
                        variants={fadeUp} initial="hidden" animate="visible"
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: EASE }}
                        className="flex flex-col md:flex-row gap-8"
                    >
                        {/* Left Column */}
                        <div className="md:w-1/3 space-y-6">
                            {/* Grounded Insights */}
                            <Card className="border-brand-accent/30 bg-brand-accent/5">
                                <h2 className="text-base font-bold text-brand-text-primary mb-4 flex items-center gap-2">
                                    <SearchIcon className="w-4 h-4 text-brand-accent" />
                                    Grounded Insights
                                </h2>
                                {isFetchingGrounded ? (
                                    <div className="py-6 text-center text-brand-text-secondary flex flex-col items-center">
                                        <SpinnerIcon className="w-7 h-7 mb-2 animate-spin text-brand-accent" />
                                        <p className="text-xs">Scanning global needs…</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {groundedTopics.map((topic, i) => (
                                            <div key={i} className="p-3 bg-brand-dark rounded-xl border border-brand-border">
                                                <p className="text-xs font-bold text-brand-accent uppercase mb-1">Global Need</p>
                                                <p className="text-sm font-bold text-brand-text-primary mb-1">{topic.title}</p>
                                                <p className="text-xs text-brand-text-secondary mb-3 line-clamp-2">{topic.snippet}</p>
                                                <button
                                                    onClick={() => addGroundedToWall(topic)}
                                                    className="w-full py-1.5 bg-brand-secondary text-brand-accent text-[12px] font-bold rounded-lg uppercase hover:bg-brand-accent hover:text-white transition-colors"
                                                >
                                                    Post to Prayer Wall
                                                </button>
                                            </div>
                                        ))}
                                        {groundedTopics.length === 0 && (
                                            <p className="text-xs text-brand-text-secondary text-center py-4">
                                                No new insights right now.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </Card>

                            {/* Submit request */}
                            <Card>
                                <h2 className="text-base font-bold text-brand-text-primary mb-4">Share a Request</h2>
                                <form onSubmit={handleSubmit}>
                                    <textarea
                                        value={newRequestText}
                                        onChange={(e) => setNewRequestText(e.target.value)}
                                        className="w-full h-24 p-3 bg-brand-secondary border border-brand-border rounded-xl text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none"
                                        placeholder="What's on your heart today?"
                                    />
                                    <div className="flex items-center gap-4 mt-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isAnonymous}
                                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                                className="w-4 h-4 rounded border-brand-border text-brand-accent focus:ring-brand-accent bg-brand-dark"
                                            />
                                            <span className="text-xs text-brand-text-secondary">Post anonymously</span>
                                        </label>
                                        <button
                                            type="submit"
                                            disabled={!newRequestText.trim()}
                                            className="flex-1 px-5 py-2 rounded-xl bg-brand-accent text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-opacity-90 transition-opacity disabled:opacity-40"
                                        >
                                            <SendIcon className="w-4 h-4" /> Post Prayer
                                        </button>
                                    </div>
                                </form>
                            </Card>
                        </div>

                        {/* Right Column: Prayer Wall */}
                        <div className="md:w-2/3">
                            {loadError && (
                                <Card className="mb-4 border-status-warning/40 bg-status-warning/10">
                                    <p className="text-sm text-brand-text-secondary">{loadError}</p>
                                </Card>
                            )}

                            {isLoading ? (
                                <div className="py-20 text-center">
                                    <SpinnerIcon className="w-10 h-10 text-brand-accent mx-auto mb-4 animate-spin" />
                                    <p className="text-brand-text-secondary text-sm">Loading prayer wall…</p>
                                </div>
                            ) : (
                                <motion.div
                                    className="space-y-4"
                                    variants={stagger} initial="hidden" animate="visible"
                                >
                                    {requests.map(req => (
                                        <motion.div key={req.id} variants={fadeUp} transition={{ duration: 0.35, ease: EASE }}>
                                            <Card className={req.author === 'Strategic Sentinel' ? 'border-brand-accent/50 bg-brand-accent/5' : ''}>
                                                <div className="flex items-center justify-between mb-3 text-xs text-brand-text-secondary">
                                                    <div className="flex items-center gap-2">
                                                        <UserIcon className="w-3 h-3" />
                                                        <span className="font-bold">{req.author}</span>
                                                    </div>
                                                    <span className={req.testimony ? 'text-status-success font-bold' : ''}>
                                                        {req.testimony ? 'Answered' : 'Ongoing'}
                                                    </span>
                                                </div>
                                                <p className={`text-brand-text-primary leading-relaxed ${req.author === 'Strategic Sentinel' ? 'italic' : ''}`}>
                                                    {req.text}
                                                </p>
                                                {req.testimony && (
                                                    <div className="mt-4 p-3 bg-status-success/10 border-l-4 border-status-success rounded-r-xl">
                                                        <p className="text-xs font-bold text-status-success uppercase mb-1">Answered</p>
                                                        <p className="text-sm text-brand-text-primary italic">{req.testimony}</p>
                                                    </div>
                                                )}
                                                <div className="mt-4 flex justify-end">
                                                    <button
                                                        onClick={() => handlePray(req.id)}
                                                        disabled={prayedFor.includes(req.id)}
                                                        className={`flex items-center gap-2 px-4 py-1.5 text-xs rounded-full font-bold transition-all ${
                                                            prayedFor.includes(req.id)
                                                                ? 'bg-status-success/20 text-status-success'
                                                                : 'bg-brand-secondary text-brand-text-secondary hover:bg-brand-border'
                                                        }`}
                                                    >
                                                        <PrayingHandsIcon className="w-4 h-4" />
                                                        {prayedFor.includes(req.id) ? 'Prayed' : 'I Am Praying'} ({req.prayerCount || 0})
                                                    </button>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ))}

                                    {requests.length === 0 && (
                                        <div className="py-20 text-center bg-brand-secondary/30 rounded-2xl border border-dashed border-brand-border">
                                            <PrayingHandsIcon className="w-12 h-12 text-brand-text-secondary/20 mx-auto mb-4" />
                                            <p className="text-brand-text-secondary">The prayer wall is quiet. Be the first to share a need.</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TheCommunity;
