import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { SparklesIcon, CheckIcon } from '../components/icons';
import { getLocalizedPrice } from '../utils/ppp';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { trackAnalyticsEvent, nowIso } from '../services/analyticsService';
import { useExperiment } from '../hooks/useExperiment';
import { getTierLabel } from '../types/pricing';

const DEFAULT_FLUTTERWAVE_KEY = (import.meta as any).env.VITE_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-SANDBOXDEMOKEY-X';

type PaidTier = 'pro' | 'max';

const PLAN_UI = {
  free: {
    label: getTierLabel('free'),
    tagline: 'Build a daily spiritual rhythm.',
    bullets: [
      'Daily human-written devotional',
      'Weekly devotional newsletter',
      'Basic Bible reader + notes',
      'Open community challenges',
      'Weekly devotional podcast (audio)',
    ],
    support: 'Smart assistance included where helpful.',
    cta: 'Current Plan',
  },
  pro: {
    label: getTierLabel('pro'),
    tagline: 'Go deeper with structured formation paths.',
    bullets: [
      'Premium courses and study packs',
      'Subscriber audiobook library (standard)',
      'Challenge archive + premium discussion rooms',
      'Journaling templates and progress tools',
      'Discounted premium events',
    ],
    support: 'Includes smart guidance tools in context.',
    cta: 'Choose Growth',
    badge: 'Most Popular',
  },
  max: {
    label: getTierLabel('max'),
    tagline: 'Grow together with shared progress.',
    bullets: [
      'Everything in Growth',
      'Up to 5 seats',
      'Shared family challenges',
      'Household progress dashboard',
      'Group prayer/discussion spaces',
    ],
    support: 'Smart assistance is included, never intrusive.',
    cta: 'Choose Family',
  },
} as const;

const OWNERSHIP_NOTES = [
  'Books, courses, and audiobooks can be purchased once and kept forever.',
  'Subscriptions include rotating premium libraries and live/community experiences.',
  'Premium events can be included, discounted, or ticketed per plan.',
];

