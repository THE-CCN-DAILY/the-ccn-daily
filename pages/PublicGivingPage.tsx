import React, { useState } from 'react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { motion, AnimatePresence } from 'motion/react';
import { createGivingIntent, type GivingIntentResult } from '../services/givingService';

const BUILD_FLUTTERWAVE_PUBLIC_KEY = (import.meta as any).env.VITE_FLUTTERWAVE_PUBLIC_KEY || '';
const DEMO_KEY_FRAGMENT = 'SANDBOX' + 'DEMOKEY';
const isUsableGivingKey = (key: string | undefined): key is string =>
  !!key && /^FLWPUBK(_TEST)?-/.test(key) && !key.includes(DEMO_KEY_FRAGMENT);
const PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000];

const PublicGivingPage: React.FC = () => {
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [type, setType] = useState<'one-time' | 'monthly'>('one-time');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [intent, setIntent] = useState<GivingIntentResult | null>(null);

  const effectiveAmount = customAmount ? Number(customAmount) : amount;

  const config = {
    public_key: intent?.publicKey || BUILD_FLUTTERWAVE_PUBLIC_KEY,
    tx_ref: intent?.tx_ref || 'pending-giving-intent',
    amount: intent?.amount || effectiveAmount,
    currency: intent?.currency || 'USD',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: email || 'donor@theccndaily.com',
      phone_number: '',
      name: name || 'Generous Donor',
    },
    customizations: {
      title: 'THE CCN DAILY',
      description: `${type === 'monthly' ? 'Monthly partnership' : 'One-time gift'} — Support the mission`,
      logo: '/brand/the-ccn-daily-app-icon-concept-1024.png',
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.'); return;
    }
    if (effectiveAmount < 1) { setError('Please enter a valid amount.'); return; }
    setIsProcessing(true);
    try {
      const result = await createGivingIntent({
        amount: effectiveAmount,
        giftType: type,
        donorName: name,
        donorEmail: email,
      });
      const publicKey = result.publicKey || BUILD_FLUTTERWAVE_PUBLIC_KEY;
      if (!isUsableGivingKey(publicKey)) {
        setIsProcessing(false);
        setError('Giving is being connected. Please contact support to give today.');
        return;
      }
      setIntent(result);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Giving could not be prepared. Please try again.');
    }
  };

  React.useEffect(() => {
    if (!intent) return;
    handleFlutterPayment({
      callback: (response) => {
        closePaymentModal();
        if (response.status === 'successful') {
          setSuccess(true);
          setIntent(null);
        } else {
          setIsProcessing(false);
          setIntent(null);
          setError('Payment was not completed. Please try again.');
        }
      },
      onClose: () => {
        setIsProcessing(false);
        setIntent(null);
      },
    });
  }, [intent, handleFlutterPayment]);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-lg w-full text-center rounded-2xl p-12 border border-on-surface/10 bg-surface-low"
        >
          <div className="w-20 h-20 bg-green-500/10 rounded-full border border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-on-surface mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Thank you, {name.split(' ')[0]}.
          </h2>
          <p className="text-on-surface/60 text-lg mb-2 font-serif italic">
            Your gift has been received.
          </p>
          <p className="text-on-surface/50 text-base mb-10 font-serif">
            Thank you for investing in this work. Every gift builds what God is doing here.
          </p>
          <a
            href="/"
            className="inline-block px-8 py-4 bg-primary-brand text-on-primary-brand rounded-lg font-bold text-sm hover:bg-primary-brand/90 transition-colors"
            style={{ fontFamily: 'var(--font-ui)' }}
          >
            Return to THE CCN DAILY
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <a href="/" className="inline-flex items-center justify-center mb-6">
            <img
              src="/brand/the-ccn-daily-wordmark-original-white-transparent.png"
              alt="THE CCN DAILY"
              className="h-8 w-auto dark-wordmark"
            />
            <img
              src="/brand/the-ccn-daily-wordmark-original-black-transparent.png"
              alt="THE CCN DAILY"
              className="h-8 w-auto light-wordmark"
            />
          </a>
          <p className="text-xs font-bold uppercase tracking-widest text-primary-brand mb-3" style={{ fontFamily: 'var(--font-ui)' }}>
            Give
          </p>
          <h1 className="text-4xl font-black text-on-surface mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            Give to the Mission
          </h1>
          <p className="text-on-surface/60 font-serif italic text-lg">
            Every gift builds what God is doing here.
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-on-surface/10 bg-surface-low p-8 space-y-8"
        >
          {/* One-time vs monthly toggle */}
          <div className="flex gap-2 p-1.5 bg-surface-high rounded-xl border border-on-surface/10">
            {(['one-time', 'monthly'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-3 rounded-lg font-bold text-sm transition-colors ${
                  type === t
                    ? 'bg-primary-brand text-on-primary-brand'
                    : 'bg-transparent text-on-surface/60 hover:text-on-surface'
                }`}
                style={{ fontFamily: 'var(--font-ui)' }}
              >
                {t === 'one-time' ? 'One-time gift' : 'Monthly partner'}
              </button>
            ))}
          </div>

          {/* Preset amounts */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface/50 mb-4" style={{ fontFamily: 'var(--font-ui)' }}>
              Select amount
            </p>
            <div className="grid grid-cols-3 gap-3">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { setAmount(val); setCustomAmount(''); }}
                  className={`py-4 rounded-xl font-black text-xl transition-all ${
                    effectiveAmount === val && !customAmount
                      ? 'bg-primary-brand/15 text-primary-brand border-2 border-primary-brand'
                      : 'bg-bg border-2 border-on-surface/10 text-on-surface hover:border-on-surface/30'
                  }`}
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  ${val}
                </button>
              ))}
            </div>
            {/* Custom amount */}
            <div className="mt-4 relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface/40 font-black text-xl">$</span>
              <input
                type="number"
                placeholder="Custom amount"
                value={customAmount}
                min="1"
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full bg-bg border-2 border-on-surface/10 rounded-xl py-4 pl-12 pr-5 text-on-surface font-bold text-lg focus:border-primary-brand outline-none transition-colors placeholder:text-on-surface/30"
                style={{ fontFamily: 'var(--font-display)' }}
              />
            </div>
          </div>

          {/* Donor info */}
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface/50" style={{ fontFamily: 'var(--font-ui)' }}>
              Your information
            </p>
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-bg border-2 border-on-surface/10 rounded-xl py-4 px-5 text-on-surface font-medium focus:border-primary-brand outline-none transition-colors placeholder:text-on-surface/30"
              style={{ fontFamily: 'var(--font-ui)' }}
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-bg border-2 border-on-surface/10 rounded-xl py-4 px-5 text-on-surface font-medium focus:border-primary-brand outline-none transition-colors placeholder:text-on-surface/30"
              style={{ fontFamily: 'var(--font-ui)' }}
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-500 text-sm font-medium"
                style={{ fontFamily: 'var(--font-ui)' }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
            disabled={isProcessing}
            className={`w-full py-5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-3 ${
              isProcessing
                ? 'bg-surface-high text-on-surface/40 cursor-wait'
                : 'bg-primary-brand text-on-primary-brand hover:bg-primary-brand/90'
            }`}
            style={{ fontFamily: 'var(--font-ui)' }}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-on-surface/20 border-t-on-surface/60 animate-spin" />
                Processing securely…
              </>
            ) : (
              `Give $${effectiveAmount}${type === 'monthly' ? ' / month' : ''}`
            )}
          </button>

          <p className="text-center text-xs text-on-surface/40 font-medium" style={{ fontFamily: 'var(--font-ui)' }}>
            Secure, encrypted payment via Flutterwave. Accepts international cards and mobile money.
          </p>
        </motion.form>
      </div>
    </div>
  );
};

export default PublicGivingPage;
