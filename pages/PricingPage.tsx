import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Card from '../components/Card';
import { SparklesIcon, CheckIcon } from '../components/icons';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } };
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

type PaidTier = 'pro' | 'max' | 'partner';

const PLAN_UI = {
  free: {
    label: getTierLabel('free'),
    tagline: 'Start your daily spiritual rhythm.',
    bullets: [
      'Daily devotional',
      'Weekly newsletter/podcast',
      'Basic Bible reader',
      'Open challenges',
      'Basic notes/comments',
    ],
    support: 'Basic tools included.',
    cta: 'Current Plan',
  },
  pro: {
    label: getTierLabel('pro'),
    tagline: 'Build depth and consistency.',
    bullets: [
      'Premium courses (core set)',
      'Standard audiobook library (rotating)',
      'Premium challenge archive',
      'Journaling templates',
      'Community rooms',
    ],
    support: '7-day trial on annual plan.',
    cta: 'Choose Growth',
    badge: 'Most Popular',
  },
  max: {
    label: getTierLabel('max'),
    tagline: 'Grow together at home.',
    bullets: [
      'Everything in Growth',
      'Up to 5 seats',
      'Shared challenge board',
      'Family progress dashboard',
    ],
    support: '14-day trial on annual plan.',
    cta: 'Choose Family',
  },
  partner: {
    label: getTierLabel('partner'),
    tagline: 'Guide groups with structure and insight.',
    bullets: [
      'Everything in Family',
      'Cohort facilitation tools',
      'Assignment workflows',
      'Group analytics',
    ],
    support: '30-day pilot for approved cohorts.',
    cta: 'Choose Leader',
  },
} as const;

