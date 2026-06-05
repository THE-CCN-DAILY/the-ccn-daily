import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { XIcon, CheckIcon, LockIcon } from './icons';
import { getLocalizedPrice } from '../utils/ppp';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    featureName?: string;
    requiredTier?: 'free' | 'pro' | 'max';
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, featureName, requiredTier = 'pro' }) => {
    const [userCountry, setUserCountry] = useState('US');
    const navigate = useNavigate();

    useEffect(() => {
        // Real geo from Cloudflare's edge trace (same origin, no dependency) so prices
        // show in the visitor's local currency. Billing remains USD.
        let mounted = true;
        (async () => {
            try {
                const res = await fetch('/cdn-cgi/trace');
                const text = await res.text();
                const match = text.match(/^loc=([A-Z]{2})$/m);
                if (mounted && match?.[1]) setUserCountry(match[1]);
            } catch {
                // Keep default country on failure.
            }
        })();
        return () => { mounted = false; };
    }, []);

    if (!isOpen) return null;

    const proPrice = getLocalizedPrice(7.99, userCountry);
    const maxPrice = getLocalizedPrice(14.99, userCountry);

    const handleUpgradeClick = () => {
        onClose();
        navigate('/pricing');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-4xl bg-brand-secondary rounded-2xl shadow-2xl overflow-hidden border border-brand-border flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-brand-border bg-brand-dark/50">
                            <div>
                                <h2 className="text-2xl font-bold text-brand-text-primary flex items-center gap-2">
                                    <LockIcon className="w-6 h-6 text-brand-accent" />
                                    Access {featureName || 'Growth Tools'}
                                </h2>
                                <p className="text-sm text-brand-text-secondary mt-1">
                                    Choose the plan that fits where you are right now.
                                </p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-dark rounded-full transition-colors"
                            >
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* Growth plan */}
                                <div className={`relative p-6 rounded-xl border-2 ${requiredTier === 'pro' ? 'border-brand-accent bg-brand-accent/5' : 'border-brand-border bg-brand-dark/30'} flex flex-col`}>
                                    {requiredTier === 'pro' && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-accent text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                            Required
                                        </div>
                                    )}
                                    <h3 className="text-xl font-bold text-brand-text-primary mb-2">Growth</h3>
                                    <div className="mb-6">
                                        <span className="text-3xl font-black text-brand-text-primary">{proPrice.formattedLocal}</span>
                                        <span className="text-brand-text-secondary">/mo</span>
                                    </div>
                                    
                                    <ul className="space-y-3 mb-8 flex-1">
                                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                                            <CheckIcon className="w-5 h-5 text-brand-accent flex-shrink-0" />
                                            <span>Daily reflections shaped around your walk with God</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                                            <CheckIcon className="w-5 h-5 text-brand-accent flex-shrink-0" />
                                            <span>Guided prayer and Scripture-aware reflection</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                                            <CheckIcon className="w-5 h-5 text-brand-accent flex-shrink-0" />
                                            <span>Premium audio narration and quiet prayer music</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                                            <CheckIcon className="w-5 h-5 text-brand-accent flex-shrink-0" />
                                            <span>Access to the course library</span>
                                        </li>
                                    </ul>
                                    
                                    <button onClick={handleUpgradeClick} className="w-full py-3 rounded-lg bg-brand-accent text-white font-bold hover:bg-opacity-90 transition-colors">
                                        Choose Growth
                                    </button>
                                </div>

                                {/* Family plan */}
                                <div className={`relative p-6 rounded-xl border-2 ${requiredTier === 'max' ? 'border-secondary-purple bg-secondary-purple/5' : 'border-brand-border bg-brand-dark/30'} flex flex-col`}>
                                    {requiredTier === 'max' && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary-purple text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                            Required
                                        </div>
                                    )}
                                    <h3 className="text-xl font-bold text-brand-text-primary flex items-center gap-2">
                                        Family <Crown className="w-5 h-5 text-secondary-purple" />
                                    </h3>
                                    <div className="mb-6">
                                        <span className="text-3xl font-black text-brand-text-primary">{maxPrice.formattedLocal}</span>
                                        <span className="text-brand-text-secondary">/mo</span>
                                    </div>
                                    
                                    <ul className="space-y-3 mb-8 flex-1">
                                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                                            <CheckIcon className="w-5 h-5 text-secondary-purple flex-shrink-0" />
                                            <span className="font-bold text-brand-text-primary">Everything in Growth, plus:</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                                            <CheckIcon className="w-5 h-5 text-secondary-purple flex-shrink-0" />
                                            <span>Guided voice prayer</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                                            <CheckIcon className="w-5 h-5 text-secondary-purple flex-shrink-0" />
                                            <span>Visual Sanctuary prayer space</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                                            <CheckIcon className="w-5 h-5 text-secondary-purple flex-shrink-0" />
                                            <span>Exclusive Masterclasses</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                                            <CheckIcon className="w-5 h-5 text-secondary-purple flex-shrink-0" />
                                            <span>Family & Small Group Sharing</span>
                                        </li>
                                    </ul>
                                    
                                    <button onClick={handleUpgradeClick} className="w-full py-3 rounded-lg bg-secondary-purple text-white font-bold hover:bg-opacity-90 transition-colors">
                                        Choose Family
                                    </button>
                                </div>

                            </div>
                            
                            <div className="mt-6 text-center">
                                <p className="text-xs text-brand-text-secondary">
                                    Prices are adjusted for your region ({userCountry}) to ensure global affordability.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default UpgradeModal;
