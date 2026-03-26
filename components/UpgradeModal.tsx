import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { XIcon, CheckIcon, SparklesIcon, LockIcon } from './icons';
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
        // In a real app, we would fetch the user's country via IP geolocation
        // For this prototype, we'll simulate fetching it
        setUserCountry('US'); 
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
                                    Unlock {featureName || 'Premium Features'}
                                </h2>
                                <p className="text-sm text-brand-text-secondary mt-1">
                                    Choose the plan that best supports your spiritual journey.
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
                                
                                {/* Pro Tier */}
                                <div className={`relative p-6 rounded-xl border-2 ${requiredTier === 'pro' ? 'border-brand-accent bg-brand-accent/5' : 'border-brand-border bg-brand-dark/30'} flex flex-col`}>
                                    {requiredTier === 'pro' && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-accent text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                            Required
                                        </div>
                                    )}
                                    <h3 className="text-xl font-bold text-brand-text-primary mb-2">Pro</h3>
                                    <div className="mb-6">
                                        <span className="text-3xl font-black text-brand-text-primary">{proPrice.currencySymbol}{proPrice.discountedPriceUSD}</span>
                                        <span className="text-brand-text-secondary">/mo</span>
                                    </div>
                                    
                                    <ul className="space-y-3 mb-8 flex-1">
                                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                                            <CheckIcon className="w-5 h-5 text-brand-accent flex-shrink-0" />
                                            <span>Deeply personalized AI Devotionals</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                                            <CheckIcon className="w-5 h-5 text-brand-accent flex-shrink-0" />
                                            <span>Unlimited AI Spiritual Coach (Kai)</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                                            <CheckIcon className="w-5 h-5 text-brand-accent flex-shrink-0" />
                                            <span>Premium Audio Narration & Adaptive Music</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                                            <CheckIcon className="w-5 h-5 text-brand-accent flex-shrink-0" />
                                            <span>Access to Premium Courses</span>
                                        </li>
                                    </ul>
                                    
                                    <button onClick={handleUpgradeClick} className="w-full py-3 rounded-lg bg-brand-accent text-white font-bold hover:bg-opacity-90 transition-colors">
                                        Upgrade to Pro
                                    </button>
                                </div>

                                {/* Max Tier */}
                                <div className={`relative p-6 rounded-xl border-2 ${requiredTier === 'max' ? 'border-secondary-purple bg-secondary-purple/5' : 'border-brand-border bg-brand-dark/30'} flex flex-col`}>
                                    {requiredTier === 'max' && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary-purple text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                            Required
                                        </div>
                                    )}
                                    <h3 className="text-xl font-bold text-brand-text-primary flex items-center gap-2">
                                        Max <SparklesIcon className="w-5 h-5 text-secondary-purple" />
                                    </h3>
                                    <div className="mb-6">
                                        <span className="text-3xl font-black text-brand-text-primary">{maxPrice.currencySymbol}{maxPrice.discountedPriceUSD}</span>
                                        <span className="text-brand-text-secondary">/mo</span>
                                    </div>
                                    
                                    <ul className="space-y-3 mb-8 flex-1">
                                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                                            <CheckIcon className="w-5 h-5 text-secondary-purple flex-shrink-0" />
                                            <span className="font-bold text-brand-text-primary">Everything in Pro, plus:</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                                            <CheckIcon className="w-5 h-5 text-secondary-purple flex-shrink-0" />
                                            <span>Gemini Live Voice Companion</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                                            <CheckIcon className="w-5 h-5 text-secondary-purple flex-shrink-0" />
                                            <span>Veo Cinematic Video Backgrounds</span>
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
                                        Upgrade to Max
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