const PricingPage: React.FC = () => {
  const { user } = useAuth();
  const { notify } = useNotifications();

  const [userCountry, setUserCountry] = useState('US');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PaidTier | null>(null);
  const [activeDiscount, setActiveDiscount] = useState<{ name: string; percentage: number; targetTier: string; targetBilling: string } | null>(null);
  const [flutterwaveKey, setFlutterwaveKey] = useState(DEFAULT_FLUTTERWAVE_KEY);

  const paywallVariant = useExperiment(user?.uid, 'paywall_layout_v1');

  useEffect(() => {
    setUserCountry('US'); // Simulated geo for PPP
    fetchActiveDiscount();
    fetchPaymentSettings();

    trackAnalyticsEvent({
      name: 'paywall_viewed',
      userId: user?.uid,
      tier: (user?.tier as any) || 'free',
      route: '/pricing',
      timestamp: nowIso(),
      experiments: { paywall_layout_v1: paywallVariant },
    });
  }, [billingCycle, paywallVariant]);

  const fetchPaymentSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'payment_settings');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().flutterwavePublicKey) {
        setFlutterwaveKey(docSnap.data().flutterwavePublicKey);
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

  const fetchActiveDiscount = async () => {
    try {
      const q = query(collection(db, 'settings'), where('isActive', '==', true));
      const querySnapshot = await getDocs(q);

      const now = new Date();
      let bestDiscount: { name: string; percentage: number; targetTier: string; targetBilling: string } | null = null;

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const startDate = data.startDate?.toDate();
        const endDate = data.endDate?.toDate();

        if (startDate && endDate && now >= startDate && now <= endDate) {
          const matchesBilling = data.targetBilling === 'both' || data.targetBilling === billingCycle;
          if (matchesBilling) {
            if (!bestDiscount || data.percentage > bestDiscount.percentage) {
              bestDiscount = {
                name: data.name,
                percentage: data.percentage,
                targetTier: data.targetTier || 'all',
                targetBilling: data.targetBilling || 'both',
              };
            }
          }
        }
      });

      setActiveDiscount(bestDiscount);
    } catch (error) {
      console.error('Error fetching discounts:', error);
    }
  };

  const proPrice = getLocalizedPrice(9.99, userCountry);
  const maxPrice = getLocalizedPrice(19.99, userCountry);

  const getAmount = (tier: PaidTier) => {
    const basePrice = tier === 'pro' ? proPrice.discountedPriceUSD : maxPrice.discountedPriceUSD;
    let finalPrice = basePrice;

    if (billingCycle === 'yearly') {
      finalPrice = basePrice * 12 * 0.8; // 20% annual discount
    }

    if (activeDiscount && (activeDiscount.targetTier === 'all' || activeDiscount.targetTier === tier)) {
      finalPrice = finalPrice * (1 - activeDiscount.percentage / 100);
    }

    return Number(finalPrice.toFixed(2));
  };

  const formatPrice = (tier: PaidTier) => {
    const currencySymbol = tier === 'pro' ? proPrice.currencySymbol : maxPrice.currencySymbol;
    const amount = getAmount(tier);
    return `${currencySymbol}${amount}`;
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
      description: `${selectedTier?.toUpperCase()} - ${billingCycle} billing`,
      logo: 'https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg',
    },
  });

  const handleSubscribe = (tier: PaidTier) => {
    if (!user) {
      notify('Please sign in to subscribe.', 'error');
      return;
    }

    setSelectedTier(tier);
    setIsProcessing(true);

    trackAnalyticsEvent({
      name: 'plan_selected',
      userId: user?.uid,
      tier: (user?.tier as any) || 'free',
      route: '/pricing',
      timestamp: nowIso(),
      meta: { selectedTier: tier, billingCycle },
    });

    trackAnalyticsEvent({
      name: 'purchase_started',
      userId: user?.uid,
      tier: (user?.tier as any) || 'free',
      route: '/pricing',
      timestamp: nowIso(),
      meta: { tier, billingCycle },
    });

    setTimeout(() => {
      handleFlutterPayment({
        callback: async (response) => {
          closePaymentModal();
          if (response.status === 'successful') {
            trackAnalyticsEvent({
              name: 'purchase_completed',
              userId: user?.uid,
              tier: (user?.tier as any) || 'free',
              route: '/pricing',
              timestamp: nowIso(),
              meta: { tier, billingCycle, tx_ref: response.tx_ref },
            });
            await updateUserTier(tier);
          } else {
            setIsProcessing(false);
            trackAnalyticsEvent({
              name: 'purchase_failed',
              userId: user?.uid,
              tier: (user?.tier as any) || 'free',
              route: '/pricing',
              timestamp: nowIso(),
              meta: { tier, billingCycle, status: response.status },
            });
            notify('Payment was not successful. Please try again.', 'error');
          }
        },
        onClose: () => {
          setIsProcessing(false);
        },
      });
    }, 100);
  };

  const updateUserTier = async (tier: PaidTier) => {
    if (!user) return;
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          tier,
          subscriptionStatus: 'active',
          billingCycle,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setIsProcessing(false);
      notify(`Successfully subscribed to ${getTierLabel(tier)}!`, 'success');
      window.location.reload();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-brand-text-primary mb-6">
          Choose Your Growth Path
        </h1>
        <p className="text-xl text-brand-text-secondary max-w-3xl mx-auto">
          Scripture depth, structured practice, and community accountability for every season of your journey.
        </p>

        <div className="mt-10 inline-flex bg-brand-dark rounded-full p-1 border border-brand-border">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-brand-accent text-white'
                : 'text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-2 ${
              billingCycle === 'yearly'
                ? 'bg-brand-accent text-white'
                : 'text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            Yearly <span className="text-[10px] bg-status-success/20 text-status-success px-2 py-0.5 rounded-full">Save 20%</span>
          </button>
        </div>

        {activeDiscount && (
          <div className="mt-4 inline-block bg-brand-accent/10 border border-brand-accent/30 rounded-lg px-4 py-2">
            <p className="text-sm font-bold text-brand-accent flex items-center gap-2">
              <SparklesIcon className="w-4 h-4" />
              {activeDiscount.name}: Extra {activeDiscount.percentage}% OFF
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Foundation */}
        <Card className="flex flex-col border-brand-border bg-brand-dark/30">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-brand-text-primary mb-2">{PLAN_UI.free.label}</h3>
            <p className="text-brand-text-secondary text-sm h-10">{PLAN_UI.free.tagline}</p>
            <div className="mt-6 flex items-baseline">
              <span className="text-4xl font-black text-brand-text-primary">$0</span>
              <span className="text-brand-text-secondary ml-2">/forever</span>
            </div>
          </div>

          <ul className="space-y-4 mb-8 flex-1">
            {PLAN_UI.free.bullets.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-brand-text-secondary">
                <CheckIcon className="w-5 h-5 text-brand-text-primary flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-brand-text-secondary mb-4">{PLAN_UI.free.support}</p>

          <button
            disabled
            className="w-full py-3 rounded-xl bg-brand-secondary text-brand-text-secondary font-bold border border-brand-border cursor-not-allowed"
          >
            {PLAN_UI.free.cta}
          </button>
        </Card>

        {/* Growth */}
        <Card className="flex flex-col border-brand-accent relative transform md:-translate-y-4 shadow-2xl shadow-brand-accent/10">
          {!!PLAN_UI.pro.badge && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-accent text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
              {PLAN_UI.pro.badge}
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-brand-text-primary mb-2">{PLAN_UI.pro.label}</h3>
            <p className="text-brand-text-secondary text-sm h-10">{PLAN_UI.pro.tagline}</p>
            <div className="mt-6 flex items-baseline">
              <span className="text-4xl font-black text-brand-text-primary">{formatPrice('pro')}</span>
              <span className="text-brand-text-secondary ml-2">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
            </div>
          </div>

          <ul className="space-y-4 mb-8 flex-1">
            {PLAN_UI.pro.bullets.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-brand-text-secondary">
                <CheckIcon className="w-5 h-5 text-brand-accent flex-shrink-0" />
                <span className={item.includes('Premium') ? 'font-semibold text-brand-text-primary' : ''}>{item}</span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-brand-text-secondary mb-4">{PLAN_UI.pro.support}</p>

          <button
            onClick={() => handleSubscribe('pro')}
            disabled={isProcessing}
            className={`w-full py-3 rounded-xl font-bold transition-colors shadow-lg shadow-brand-accent/20 ${
              isProcessing && selectedTier === 'pro'
                ? 'bg-brand-secondary text-brand-text-secondary cursor-wait'
                : 'bg-brand-accent text-white hover:bg-opacity-90'
            }`}
          >
            {isProcessing && selectedTier === 'pro' ? 'Processing...' : PLAN_UI.pro.cta}
          </button>
        </Card>

        {/* Family */}
        <Card className="flex flex-col border-secondary-purple bg-secondary-purple/5">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-brand-text-primary mb-2 flex items-center gap-2">
              {PLAN_UI.max.label} <SparklesIcon className="w-6 h-6 text-secondary-purple" />
            </h3>
            <p className="text-brand-text-secondary text-sm h-10">{PLAN_UI.max.tagline}</p>
            <div className="mt-6 flex items-baseline">
              <span className="text-4xl font-black text-brand-text-primary">{formatPrice('max')}</span>
              <span className="text-brand-text-secondary ml-2">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
            </div>
          </div>

          <ul className="space-y-4 mb-8 flex-1">
            {PLAN_UI.max.bullets.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-brand-text-secondary">
                <CheckIcon className="w-5 h-5 text-secondary-purple flex-shrink-0" />
                <span className={item === 'Everything in Growth' ? 'font-semibold text-brand-text-primary' : ''}>{item}</span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-brand-text-secondary mb-4">{PLAN_UI.max.support}</p>

          <button
            onClick={() => handleSubscribe('max')}
            disabled={isProcessing}
            className={`w-full py-3 rounded-xl font-bold transition-colors shadow-lg shadow-secondary-purple/20 ${
              isProcessing && selectedTier === 'max'
                ? 'bg-brand-secondary text-brand-text-secondary cursor-wait'
                : 'bg-secondary-purple text-white hover:bg-opacity-90'
            }`}
          >
            {isProcessing && selectedTier === 'max' ? 'Processing...' : PLAN_UI.max.cta}
          </button>
        </Card>
      </div>

      <div className="mt-10 p-5 rounded-2xl border border-brand-border bg-brand-secondary/30">
        <h4 className="text-lg font-bold text-brand-text-primary mb-3">Ownership & Access Clarity</h4>
        <ul className="space-y-2">
          {OWNERSHIP_NOTES.map((note) => (
            <li key={note} className="text-sm text-brand-text-secondary flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-accent" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-brand-border bg-brand-dark/20">
          <h3 className="text-xl font-bold text-brand-text-primary mb-2">Add-ons (All Plans)</h3>
          <ul className="space-y-2 text-sm text-brand-text-secondary">
            <li>• Books (Own Forever): $4.99–$19.99</li>
            <li>• Premium Courses (Own Forever): $19–$99</li>
            <li>• Premium Audiobooks (Own Forever): $9.99–$29.99</li>
            <li>• Premium Events: ticketed (subscriber discounts apply)</li>
            <li>• 1:1 Mentorship Calls: separate service</li>
          </ul>
        </Card>

        <Card className="border-brand-border bg-brand-dark/20">
          <h3 className="text-xl font-bold text-brand-text-primary mb-2">Partner (Leader)</h3>
          <p className="text-sm text-brand-text-secondary mb-4">
            For cohort leaders, churches, and ministry teams. Includes facilitation tools and group analytics.
          </p>
          <button className="px-5 py-2 rounded-lg border border-brand-border text-brand-text-primary hover:bg-brand-secondary transition-colors">
            Contact for Partner Plan
          </button>
        </Card>
      </div>

      <div className="mt-12 bg-brand-dark rounded-2xl p-8 border border-brand-border text-center">
        <h3 className="text-2xl font-bold text-brand-text-primary mb-4">Gift a Growth Path</h3>
        <p className="text-brand-text-secondary mb-6 max-w-2xl mx-auto">
          Bless someone with premium formation tools, courses, and community access.
        </p>
        <button className="px-8 py-3 rounded-xl bg-brand-secondary text-brand-text-primary font-bold border border-brand-border hover:bg-brand-dark transition-colors">
          Gift a Subscription
        </button>
      </div>
    </div>
  );
};

export default PricingPage;
