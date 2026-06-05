import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Gift, Link2 } from 'lucide-react';
import Card from '../components/Card';
import { GiftIcon, ReaderIcon, SpeakerWaveIcon, SendIcon, CheckIcon, CloseIcon, SpinnerIcon, CommunityIcon } from '../components/icons';
import { sendGiftEmail } from '../services/emailService';

interface GiftableItem {
    id: string;
    type: 'devotional' | 'challenge' | 'course';
    title: string;
    description: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    isPremium: boolean;
}

// Placeholder — replace with Firestore gifting data
const mockGiftableItems: GiftableItem[] = [
    {
        id: 'dev1',
        type: 'devotional',
        title: 'Faith in the Fire (Substack)',
        description: 'A daily devotional on holding peace during trials — anchored in Scripture.',
        icon: ReaderIcon,
        isPremium: false,
    },
    {
        id: 'chal1',
        type: 'challenge',
        title: '40-Day Spiritual Sprint',
        description: 'Invite a friend to join this community challenge directly.',
        icon: CommunityIcon,
        isPremium: false,
    },
    {
        id: 'course1',
        type: 'course',
        title: 'The Art of Prayer: Masterclass',
        description: 'Gift full access to this premium 8-part audio series.',
        icon: SpeakerWaveIcon,
        isPremium: true,
    }
];

const GraceLinkModal: React.FC<{
    item: GiftableItem;
    onClose: () => void;
}> = ({ item, onClose }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [copied, setCopied] = useState(false);

    const handleGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setGeneratedLink(`https://theccndaily.app/grace/${item.id}-${Math.random().toString(36).substring(7)}`);
            setIsGenerating(false);
        }, 1500);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center" onClick={onClose}>
            <div 
                className="bg-brand-secondary rounded-xl shadow-lg w-full max-w-md p-6 m-4 animate-fade-in-up"
                onClick={e => e.stopPropagation()}
                style={{ animationDuration: '0.3s' }}
            >
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-text-primary mb-1 flex items-center gap-2">
                            <Gift className="w-6 h-6" style={{ color: 'var(--amber-ds, #E87A2C)' }}/>
                            Create Grace Link
                        </h2>
                        <p className="text-sm text-brand-text-secondary">Frictionless sharing for "{item.title}"</p>
                    </div>
                    <button onClick={onClose} className="p-1 -mr-2 -mt-2 text-brand-text-secondary hover:text-brand-text-primary">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>

                {!generatedLink ? (
                    <div className="space-y-6">
                        <div className="bg-brand-dark p-4 rounded-xl border border-brand-border">
                            <p className="text-xs font-bold text-brand-accent uppercase mb-2">How it works</p>
                            <p className="text-sm text-brand-text-secondary">
                                A Grace Link allows anyone to instantly view this content in their browser. 
                                No app download or account creation is required to start reading or listening.
                            </p>
                        </div>
                        
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full py-3 rounded-xl bg-brand-accent hover:bg-opacity-90 text-white font-bold shadow-md disabled:bg-opacity-50 flex items-center justify-center gap-2 transition-all"
                        >
                            {isGenerating ? <><SpinnerIcon className="w-5 h-5"/> Preparing Secure Link...</> : <><Gift className="w-5 h-5"/> Prepare Grace Link</>}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-brand-dark p-4 rounded-xl border border-brand-accent/30 text-center">
                            <CheckIcon className="w-12 h-12 text-status-success mx-auto mb-2"/>
                            <p className="text-sm font-bold text-brand-text-primary mb-1">Link Ready to Share</p>
                            <p className="text-xs text-brand-text-secondary">Ready to share via WhatsApp, iMessage, or Social Media.</p>
                        </div>

                        <div className="flex items-center gap-2 bg-brand-secondary border border-brand-border p-2 rounded-lg">
                            <input 
                                type="text" 
                                readOnly 
                                value={generatedLink} 
                                className="flex-1 bg-transparent text-sm text-brand-text-primary outline-none px-2"
                            />
                            <button 
                                onClick={handleCopy}
                                className={`px-4 py-2 rounded text-xs font-bold transition-colors ${copied ? 'bg-status-success text-white' : 'bg-brand-accent text-white hover:bg-opacity-90'}`}
                            >
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const GraceLinkPage: React.FC = () => {
    const [selectedItem, setSelectedItem] = useState<GiftableItem | null>(null);

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2">COMMUNITY</p>
              <h1 className="text-4xl font-black text-brand-text-primary mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Grace Links
              </h1>
              <p className="text-brand-text-secondary">Share digital gifts of faith — devotionals, songs, and Scripture — with someone who needs them.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockGiftableItems.map(item => (
                    <Card key={item.id} className="flex flex-col relative overflow-hidden">
                        {item.isPremium && (
                            <div className="absolute top-3 right-3 bg-brand-accent/20 text-brand-accent text-[12px] font-bold px-2 py-1 rounded uppercase">
                                Premium Gift
                            </div>
                        )}
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--amber-ds, #E87A2C)1A', border: '1px solid var(--amber-ds, #E87A2C)33' }}>
                            <Gift className="w-6 h-6" style={{ color: 'var(--amber-ds, #E87A2C)' }} />
                        </div>
                        <div className="flex-grow">
                            <h3 className="text-xl font-bold text-brand-text-primary">{item.title}</h3>
                            <p className="text-sm text-brand-text-secondary mt-1">{item.description}</p>
                        </div>
                        <div className="mt-6">
                            <button
                                onClick={() => setSelectedItem(item)}
                                className="w-full px-4 py-3 rounded-xl bg-brand-secondary border border-brand-border text-brand-text-primary font-bold hover:bg-brand-accent hover:text-white hover:border-brand-accent transition-all flex items-center justify-center gap-2"
                            >
                                <Link2 className="w-5 h-5"/>
                                {item.isPremium ? 'Purchase & Share Link' : 'Prepare Share Link'}
                            </button>
                        </div>
                    </Card>
                ))}
            </div>

            {selectedItem && (
                <GraceLinkModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                />
            )}
        </div>
    );
};

export default GraceLinkPage;
