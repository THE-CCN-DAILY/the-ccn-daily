import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import Card from '../components/Card';
import { CheckIcon } from '../components/icons';
import {
  BookOpen as LucideBookOpen,
  Flame as LucideFlameIcon,
  Users as LucideUsers,
  ShieldCheck as LucideShieldCheck,
  Crown as LucideCrown,
  ChevronDown,
} from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } };
import { getLocalizedPrice, formatLocalPrice, isLocalCurrencyNonUsd } from '../utils/ppp';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { trackAnalyticsEvent, nowIso } from '../services/analyticsService';
import { useExperiment } from '../hooks/useExperiment';
import { getTierLabel } from '../types/pricing';
import { createPaymentIntent, getUserSubscription, type PaymentIntentResult } from '../services/purchaseService';

// Build-time fallback only. The authoritative key comes from the server intent
// (/api/payments/intent). No hardcoded demo key — an unconfigured key must fail
// loudly, never silently ship a sandbox key that Flutterwave rejects (PBFPubKey).
const BUILD_FLUTTERWAVE_KEY = (import.meta as any).env.VITE_FLUTTERWAVE_PUBLIC_KEY || '';

// A usable key is a real Flutterwave publishable key and NOT the old sandbox demo.
const isUsableFlwKey = (key: string | undefined): key is string =>
  !!key && /^FLWPUBK(_TEST)?-/.test(key) && !key.includes('SANDBOXDEMOKEY');

// After a successful charge the Flutterwave webhook grants the entitlement server-side.
// Poll the D1 readback a few times so the UI reflects the grant before refreshing.
const READBACK_POLL_ATTEMPTS = 5;
const READBACK_POLL_INTERVAL_MS = 2000;

type PaidTier = 'pro' | 'max' | 'partner';

const PLAN_UI = {
  free: {
    label: getTierLabel('free'),
    tagline: 'Begin your daily encounter with Scripture.',
    bullets: [
      'Daily devotional + guided reflection',
      'Bible reader (all books and chapters)',
      'Weekly newsletter and podcast',
      'Access to all free resources, books & plans as they are released',
      'Standard audiobook library',
      'Journaling and prayer wall',
      'One active challenge',
    ],
    support: 'Free forever. No card required.',
    howItWorks: 'No card needed. Create an account and everything here is yours — immediately, indefinitely. When you\'re ready to go deeper, Growth is one step away.',
    cta: 'Current Plan',
  },
  pro: {
    label: getTierLabel('pro'),
    tagline: 'Go deeper — every day.',
    bullets: [
      'Everything in Foundation, plus:',
      'Full access to the premium course library — included & always growing',
      'Full premium audiobook library — included',
      'All premium reading plans & challenges',
      'Deeper Scripture-anchored study tools',
      'Personalised daily devotionals',
      'Unlimited journaling with templates',
      'Community rooms',
    ],
    support: 'Cancel anytime.',
    howItWorks: 'One account, one person. Everything in Foundation stays with you — Growth adds the deeper tools above. Billed monthly or annually, and the annual plan saves 44%.',
    cta: 'Choose Growth',
    badge: 'Most Popular',
  },
  max: {
    label: getTierLabel('max'),
    tagline: 'Full access for your whole household.',
    bullets: [
      'Everything in Growth, plus:',
      '5 household seats — one subscription',
      'Exclusive masterclasses',
      'Voice prayer companion',
      'Visual Sanctuary + cinematic backgrounds',
      'Shared challenge board and family dashboard',
    ],
    support: 'Cancel anytime.',
    howItWorks: 'You subscribe once, then invite up to 4 people in your household. Each person gets their own profile, their own devotional journey, their own formation path — all under one subscription. No separate billing for family members. The person who subscribes manages the household seats.',
    cta: 'Choose Family',
  },
  partner: {
    label: getTierLabel('partner'),
    tagline: 'Your personal premium plan + tools to lead a group.',
    bullets: [
      'Everything in Growth, for you personally',
      'Group dashboard — manage up to 30 members',
      'Assignment workflows and cohort challenges',
      'Group progress analytics',
      'Invite link with discount for your members',
    ],
    support: 'For approved cohort leaders.',
    howItWorks: 'This is your personal Growth account — everything in Growth applies to you, for your own formation. On top of that, you get a group dashboard to shepherd up to 30 people: shared challenges, assignment tools, and a discount invite link to share with your group. Your members subscribe independently through your link. You are not buying seats for others. You lead; they walk their own walk.',
    cta: 'Apply for Leader',
  },
} as const;

