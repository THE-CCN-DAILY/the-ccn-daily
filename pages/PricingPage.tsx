import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { SparklesIcon, CheckIcon, LockIcon } from '../components/icons';
import { getLocalizedPrice } from '../utils/ppp';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

const DEFAULT_FLUTTERWAVE_KEY = (import.meta as any).env.VITE_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-SANDBOXDEMOKEY-X';

const PricingPage: React.FC = () => {
    const { user } = useAuth();
    const { notify } = useNotifications();
    const [userCountry, setUserCountry] = useState('US');
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedTier, setSelectedTier] = useState<'pro' | 'max' | null>(null);
    const [activeDiscount, setActiveDiscount] = useState<{name: string, percentage: number, targetTier: string, targetBilling: string} | null>(null);
    const [flutterwaveKey, setFlutterwaveKey] = useState(DEFAULT_FLUTTERWAVE_KEY);

    useEffect(() => {
        setUserCountry('US'); // Simulate IP geolocation
        fetchActiveDiscount();
        fetchPaymentSettings();
    }, [billingCycle]);

    const fetchPaymentSettings = async () => {
        try {
            const docRef = doc(db, 'settings', 'payment_settings');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().flutterwavePublicKey) {
                setFlutterwaveKey(docSnap.data().flutterwavePublicKey);
            }
        } catch (error) {
            console.error("Error fetching payment settings:", error);
        }
    };

    const fetchActiveDiscount = async () => {
        try {
            const q = query(collection(db, 'settings'), where('isActive', '==', true));
            const querySnapshot = await getDocs(q);
            
            const now = new Date();
            let bestDiscount = null;

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const startDate = data.startDate?.toDate();
                const endDate = data.endDate?.toDate();

                if (startDate && endDate && now >= startDate && now <= endDate) {
                    // Check if it matches current billing cycle or is for 'both'
                    const matchesBilling = data.targetBilling === 'both' || data.targetBilling === billingCycle;
                    
                    if (matchesBilling) {
                        if (!bestDiscount || data.percentage > bestDiscount.percentage) {
                            bestDiscount = { 
                                name: data.name, 
                                percentage: data.percentage,
                                targetTier: data.targetTier || 'all',
                                targetBilling: data.targetBilling || 'both'
                            };
                        }
                    }
                }
            });

            setActiveDiscount(bestDiscount);
        } catch (error) {
            console.error("Error fetching discounts:", error);
        }
    };

    const proPrice = getLocalizedPrice(7.99, userCountry);
    const maxPrice = getLocalizedPrice(14.99, userCountry);

    const getAmount = (tier: 'pro' | 'max') => {
        const basePrice = tier === 'pro' ? proPrice.discountedPriceUSD : maxPrice.discountedPriceUSD;
        let finalPrice = basePrice;
        
        if (billingCycle === 'yearly') {
            finalPrice = basePrice * 12 * 0.8; // 20% off for yearly
        }
        
        if (activeDiscount) {
            // Only apply if it targets this tier or 'all'
            if (activeDiscount.targetTier === 'all' || activeDiscount.targetTier === tier) {
                finalPrice = finalPrice * (1 - (activeDiscount.percentage / 100));
            }
        }
        
        return finalPrice;
    };

    const handleFlutterPayment = useFlutterwave({
        public_key: flutterwaveKey,
        tx_ref: `sub_${Date.now()}`,
        amount: selectedTier ? getAmount(selectedTier) : 0,
        currency: 'USD',
        payment_options: 'card,mobilemoney,ussd',
        customer: {
            email: user?.email || 'user@example.com',
            phone_number: '',
            name: user?.displayName || 'App User',
        },
        customizations: {
            title: 'Project Phoenix Subscription',
            description: `${selectedTier?.toUpperCase()} Tier - ${billingCycle} billing`,
            logo: 'https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg',
        },
    });

    const handleSubscribe = (tier: 'pro' | 'max') => {
        if (!user) {
            notify("Please sign in to subscribe.", 'error');
            return;
        }
        
        setSelectedTier(tier);
        setIsProcessing(true);

        // We need a small timeout to let the state update before calling the hook
        setTimeout(() => {
            handleFlutterPayment({
                callback: async (response) => {
                    console.log(response);
                    closePaymentModal();
                    if (response.status === 'successful') {
                        await updateUserTier(tier);
                    } else {
                        setIsProcessing(false);
                        notify("Payment was not successful. Please try again.", 'error');
                    }
                },
                onClose: () => {
                    setIsProcessing(false);
                },
            });
        }, 100);
    };

    const updateUserTier = async (tier: 'pro' | 'max') => {
        if (!user) return;
        try {
            await setDoc(doc(db, 'users', user.uid), {
                tier: tier,
                subscriptionStatus: 'active',
                billingCycle: billingCycle,
                updatedAt: serverTimestamp()
            }, { merge: true });
            
            setIsProcessing(false);
            notify(`Successfully subscribed to ${tier.toUpperCase()} tier!`, 'success');
            // In a real app, you might want to refresh the user context here
            window.location.reload();
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-20 px-4">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-black text-brand-text-primary mb-6">
                    Invest in Your Spiritual Growth
                </h1>
                <p className="text-xl text-brand-text-secondary max-w-2xl mx-auto">
                    Choose a plan that fits your journey. Our pricing is adjusted for your region ({userCountry}) to ensure global accessibility.
                </p>
                
                <div className="mt-10 inline-flex bg-brand-dark rounded-full p-1 border border-brand-border">
                    <button 
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-colors ${billingCycle === 'monthly' ? 'bg-brand-accent text-white' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}
                    >
                        Monthly
                    </button>
                    <button 
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-brand-accent text-white' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}
                    >
                        Yearly <span className="text-[10px] bg-status-success/20 text-status-success px-2 py-0.5 rounded-full">Save 20%</span>
                    </button>
                </div>
                {activeDiscount && (
                    <div className="mt-4 inline-block bg-brand-accent/10 border border-brand-accent/30 rounded-lg px-4 py-2">
                        <p className="text-sm font-bold text-brand-accent flex items-center gap-2">
                            <SparklesIcon className="w-4 h-4" />
                            {activeDiscount.name}: Extra {activeDiscount.percentage}% OFF applied to {activeDiscount.targetTier === 'all' ? 'all plans' : `${activeDiscount.targetTier.toUpperCase()} plan`}!
                        </p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Free Tier */}
                <Card className="flex flex-col border-brand-border bg-brand-dark/30">
                    <div className="mb-8">
                        <h3 className="text-2xl font-bold text-brand-text-primary mb-2">Free</h3>
                        <p className="text-brand-text-secondary text-sm h-10">Essential tools for daily reflection.</p>
                        <div className="mt-6 flex items-baseline">
                            <span className="text-4xl font-black text-brand-text-primary">$0</span>
                            <span className="text-brand-text-secondary ml-2">/forever</span>
                        </div>
                    </div>
                    
                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                            <CheckIcon className="w-5 h-5 text-brand-text-primary flex-shrink-0" />
                            <span>Daily Base Devotionals</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                            <CheckIcon className="w-5 h-5 text-brand-text-primary flex-shrink-0" />
                            <span>Basic AI Coach (10 msgs/day)</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                            <CheckIcon className="w-5 h-5 text-brand-text-primary flex-shrink-0" />
                            <span>Journaling & Prayer Wall</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                            <CheckIcon className="w-5 h-5 text-brand-text-primary flex-shrink-0" />
                            <span>Access to Free Resources</span>
                        </li>
                    </ul>
                    
                    <button 
                        disabled
                        className="w-full py-3 rounded-xl bg-brand-secondary text-brand-text-secondary font-bold border border-brand-border cursor-not-allowed"
                    >
                        Current Plan
                    </button>
                </Card>

                {/* Pro Tier */}
                <Card className="flex flex-col border-brand-accent relative transform md:-translate-y-4 shadow-2xl shadow-brand-accent/10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-accent text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                        Most Popular
                    </div>
                    <div className="mb-8">
                        <h3 className="text-2xl font-bold text-brand-text-primary mb-2">Pro</h3>
                        <p className="text-brand-text-secondary text-sm h-10">Deep personalization and unlimited guidance.</p>
                        <div className="mt-6 flex items-baseline">
                            <span className="text-4xl font-black text-brand-text-primary">
                                {billingCycle === 'monthly' ? `${proPrice.currencySymbol}${proPrice.discountedPriceUSD}` : `${proPrice.currencySymbol}${(proPrice.discountedPriceUSD * 12 * 0.8).toFixed(2)}`}
                            </span>
                            <span className="text-brand-text-secondary ml-2">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                        </div>
                    </div>
                    
                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                            <CheckIcon className="w-5 h-5 text-brand-accent flex-shrink-0" />
                            <span className="font-bold text-brand-text-primary">Deeply Personalized AI Devotionals</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                            <CheckIcon className="w-5 h-5 text-brand-accent flex-shrink-0" />
                            <span>Unlimited AI Spiritual Coach</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                            <CheckIcon className="w-5 h-5 text-brand-accent flex-shrink-0" />
                            <span>Premium Audio & Adaptive Music</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                            <CheckIcon className="w-5 h-5 text-brand-accent flex-shrink-0" />
                            <span>Access to Premium Courses</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                            <CheckIcon className="w-5 h-5 text-brand-accent flex-shrink-0" />
                            <span>AI Quote Image Generation</span>
                        </li>
                    </ul>
                    
                    <button 
                        onClick={() => handleSubscribe('pro')}
                        disabled={isProcessing}
                        className={`w-full py-3 rounded-xl font-bold transition-colors shadow-lg shadow-brand-accent/20 ${isProcessing && selectedTier === 'pro' ? 'bg-brand-secondary text-brand-text-secondary cursor-wait' : 'bg-brand-accent text-white hover:bg-opacity-90'}`}
                    >
                        {isProcessing && selectedTier === 'pro' ? 'Processing...' : 'Subscribe to Pro'}
                    </button>
                </Card>

                {/* Max Tier */}
                <Card className="flex flex-col border-secondary-purple bg-secondary-purple/5">
                    <div className="mb-8">
                        <h3 className="text-2xl font-bold text-brand-text-primary mb-2 flex items-center gap-2">
                            Max <SparklesIcon className="w-6 h-6 text-secondary-purple" />
                        </h3>
                        <p className="text-brand-text-secondary text-sm h-10">The ultimate immersive spiritual experience.</p>
                        <div className="mt-6 flex items-baseline">
                            <span className="text-4xl font-black text-brand-text-primary">
                                {billingCycle === 'monthly' ? `${maxPrice.currencySymbol}${maxPrice.discountedPriceUSD}` : `${maxPrice.currencySymbol}${(maxPrice.discountedPriceUSD * 12 * 0.8).toFixed(2)}`}
                            </span>
                            <span className="text-brand-text-secondary ml-2">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                        </div>
                    </div>
                    
                    <ul className="space-y-4 mb-8 flex-1">
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
                        <li className="flex items-start gap-3 text-sm text-brand-text-secondary">
                            <CheckIcon className="w-5 h-5 text-secondary-purple flex-shrink-0" />
                            <span>Grounded Intercession (Real-time news)</span>
                        </li>
                    </ul>
                    
                    <button 
                        onClick={() => handleSubscribe('max')}
                        disabled={isProcessing}
                        className={`w-full py-3 rounded-xl font-bold transition-colors shadow-lg shadow-secondary-purple/20 ${isProcessing && selectedTier === 'max' ? 'bg-brand-secondary text-brand-text-secondary cursor-wait' : 'bg-secondary-purple text-white hover:bg-opacity-90'}`}
                    >
                        {isProcessing && selectedTier === 'max' ? 'Processing...' : 'Subscribe to Max'}
                    </button>
                </Card>
            </div>
            
            <div className="mt-16 bg-brand-dark rounded-2xl p-8 border border-brand-border text-center">
                <h3 className="text-2xl font-bold text-brand-text-primary mb-4">Want to gift a subscription?</h3>
                <p className="text-brand-text-secondary mb-6 max-w-2xl mx-auto">
                    Bless someone else with access to premium spiritual growth tools. You can purchase a Pro or Max subscription for a friend or family member.
                </p>
                <button className="px-8 py-3 rounded-xl bg-brand-secondary text-brand-text-primary font-bold border border-brand-border hover:bg-brand-dark transition-colors">
                    Gift a Subscription
                </button>
            </div>
        </div>
    );
};

export default PricingPage;
