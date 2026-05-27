import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';

const FLUTTERWAVE_PUBLIC_KEY =
  (import.meta as any).env.VITE_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-SANDBOXDEMOKEY-X';

const EASE: [number, number, number, number] = [0.2, 0.6, 0.2, 1];

// ─── Tier definitions ─────────────────────────────────────────────────────────

interface Tier {
  id: string;
  name: string;
  amount: number;
  label: string;
  description: string;
}

const TIERS: Tier[] = [
  {
    id: 'seed',
    name: 'Seed',
    amount: 5,
    label: 'Sow a seed',
    description: 'Your daily commitment of 17 cents keeps a devotional going for one person.',
  },
  {
    id: 'branch',
    name: 'Branch',
    amount: 25,
    label: 'Grow with us',
    description: "You're sustaining the podcast, the daily writing, and the community rooms.",
  },
  {
    id: 'root',
    name: 'Root',
    amount: 50,
    label: 'Go deep',
    description: "You're funding new content — courses, books, and live events.",
  },
  {
    id: 'cornerstone',
    name: 'Cornerstone',
    amount: 100,
    label: 'Build with us',
    description: "You're a builder of this house. Eternal impact.",
  },
];

// ─── Thank-You Overlay ────────────────────────────────────────────────────────

interface ThankYouOverlayProps {
  donorName: string;
  onReturn: () => void;
}