// Kept for potential future use — not rendered on page
const OWNERSHIP_NOTES = [
  'Included with subscription: rotating course/audiobook library, premium discussions, challenge archives.',
  'Own forever: selected books, flagship courses, premium audiobooks.',
  'Always separate add-on: 1:1 mentorship.',
  'Events: free/open events + premium ticketed events (subscriber discounts).',
];

// Collapsible "how it works" detail — tucked under a Learn more toggle and given a
// distinct sunk surface so it reads as secondary to the headline plan info above.
const PlanDetails: React.FC<{ text: string }> = ({ text }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent hover:underline"
        aria-expanded={open}
      >
        {open ? 'Hide details' : 'Learn more'}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p
          className="mt-2 text-xs leading-relaxed text-brand-text-secondary rounded-lg p-3 border border-brand-border"
          style={{ background: 'var(--bg-sunk)' }}
        >
          {text}
        </p>
      )}
    </div>
  );
};

const PricingPage: React.FC = () => {
  const { user, openSignIn } = useAuth();
  const { notify } = useNotifications();
  const navigate = useNavigate();

  const [userCountry, setUserCountry] = useState('US');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PaidTier | null>(null);
  const [activeDiscount, setActiveDiscount] = useState<{ name: string; percentage: number; targetTier: string; targetBilling: string } | null>(null);
  const [intent, setIntent] = useState<PaymentIntentResult | null>(null);
  const paywallVariant = useExperiment(user?.uid, 'paywall_layout_v1');

  useEffect(() => {
    detectCountry(); // Real geo for PPP display (server re-derives geo authoritatively)
    fetchActiveDiscount();

    trackAnalyticsEvent({
      name: 'paywall_viewed',
      userId: user?.uid,
      tier: (user?.tier as any) || 'free',
      route: '/pricing',
      timestamp: nowIso(),
      experiments: { paywall_layout_v1: paywallVariant },
    });
  }, [billingCycle, paywallVariant]);

  // Detect the visitor's country from Cloudflare's edge trace (same origin, no extra
  // dependency). This is display-only for PPP; the server independently re-derives geo
  // from request.cf.country when it computes the authoritative price.
  const detectCountry = async () => {
    try {
      const res = await fetch('/cdn-cgi/trace');
      const text = await res.text();
      const match = text.match(/^loc=([A-Z]{2})$/m);
      if (match?.[1]) setUserCountry(match[1]);
    } catch {
      // Keep the default country on failure.
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
      const yearlyBaseUSD = tier === 'pro' ? 59.99 : tier === 'max' ? 129.99 : 199.99;
      // Apply the same PPP multiplier as monthly so the yearly price is discounted
      // consistently for the visitor's region (mirrors the server's computeAuthoritativePrice).
      finalPrice = Number((yearlyBaseUSD * proPrice.multiplier).toFixed(2));
    }

    if (activeDiscount && (activeDiscount.targetTier === 'all' || activeDiscount.targetTier === tier)) {
      finalPrice = finalPrice * (1 - activeDiscount.percentage / 100);
    }

    return Number(finalPrice.toFixed(2));
  };

  // Display the price in the visitor's LOCAL currency (converted at standard rates).
  // Billing is in USD (server-authoritative) — see the note under the billing toggle.
  const formatPrice = (tier: PaidTier) => formatLocalPrice(getAmount(tier), userCountry);

  const showsLocalCurrency = isLocalCurrencyNonUsd(userCountry);

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

  // The amount, currency, tx_ref, and public key all come from the SERVER intent —
  // the client never sets the price. Until an intent is created these are placeholders;
  // payment is only ever launched after `intent` is populated (see the effect below).
  const handleFlutterPayment = useFlutterwave({
    public_key: intent?.publicKey || BUILD_FLUTTERWAVE_KEY,
    tx_ref: intent?.tx_ref || `sub_${Date.now()}`,
    amount: intent?.amount ?? 0,
    currency: intent?.currency || 'USD',
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

  // Step 1: create a SERVER-AUTHORITATIVE payment intent. The server computes the price
  // and records a pending purchase keyed by its own tx_ref; the client only initializes
  // Flutterwave with the returned values. The launch happens in the effect on `intent`.
  const handleSubscribe = async (tier: PaidTier) => {
    if (!user) {
      // Open the sign-in / sign-up modal instead of a dead-end error.
      notify('Please sign in to continue — it only takes a moment.', 'info');
      setSelectedTier(tier); // remember the chosen plan so the user can resume after auth
      openSignIn();
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

    try {
      const result = await createPaymentIntent({ userId: user.uid, tier, billingCycle });
      setIntent(result); // the effect below launches Flutterwave with the server values
    } catch (error) {
      setIsProcessing(false);
      setSelectedTier(null);
      notify(error instanceof Error ? error.message : 'Could not start checkout. Please try again.', 'error');
      trackAnalyticsEvent({
        name: 'purchase_failed',
        userId: user?.uid,
        tier: (user?.tier as any) || 'free',
        route: '/pricing',
        timestamp: nowIso(),
        meta: { tier, billingCycle, stage: 'intent' },
      });
    }
  };

  // Confirm access AFTER the server grants it. The Flutterwave webhook writes the
  // subscription/entitlement to D1; poll the readback briefly, then refresh so the
  // entitlement gates re-read from the server. The client never grants access itself.
  const confirmAccess = async () => {
    if (!user) return;
    notify('Payment received. Unlocking your access…', 'success');
    for (let attempt = 0; attempt < READBACK_POLL_ATTEMPTS; attempt++) {
      try {
        const sub = await getUserSubscription(user.uid);
        if (sub.status === 'active') break;
      } catch {
        // keep polling — the webhook may not have landed yet
      }
      await new Promise((resolve) => setTimeout(resolve, READBACK_POLL_INTERVAL_MS));
    }
    setIsProcessing(false);
    window.location.reload();
  };

  // Step 2: once a server intent exists, launch Flutterwave with the server-provided
  // amount/currency/tx_ref. Access is NOT granted here — the verified webhook does that.
  useEffect(() => {
    if (!intent || !selectedTier) return;
    const tier = selectedTier;

    // Fail loudly if no real key reached us — never hand Flutterwave a bad key.
    const effectiveKey = intent.publicKey || BUILD_FLUTTERWAVE_KEY;
    if (!isUsableFlwKey(effectiveKey)) {
      setIsProcessing(false);
      setIntent(null);
      notify('Payments are not configured yet. Please contact support.', 'error');
      return;
    }

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
          await confirmAccess();
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
        setIntent(null);
      },
      onClose: () => {
        setIsProcessing(false);
        setIntent(null);
      },
    });
    // handleFlutterPayment is rebuilt each render from the current intent; launching on
    // [intent] captures the handler bound to these server values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent]);

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
          Support your daily formation
        </motion.p>
        <motion.h1
          className="relative font-display text-4xl font-bold text-brand-text-primary md:text-5xl"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: EASE }}
        >
          Choose Your Daily Rhythm
        </motion.h1>
        <motion.p
          className="relative mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-brand-text-secondary"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Scripture depth, structured practice, and community accountability — wherever you are in your walk with God.
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
            <span className="rounded-sm border border-brand-border bg-brand-secondary px-2 py-0.5 text-[12px] text-brand-text-secondary">Best value</span>
          </button>
        </motion.div>

        {activeDiscount && (
          <motion.div
            className="mt-4 inline-block rounded-sm border border-brand-accent/30 bg-brand-accent/10 px-4 py-2"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <p className="flex items-center gap-2 text-sm font-bold text-brand-accent">
              <LucideCrown className="h-4 w-4" />
              {activeDiscount.name}: Extra {activeDiscount.percentage}% OFF
            </p>
          </motion.div>
        )}
      </div>

      {/* Local-currency clarity — prices display in the visitor's currency; billing is USD */}
      {showsLocalCurrency && (
        <p className="mb-6 text-center text-xs text-brand-text-secondary">
          Prices shown in your local currency at standard exchange rates · billed securely in USD.
        </p>
      )}

      {/* ── Pricing cards ──────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 items-stretch"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        {/* Foundation — Free */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: EASE }} className="flex">
          <Card className="flex flex-col border-brand-border bg-brand-dark/30 w-full" style={{ borderTopColor: 'var(--fg-3)', borderTopWidth: '3px' }}>
            <div className="mb-6">
              <LucideBookOpen className="w-6 h-6 mb-3" style={{ color: 'var(--fg-3)' }} />
              <h3 className="text-2xl font-bold text-brand-text-primary mb-2">{PLAN_UI.free.label}</h3>
              <p className="text-brand-text-secondary text-sm h-10">{PLAN_UI.free.tagline}</p>
              <div className="mt-6 flex items-baseline">
                <span className="font-display text-4xl font-black text-brand-text-primary">$0</span>
                <span className="text-brand-text-secondary ml-2">/forever</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {PLAN_UI.free.bullets.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-brand-text-secondary">
                  <CheckIcon className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--fg-3)' }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="text-xs text-brand-text-secondary mb-2">{PLAN_UI.free.support}</p>
            <PlanDetails text={PLAN_UI.free.howItWorks} />

            <button
              disabled
              className="w-full py-3 rounded-xl bg-brand-secondary text-brand-text-secondary font-bold border border-brand-border cursor-not-allowed"
            >
              {PLAN_UI.free.cta}
            </button>
          </Card>
        </motion.div>

        {/* Growth — Pro (Most Popular) */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: EASE }} className="flex">
          <Card className="flex flex-col relative transform md:-translate-y-4 shadow-2xl w-full" style={{ borderColor: 'var(--crimson)', borderTopColor: 'var(--crimson)', borderTopWidth: '3px', boxShadow: '0 25px 50px -12px color-mix(in srgb, var(--crimson) 15%, transparent)' }}>
            {!!PLAN_UI.pro.badge && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider" style={{ backgroundColor: 'var(--crimson)' }}>
                {PLAN_UI.pro.badge}
              </div>
            )}

            <div className="mb-6">
              <LucideFlameIcon className="w-6 h-6 mb-3" style={{ color: 'var(--crimson)' }} />
              <h3 className="text-2xl font-bold text-brand-text-primary mb-2">{PLAN_UI.pro.label}</h3>
              <p className="text-brand-text-secondary text-sm h-10">{PLAN_UI.pro.tagline}</p>
              <div className="mt-6 flex items-baseline">
                <span className="font-display text-4xl font-black text-brand-text-primary">{formatPrice('pro')}</span>
                <span className="text-brand-text-secondary ml-2">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              {billingCycle === 'yearly' && (
                <p className="text-xs text-status-success mt-1 font-semibold">Save {getSavingsPercentage('pro')}% vs monthly</p>
              )}
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {PLAN_UI.pro.bullets.map((item) => item.endsWith('plus:') ? (
                <li key={item} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest pb-1 border-b border-brand-border" style={{ color: 'var(--crimson)' }}>
                  {item}
                </li>
              ) : (
                <li key={item} className="flex items-start gap-3 text-sm text-brand-text-secondary">
                  <CheckIcon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--crimson)' }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="text-xs text-brand-text-secondary mb-2">{PLAN_UI.pro.support}</p>
            <PlanDetails text={PLAN_UI.pro.howItWorks} />

            <button
              onClick={() => handleSubscribe('pro')}
              disabled={isProcessing}
              className={`w-full py-3 rounded-xl font-bold transition-colors ${
                isProcessing && selectedTier === 'pro'
                  ? 'bg-brand-secondary text-brand-text-secondary cursor-wait'
                  : 'text-white hover:opacity-90'
              }`}
              style={!(isProcessing && selectedTier === 'pro') ? { backgroundColor: 'var(--crimson)' } : {}}
            >
              {isProcessing && selectedTier === 'pro' ? 'Processing...' : PLAN_UI.pro.cta}
            </button>
          </Card>
        </motion.div>

        {/* Family — Max */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: EASE }} className="flex">
          <Card className="flex flex-col w-full" style={{ borderColor: 'var(--ember)', borderTopColor: 'var(--ember)', borderTopWidth: '3px', backgroundColor: 'color-mix(in srgb, var(--ember) 5%, transparent)' }}>
            <div className="mb-6">
              <LucideUsers className="w-6 h-6 mb-3" style={{ color: 'var(--ember)' }} />
              <h3 className="text-2xl font-bold text-brand-text-primary mb-2">
                {PLAN_UI.max.label}
              </h3>
              <p className="text-brand-text-secondary text-sm h-10">{PLAN_UI.max.tagline}</p>
              <div className="mt-6 flex items-baseline">
                <span className="font-display text-4xl font-black text-brand-text-primary">{formatPrice('max')}</span>
                <span className="text-brand-text-secondary ml-2">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              {billingCycle === 'yearly' && (
                <p className="text-xs text-status-success mt-1 font-semibold">Save {getSavingsPercentage('max')}% vs monthly</p>
              )}
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {PLAN_UI.max.bullets.map((item) => item.endsWith('plus:') ? (
                <li key={item} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest pb-1 border-b border-brand-border" style={{ color: 'var(--ember)' }}>
                  {item}
                </li>
              ) : (
                <li key={item} className="flex items-start gap-3 text-sm text-brand-text-secondary">
                  <CheckIcon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--ember)' }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="text-xs text-brand-text-secondary mb-2">{PLAN_UI.max.support}</p>
            <PlanDetails text={PLAN_UI.max.howItWorks} />

            <button
              onClick={() => handleSubscribe('max')}
              disabled={isProcessing}
              className={`w-full py-3 rounded-xl font-bold transition-colors ${
                isProcessing && selectedTier === 'max'
                  ? 'bg-brand-secondary text-brand-text-secondary cursor-wait'
                  : 'text-white hover:opacity-90'
              }`}
              style={!(isProcessing && selectedTier === 'max') ? { backgroundColor: 'var(--ember)' } : {}}
            >
              {isProcessing && selectedTier === 'max' ? 'Processing...' : PLAN_UI.max.cta}
            </button>
          </Card>
        </motion.div>

        {/* Leader — Partner */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: EASE }} className="flex">
          <Card className="flex flex-col w-full" style={{ borderColor: 'var(--gold-ds)', borderTopColor: 'var(--gold-ds)', borderTopWidth: '3px', backgroundColor: 'color-mix(in srgb, var(--gold-ds) 5%, transparent)' }}>
            <div className="mb-6">
              <LucideShieldCheck className="w-6 h-6 mb-3" style={{ color: 'var(--gold-ds)' }} />
              <h3 className="text-2xl font-bold text-brand-text-primary mb-2">
                {PLAN_UI.partner.label}
              </h3>
              <p className="text-brand-text-secondary text-sm h-10">{PLAN_UI.partner.tagline}</p>
              <div className="mt-6 flex items-baseline">
                <span className="font-display text-4xl font-black text-brand-text-primary">{formatPrice('partner')}</span>
                <span className="text-brand-text-secondary ml-2">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              {billingCycle === 'yearly' && (
                <p className="text-xs text-status-success mt-1 font-semibold">Save {getSavingsPercentage('partner')}% vs monthly</p>
              )}
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {PLAN_UI.partner.bullets.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-brand-text-secondary">
                  <CheckIcon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--gold-ds)' }} />
                  <span className={item.includes('personally') ? 'font-semibold text-brand-text-primary' : ''}>{item}</span>
                </li>
              ))}
            </ul>

            <p className="text-xs text-brand-text-secondary mb-2">{PLAN_UI.partner.support}</p>
            <PlanDetails text={PLAN_UI.partner.howItWorks} />

            <button
              onClick={() => handleSubscribe('partner')}
              disabled={isProcessing}
              className={`w-full py-3 rounded-xl font-bold transition-colors border ${
                isProcessing && selectedTier === 'partner'
                  ? 'bg-brand-secondary text-brand-text-secondary cursor-wait border-brand-border'
                  : 'bg-brand-dark text-brand-text-primary hover:bg-brand-secondary'
              }`}
              style={!(isProcessing && selectedTier === 'partner') ? { borderColor: 'var(--gold-ds)' } : {}}
            >
              {isProcessing && selectedTier === 'partner' ? 'Processing...' : PLAN_UI.partner.cta}
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
          Give someone courses, audio, guided Scripture practice, and a quieter place to grow.
        </p>
        <button
          onClick={() => navigate('/app/help')}
          className="px-8 py-3 rounded-xl bg-brand-secondary text-brand-text-primary font-bold border border-brand-border hover:bg-brand-dark transition-colors"
        >
          Gift a Subscription
        </button>
      </motion.div>

      {/* Student access */}
      <motion.div
        className="mt-8 text-center"
        variants={fadeUp} initial="hidden" whileInView="visible"
        viewport={{ once: true }} transition={{ duration: 0.5, ease: EASE }}
      >
        <p className="text-sm text-brand-text-secondary">
          Are you a university student?{' '}
          <button
            type="button"
            onClick={() => (user ? navigate('/app/scholarship') : openSignIn())}
            className="text-brand-accent font-semibold hover:underline"
          >
            Apply for six months of Growth access →
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default PricingPage;
