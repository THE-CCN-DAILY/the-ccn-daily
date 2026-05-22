
import React, { useState } from 'react';
import { motion } from 'motion/react';
import Card from '../components/Card';
import { SparklesIcon, SpinnerIcon, PaintBrushIcon, DownloadIcon, ChevronLeftIcon } from '../components/icons';
import { generateSanctuaryVideo } from '../services/geminiService';

import { useNotifications } from '../contexts/NotificationContext';

const VisualSanctuary: React.FC = () => {
    const { notify } = useNotifications();
    const [prompt, setPrompt] = useState('A serene garden at sunset with golden light filtering through ancient oak trees, extremely peaceful and spiritual.');
    const [isGenerating, setIsGenerating] = useState(false);
    const [progressMsg, setProgressMsg] = useState('');
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        setGeneratedUrl(null);
        setProgressMsg('Connecting to Veo Cinematic Engine...');
        try {
            const url = await generateSanctuaryVideo(prompt, (msg) => setProgressMsg(msg));
            setGeneratedUrl(url);
        } catch (e) {
            notify("Video generation failed. Ensure your API key is active and supports Veo.", "error");
        } finally {
            setIsGenerating(false);
            setProgressMsg('');
        }
    };

    return (
        <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
            <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--sans-ui)', color: 'var(--crimson, #8E1B1B)' }}>Pray</p>
                <h1 className="text-4xl font-black text-brand-text-primary mb-2" style={{ fontFamily: 'var(--serif-display)' }}>
                    Visual Sanctuary
                </h1>
                <p className="text-brand-text-secondary">A space for meditation, sacred imagery, and visual prayer.</p>
            </motion.div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
                <div className="lg:col-span-1 space-y-6">
                    <Card className="h-full">
                        <h2 className="text-lg font-bold text-brand-text-primary mb-4">Design Space</h2>
                        <p className="text-xs text-brand-text-secondary mb-4">Describe the atmosphere you want to inhabit in prayer — the light, the place, the sacred mood.</p>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full h-32 p-3 bg-brand-secondary border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                            placeholder="e.g., Mount Zion at dawn..."
                        />
                        <button 
                            onClick={handleGenerate}
                            disabled={true}
                            className="w-full mt-4 py-3 bg-brand-secondary text-brand-text-secondary rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed opacity-75"
                        >
                            <SparklesIcon className="w-5 h-5"/> Premium Feature
                        </button>

                        <div className="mt-8 pt-8 border-t border-brand-border">
                            <h3 className="text-xs font-black uppercase text-brand-text-secondary tracking-widest mb-4">Premium access</h3>
                            <div className="p-4 bg-brand-accent/10 rounded-xl border border-brand-accent/30">
                                <p className="text-[12px] font-bold text-brand-accent mb-1">Cinematic sanctuary video</p>
                                <p className="text-[12px] text-brand-text-secondary leading-tight">Video generation is currently reserved for Premium members to ensure sustainable resource allocation.</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-3">
                    <Card className="h-full flex flex-col items-center justify-center relative overflow-hidden group p-0 border-none bg-brand-dark">
                        {!generatedUrl && !isGenerating && (
                            <div className="text-center p-12 max-w-md">
                                <div className="mb-6 inline-flex items-center px-3 py-1 rounded-full bg-brand-accent/10 text-brand-accent text-xs font-bold uppercase tracking-wider border border-brand-accent/20">
                                    Premium Tier
                                </div>
                                <div className="w-20 h-20 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <PaintBrushIcon className="w-10 h-10 text-brand-accent opacity-20"/>
                                </div>
                                <h3 className="text-xl font-bold text-brand-text-primary mb-2">Awaiting Vision</h3>
                                <p className="text-sm text-brand-text-secondary leading-relaxed">Cinematic sanctuary generation is reserved for premium members while we keep the free plan stable and useful.</p>
                            </div>
                        )}

                        {isGenerating && (
                            <div className="text-center">
                                <div className="relative w-24 h-24 mx-auto mb-6">
                                    <div className="absolute inset-0 border-4 border-brand-accent/20 rounded-full"></div>
                                    <div className="absolute inset-0 border-t-4 border-brand-accent rounded-full animate-spin"></div>
                                    <SparklesIcon className="w-8 h-8 text-brand-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse"/>
                                </div>
                                <p className="text-brand-accent font-black uppercase tracking-[0.2em] text-xs mb-2">Architecting Sanctuary...</p>
                                <p className="text-brand-text-secondary text-xs">{progressMsg}</p>
                            </div>
                        )}

                        {generatedUrl && (
                            <div className="w-full h-full animate-fade-in relative group">
                                <video src={generatedUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-white font-bold text-lg">Your Spiritual Space</p>
                                            <p className="text-white/80 text-xs truncate max-w-md">{prompt}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <a href={generatedUrl} target="_blank" rel="noreferrer" className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40">
                                                <DownloadIcon className="w-5 h-5"/>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default VisualSanctuary;