const ThankYouOverlay: React.FC<ThankYouOverlayProps> = ({ donorName, onReturn }) => {
  const { notify } = useNotifications();

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText('https://theccndaily.com/give');
      notify('Link copied! Share with your community.', 'success');
    } catch {
      notify('Could not copy link — please copy manually: theccndaily.com/give', 'info');
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/95 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <motion.div
        className="w-full max-w-lg text-center border border-brand-border p-10 md:p-14"
        style={{ background: 'var(--bg-card, rgba(255,255,255,0.03))' }}
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.12 }}
      >
        <div
          className="text-5xl mb-6"
          role="img"
          aria-label="heart"
        >
          🕊️
        </div>

        <h2
          className="text-3xl md:text-4xl text-brand-text-primary mb-3"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 600, lineHeight: 1.2 }}
        >
          Thank you, {donorName}.
          <br />
          You're a Steward of Hope.
        </h2>

        <blockquote
          className="my-6 pl-4 border-l-2 border-brand-accent text-left"
        >
          <p
            className="text-brand-text-secondary italic"
            style={{ fontFamily: 'var(--serif-body)', fontSize: '16px', lineHeight: 1.75 }}
          >
            "Well done, good and faithful servant."
          </p>
          <cite
            className="block mt-2 text-xs text-brand-accent font-semibold uppercase tracking-wider"
            style={{ fontFamily: 'var(--sans-ui)', fontStyle: 'normal' }}
          >
            Matthew 25:21 (paraphrase)
          </cite>
        </blockquote>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button
            onClick={handleShare}
            className="flex-1 py-3 border border-brand-accent text-brand-accent text-sm font-semibold hover:bg-brand-accent/10 transition-colors"
            style={{ fontFamily: 'var(--sans-ui)' }}
          >
            Share with someone who might join you ↗
          </button>
          <button
            onClick={onReturn}
            className="flex-1 py-3 bg-brand-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ fontFamily: 'var(--sans-ui)' }}
          >
            Continue in the app →
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const DonationPage: React.FC = () => {
  const { user } = useAuth();
  const { notify } = useNotifications();

  const [selectedTierId, setSelectedTierId] = useState<string>('branch');
  const [giftType, setGiftType] = useState<'monthly' | 'one-time'>('monthly');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const selectedTier = TIERS.find((t) => t.id === selectedTierId);
  const effectiveAmount = customAmount
    ? Math.max(1, Number(customAmount) || 1)
    : (selectedTier?.amount ?? 25);

  const flutterwaveConfig = {
    public_key: FLUTTERWAVE_PUBLIC_KEY,
    tx_ref: `ccn-give-${Date.now()}`,
    amount: effectiveAmount,
    currency: 'USD',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: user?.email || 'donor@theccndaily.com',
      phone_number: '',
      name: user?.displayName || 'Generous Steward',
    },
    customizations: {
      title: 'Stewards of Hope — THE CCN DAILY',
      description: `${giftType === 'monthly' ? 'Monthly' : 'One-time'} gift of $${effectiveAmount}`,
      logo: 'https://theccndaily.com/logo.png',
    },
  };

  const handleFlutterPayment = useFlutterwave(flutterwaveConfig);

  const recordDonation = async (txRef: string) => {
    try {
      await setDoc(doc(db, 'donations', txRef), {
        uid: user?.uid ?? null,
        email: user?.email ?? null,
        amount: effectiveAmount,
        tier: selectedTierId,
        type: giftType,
        timestamp: new Date().toISOString(),
        status: 'successful',
      });
    } catch {
      // Non-critical — payment already processed; log silently
    }
  };

  const handleGive = () => {
    setIsProcessing(true);
    const txRef = `ccn-give-${Date.now()}`;

    handleFlutterPayment({
      callback: async (response) => {
        closePaymentModal();
        if (response.status === 'successful') {
          await recordDonation(txRef);
          setIsProcessing(false);
          setShowThankYou(true);
        } else {
          setIsProcessing(false);
          notify('Payment was not completed. Please try again.', 'error');
        }
      },
      onClose: () => {
        setIsProcessing(false);
      },
    });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText('https://theccndaily.com/give');
      notify('Link copied! Share with your community.', 'success');
    } catch {
      notify('Link: theccndaily.com/give', 'info');
    }
  };

  const donorName = user?.displayName?.split(' ')[0] ?? 'Friend';

  return (
    <>
      <AnimatePresence>
        {showThankYou && (
          <ThankYouOverlay
            donorName={donorName}
            onReturn={() => setShowThankYou(false)}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-brand-dark">

        {/* ── Header ── */}
        <motion.section
          className="w-full px-4 py-16 md:py-24 flex flex-col items-center text-center border-b border-brand-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <p
            className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accent mb-4"
            style={{ fontFamily: 'var(--sans-ui)' }}
          >
            Stewards of Hope
          </p>

          <h1
            className="text-4xl md:text-5xl lg:text-6xl text-brand-text-primary max-w-2xl mb-4"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600, lineHeight: 1.15 }}
          >
            Partner with what God is building.
          </h1>

          <p
            className="max-w-xl text-brand-text-secondary mb-10"
            style={{ fontFamily: 'var(--serif-body)', fontSize: '18px', lineHeight: 1.7 }}
          >
            Every gift — large or small — sustains the mission of daily Scripture for thousands.
          </p>

          <blockquote
            className="max-w-lg border-l-2 border-brand-accent pl-5 text-left"
          >
            <p
              className="italic text-brand-text-secondary"
              style={{ fontFamily: 'var(--serif-body)', fontSize: '17px', lineHeight: 1.75 }}
            >
              "For God is not unjust so as to overlook your work and the love that you have shown
              for his name in serving the saints."
            </p>
            <cite
              className="block mt-3 text-xs font-bold uppercase tracking-wider text-brand-accent"
              style={{ fontFamily: 'var(--sans-ui)', fontStyle: 'normal' }}
            >
              Hebrews 6:10
            </cite>
          </blockquote>
        </motion.section>

        {/* ── Content ── */}
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 space-y-10">

          {/* Gift type toggle */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.1 }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-3"
              style={{ fontFamily: 'var(--sans-ui)' }}
            >
              Gift Type
            </p>
            <div className="flex gap-0 border border-brand-border w-full max-w-xs">
              {(['monthly', 'one-time'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setGiftType(type)}
                  className="flex-1 py-3 text-sm font-semibold transition-all"
                  style={{
                    fontFamily: 'var(--sans-ui)',
                    background: giftType === type ? 'var(--gold-ds, #B7892E)' : 'transparent',
                    color: giftType === type ? 'white' : 'var(--fg-3, #8A7A6A)',
                  }}
                >
                  {type === 'monthly' ? 'Monthly' : 'One-time'}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tier grid */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.18 }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-4"
              style={{ fontFamily: 'var(--sans-ui)' }}
            >
              Choose Your Level
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TIERS.map((tier) => {
                const active = selectedTierId === tier.id && !customAmount;
                return (
                  <motion.button
                    key={tier.id}
                    onClick={() => { setSelectedTierId(tier.id); setCustomAmount(''); }}
                    className="text-left p-5 border transition-all duration-200"
                    style={{
                      background: active ? 'rgba(183,137,46,0.08)' : 'transparent',
                      borderColor: active ? 'var(--gold-ds, #B7892E)' : 'var(--border, rgba(183,137,46,0.15))',
                    }}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="flex items-baseline justify-between mb-1">
                      <span
                        className="text-2xl font-bold"
                        style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-ds, #B7892E)' }}
                      >
                        ${tier.amount}
                        {giftType === 'monthly' && (
                          <span className="text-sm font-normal text-brand-text-secondary ml-1">/mo</span>
                        )}
                      </span>
                      {active && <span className="text-brand-accent text-lg">✓</span>}
                    </div>
                    <p
                      className="text-xs font-bold uppercase tracking-wider text-brand-accent mb-1"
                      style={{ fontFamily: 'var(--sans-ui)' }}
                    >
                      {tier.name} — {tier.label}
                    </p>
                    <p
                      className="text-sm text-brand-text-secondary"
                      style={{ fontFamily: 'var(--serif-body)', lineHeight: 1.6 }}
                    >
                      {tier.description}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Custom amount */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.26 }}
          >
            <label
              className="block mb-2 text-xs font-bold uppercase tracking-widest text-brand-text-secondary"
              style={{ fontFamily: 'var(--sans-ui)' }}
            >
              Or Enter a Custom Amount
            </label>
            <div className="relative max-w-xs">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-secondary font-bold">
                $
              </span>
              <input
                type="number"
                min="1"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-brand-dark border border-brand-border py-3 pl-8 pr-4 text-brand-text-primary placeholder:text-brand-text-secondary focus:border-brand-accent outline-none transition-colors"
                style={{ fontFamily: 'var(--serif-body)', fontSize: '16px' }}
              />
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.34 }}
            className="space-y-4"
          >
            <button
              onClick={handleGive}
              disabled={isProcessing || effectiveAmount < 1}
              className="w-full py-4 text-white font-semibold text-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-wait"
              style={{
                fontFamily: 'var(--sans-ui)',
                background: 'var(--gold-ds, #B7892E)',
              }}
            >
              {isProcessing
                ? 'Processing...'
                : giftType === 'monthly'
                ? `Partner with $${effectiveAmount}/month →`
                : `Give $${effectiveAmount} →`}
            </button>

            {/* External links */}
            <p
              className="text-center text-xs text-brand-text-secondary"
              style={{ fontFamily: 'var(--sans-ui)' }}
            >
              Also give via:{' '}
              <a
                href="https://theccndaily.gumroad.com/l/nytfjo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-accent hover:underline"
              >
                Gumroad ↗
              </a>
              {' · '}
              <a
                href="https://theccndaily.com/give"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-accent hover:underline"
              >
                theccndaily.com/give ↗
              </a>
            </p>

            {/* Share link */}
            <div className="text-center pt-2">
              <button
                onClick={handleShare}
                className="text-xs text-brand-text-secondary hover:text-brand-accent transition-colors"
                style={{ fontFamily: 'var(--sans-ui)' }}
              >
                📋 Share this page with your community
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default DonationPage;