const OWNERSHIP_NOTES = [
  'Included with subscription: rotating course/audiobook library, premium discussions, challenge archives.',
  'Own forever: selected books, flagship courses, premium audiobooks.',
  'Always separate add-on: 1:1 mentorship.',
  'Events: free/open events + premium ticketed events (subscriber discounts).',
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
      // silently handled
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
      // silently handled
    }
  };

  const proPrice = getLocalizedPrice(8.99, userCountry);
  const maxPrice = getLocalizedPrice(14.99, userCountry);
  const partnerPrice = getLocalizedPrice(24.99, userCountry);

  const getAmount = (tier: PaidTier) => {
    let basePrice = proPrice.discountedPriceUSD;
    if (tier === 'max') basePrice = maxPrice.discountedPriceUSD;
    if (tier === 'partner') basePrice = partnerPrice.discountedPriceUSD;
    
    let finalPrice = basePrice;

    if (billingCycle === 'yearly') {
      if (tier === 'pro') finalPrice = 59.99;
      else if (tier === 'max') finalPrice = 129.99;
      else if (tier === 'partner') finalPrice = 199.99;
    }

    if (activeDiscount && (activeDiscount.targetTier === 'all' || activeDiscount.targetTier === tier)) {
      finalPrice = finalPrice * (1 - activeDiscount.percentage / 100);
    }

    return Number(finalPrice.toFixed(2));
  };

  const formatPrice = (tier: PaidTier) => {
    let currencySymbol = proPrice.currencySymbol;
    if (tier === 'max') currencySymbol = maxPrice.currencySymbol;
    if (tier === 'partner') currencySymbol = partnerPrice.currencySymbol;
    const amount = getAmount(tier);
    return `${currencySymbol}${amount}`;
  };

  const getSavingsPercentage = (tier: PaidTier) => {
    const monthlyTotal = getAmount(tier) * (billingCycle === 'monthly' ? 1 : (tier === 'pro' ? 8.99 : tier === 'max' ? 14.99 : 24.99)) * 12;
    let yearlyTotal = 0;
    if (tier === 'pro') yearlyTotal = 59.99;
    else if (tier === 'max') yearlyTotal = 129.99;
    else if (tier === 'partner') yearlyTotal = 199.99;
    
    const monthlyAnnualized = (tier === 'pro' ? 8.99 : tier === 'max' ? 14.99 : 24.99) * 12;
    const savings = ((monthlyAnnualized - yearlyTotal) / monthlyAnnualized) * 100;
    return Math.round(savings);
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
      title: 'THE CCN DAILY Subscription',
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

      {/* ── Hero header ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden text-center py-16 mb-4">
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute inset-x-0 -top-32 h-80 opacity-20"
          aria-hidden
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgb(242 125 38) 0%, transparent 70%)' }}
        />
        <motion.p
          className="relative mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand-accent"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          Invest in your formation
        </motion.p>
        <motion.h1
          className="relative font-display text-4xl font-bold text-brand-text-primary md:text-5xl"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: EASE }}
        >
          Choose Your Growth Path
        </motion.h1>
        <motion.p
          className="relative mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-brand-text-secondary"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Scripture depth, structured practice, and community accountability for every season of your journey.
        </motion.p>

        {/* Billing toggle */}
        <motion.div
          className="mt-10 inline-flex rounded-full border border-brand-border bg-brand-dark p-1"
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3, ease: EASE }}
        >
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`rounded-full px-6 py-2 text-sm font-bold transition-colors ${billingCycle === 'monthly' ? 'bg-brand-accent text-white' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`flex items-center gap-2 rounded-full px-6 py-2 text-sm font-bold transition-colors ${billingCycle === 'yearly' ? 'bg-brand-accent text-white' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}
          >
            Yearly
            <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] text-green-400">Save up to 44%</span>
          </button>
        </motion.div>

        {activeDiscount && (
          <motion.div
            className="mt-4 inline-block rounded-sm border border-brand-accent/30 bg-brand-accent/10 px-4 py-2"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <p className="flex items-center gap-2 text-sm font-bold text-brand-accent">
              <SparklesIcon className="h-4 w-4" />
              {activeDiscount.name}: Extra {activeDiscount.percentage}% OFF
            </p>
          </motion.div>
        )}
      </div>

      {/* ── Pricing cards ──────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        {/* Foundation */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: EASE }}>
        <Card className="flex flex-col border-brand-border bg-brand-dark/30 h-full">
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
        </motion.div>

        {/* Growth */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: EASE }}>
        <Card className="flex flex-col border-brand-accent relative transform md:-translate-y-4 shadow-2xl shadow-brand-accent/10 h-full">
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
            {billingCycle === 'yearly' && (
              <p className="text-xs text-status-success mt-1 font-semibold">Save {getSavingsPercentage('pro')}% vs monthly</p>
            )}
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
        </motion.div>

        {/* Family */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: EASE }}>
        <Card className="flex flex-col border-secondary-purple bg-secondary-purple/5 h-full">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-brand-text-primary mb-2 flex items-center gap-2">
              {PLAN_UI.max.label} <SparklesIcon className="w-6 h-6 text-secondary-purple" />
            </h3>
            <p className="text-brand-text-secondary text-sm h-10">{PLAN_UI.max.tagline}</p>
            <div className="mt-6 flex items-baseline">
              <span className="text-4xl font-black text-brand-text-primary">{formatPrice('max')}</span>
              <span className="text-brand-text-secondary ml-2">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
            </div>
            {billingCycle === 'yearly' && (
              <p className="text-xs text-status-success mt-1 font-semibold">Save {getSavingsPercentage('max')}% vs monthly</p>
            )}
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
        </motion.div>

        {/* Leader */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: EASE }}>
        <Card className="flex flex-col border-brand-border bg-brand-dark/30 h-full">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-brand-text-primary mb-2 flex items-center gap-2">
              {PLAN_UI.partner.label}
            </h3>
            <p className="text-brand-text-secondary text-sm h-10">{PLAN_UI.partner.tagline}</p>
            <div className="mt-6 flex items-baseline">
              <span className="text-4xl font-black text-brand-text-primary">{formatPrice('partner')}</span>
              <span className="text-brand-text-secondary ml-2">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
            </div>
            {billingCycle === 'yearly' && (
              <p className="text-xs text-status-success mt-1 font-semibold">Save {getSavingsPercentage('partner')}% vs monthly</p>
            )}
          </div>

          <ul className="space-y-4 mb-8 flex-1">
            {PLAN_UI.partner.bullets.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-brand-text-secondary">
                <CheckIcon className="w-5 h-5 text-brand-text-primary flex-shrink-0" />
                <span className={item === 'Everything in Family' ? 'font-semibold text-brand-text-primary' : ''}>{item}</span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-brand-text-secondary mb-4">{PLAN_UI.partner.support}</p>

          <button
            onClick={() => handleSubscribe('partner')}
            disabled={isProcessing}
            className={`w-full py-3 rounded-xl font-bold transition-colors border border-brand-border ${
              isProcessing && selectedTier === 'partner'
                ? 'bg-brand-secondary text-brand-text-secondary cursor-wait'
                : 'bg-brand-dark text-brand-text-primary hover:bg-brand-secondary'
            }`}
          >
            {isProcessing && selectedTier === 'partner' ? 'Processing...' : PLAN_UI.partner.cta}
          </button>
        </Card>
        </motion.div>
      </motion.div>

      <motion.div
        className="mt-10 p-5 rounded-2xl border border-brand-border bg-brand-secondary/30"
        variants={fadeUp} initial="hidden" whileInView="visible"
        viewport={{ once: true }} transition={{ duration: 0.5, ease: EASE }}
      >
        <h4 className="text-lg font-bold text-brand-text-primary mb-3">Ownership & Access Clarity</h4>
        <ul className="space-y-2">
          {OWNERSHIP_NOTES.map((note) => (
            <li key={note} className="text-sm text-brand-text-secondary flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-accent" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={stagger} initial="hidden" whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
      >
        <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: EASE }}>
        <Card className="border-brand-border bg-brand-dark/20 h-full">
          <h3 className="text-xl font-bold text-brand-text-primary mb-2">Add-ons (Simple & Non-conflicting)</h3>
          <ul className="space-y-2 text-sm text-brand-text-secondary">
            <li>• Books (Own Forever): single purchase, yours to keep</li>
            <li>• Flagship Courses (Own Forever): single purchase with subscriber savings</li>
            <li>• Premium Audiobooks (Own Forever): single purchase, no subscription required</li>
            <li>• Mentorship Session: subscriber discount available at checkout</li>
            <li>• Premium Event Ticket: dynamic pricing, with 10–20% subscriber discount</li>
          </ul>
        </Card>
        </motion.div>

        <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: EASE }}>
        <Card className="border-brand-border bg-brand-dark/20 h-full">
          <h3 className="text-xl font-bold text-brand-text-primary mb-2">Mission-Access Lane</h3>
          <p className="text-sm text-brand-text-secondary mb-4">
            We believe everyone should have access to spiritual formation tools. If you cannot afford a subscription, please apply for our scholarship program or regional pricing.
          </p>
          <button className="px-5 py-2 rounded-lg border border-brand-border text-brand-text-primary hover:bg-brand-secondary transition-colors">
            Apply for Scholarship
          </button>
        </Card>
        </motion.div>
      </motion.div>

      <motion.div
        className="mt-12 bg-brand-dark rounded-2xl p-8 border border-brand-border text-center"
        variants={fadeUp} initial="hidden" whileInView="visible"
        viewport={{ once: true }} transition={{ duration: 0.5, ease: EASE }}
      >
        <h3 className="text-2xl font-bold text-brand-text-primary mb-4">Gift a Growth Path</h3>
        <p className="text-brand-text-secondary mb-6 max-w-2xl mx-auto">
          Bless someone with premium formation tools, courses, and community access.
        </p>
        <button className="px-8 py-3 rounded-xl bg-brand-secondary text-brand-text-primary font-bold border border-brand-border hover:bg-brand-dark transition-colors">
          Gift a Subscription
        </button>
      </motion.div>
    </div>
  );
};

export default PricingPage;
