import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import CcnLogo from '../components/CcnLogo';

// ─── Types ───────────────────────────────────────────────────────────────────

type FaithJourney = 'beginning' | 'growing' | 'established' | 'leading';

interface OnboardingData {
  uid: string;
  email: string | null;
  role: string;
  createdAt: ReturnType<typeof serverTimestamp>;
  preferredName: string;
  faithJourney: FaithJourney | '';
  interests: string[];
  phone: string;
  smsConsent: boolean;
  onboardingComplete: true;
  completedAt: ReturnType<typeof serverTimestamp>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FAITH_OPTIONS: { value: FaithJourney; icon: string; label: string }[] = [
  { value: 'beginning', icon: '✦', label: 'Just beginning — curious about faith' },
  { value: 'growing', icon: '✧', label: 'Growing — reading Scripture regularly' },
  { value: 'established', icon: '❦', label: 'Established — walking with God for years' },
  { value: 'leading', icon: '✚', label: 'Leading — I disciple others' },
];

const INTEREST_OPTIONS: string[] = [
  'Daily devotionals',
  'Bible study',
  'Podcasts & teaching',
  'Community & prayer',
  'Courses & discipleship',
  'Books & audiobooks',
];

const TOTAL_STEPS = 4;

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ─── Progress Bar ────────────────────────────────────────────────────────────

const ProgressBar: React.FC<{ step: number }> = ({ step }) => (
  <div className="flex items-center gap-2 mb-8">
    {Array.from({ length: TOTAL_STEPS }, (_, i) => (
      <div
        key={i}
        className="flex-1 h-1 rounded-full transition-all duration-500"
        style={{
          background: i < step ? 'var(--gold-ds, #B7892E)' : 'rgba(183,137,46,0.18)',
        }}
      />
    ))}
  </div>
);

// ─── Step 1 — Welcome & Name ─────────────────────────────────────────────────

interface Step1Props {
  preferredName: string;
  onNameChange: (v: string) => void;
  onNext: () => void;
  onSkip: () => void;
}

const Step1: React.FC<Step1Props> = ({ preferredName, onNameChange, onNext, onSkip }) => (
  <div className="space-y-6">
    <div>
      <p
        className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-3"
        style={{ fontFamily: 'var(--sans-ui)' }}
      >
        Step 1 of 4
      </p>
      <h1
        className="text-3xl text-brand-text-primary mb-2"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 600, lineHeight: 1.2 }}
      >
        Welcome to THE CCN DAILY
      </h1>
      <p
        className="text-brand-text-secondary"
        style={{ fontFamily: 'var(--serif-body)', fontSize: '17px', lineHeight: 1.65 }}
      >
        Before we begin, help us know a little about you.
      </p>
    </div>

    <div>
      <label
        className="block mb-2 text-xs font-bold uppercase tracking-widest text-brand-text-secondary"
        style={{ fontFamily: 'var(--sans-ui)' }}
      >
        Preferred Name
      </label>
      <input
        type="text"
        value={preferredName}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="What should we call you?"
        className="w-full bg-brand-dark border border-brand-border px-4 py-3 text-brand-text-primary placeholder:text-brand-text-secondary focus:border-brand-accent outline-none transition-colors"
        style={{ fontFamily: 'var(--serif-body)', fontSize: '16px' }}
      />
    </div>

    <button
      onClick={onNext}
      className="w-full py-4 bg-brand-accent text-white font-semibold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
      style={{ fontFamily: 'var(--sans-ui)' }}
    >
      Continue →
    </button>

    <button
      onClick={onSkip}
      className="w-full text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors"
      style={{ fontFamily: 'var(--sans-ui)' }}
    >
      I'll set this up later
    </button>
  </div>
);

// ─── Step 2 — Faith Journey ───────────────────────────────────────────────────

interface Step2Props {
  selected: FaithJourney | '';
  onSelect: (v: FaithJourney) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const Step2: React.FC<Step2Props> = ({ selected, onSelect, onNext, onBack, onSkip }) => (
  <div className="space-y-6">
    <div>
      <p
        className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-3"
        style={{ fontFamily: 'var(--sans-ui)' }}
      >
        Step 2 of 4
      </p>
      <h1
        className="text-3xl text-brand-text-primary mb-2"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 600, lineHeight: 1.2 }}
      >
        Where are you in your walk?
      </h1>
      <p
        className="text-brand-text-secondary"
        style={{ fontFamily: 'var(--serif-body)', fontSize: '17px', lineHeight: 1.65 }}
      >
        No right answer — this helps us tailor your daily encounter.
      </p>
    </div>

    <div className="space-y-3">
      {FAITH_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className="w-full flex items-center gap-4 px-4 py-4 border text-left transition-all duration-200"
          style={{
            background: selected === opt.value ? 'rgba(183,137,46,0.10)' : 'var(--bg-card, rgba(255,255,255,0.03))',
            borderColor: selected === opt.value ? 'var(--gold-ds, #B7892E)' : 'var(--border, rgba(183,137,46,0.15))',
          }}
        >
          <span className="text-2xl flex-shrink-0">{opt.icon}</span>
          <span
            className="text-brand-text-primary text-sm"
            style={{ fontFamily: 'var(--serif-body)', lineHeight: 1.5 }}
          >
            {opt.label}
          </span>
          {selected === opt.value && (
            <span className="ml-auto text-brand-accent font-bold text-lg">✓</span>
          )}
        </button>
      ))}
    </div>

    <div className="flex gap-3">
      <button
        onClick={onBack}
        className="px-5 py-3 border border-brand-border text-brand-text-secondary text-sm hover:text-brand-text-primary transition-colors"
        style={{ fontFamily: 'var(--sans-ui)' }}
      >
        ← Back
      </button>
      <button
        onClick={onNext}
        disabled={!selected}
        className="flex-1 py-3 bg-brand-accent text-white font-semibold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ fontFamily: 'var(--sans-ui)' }}
      >
        Continue →
      </button>
    </div>

    <button
      onClick={onSkip}
      className="w-full text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors"
      style={{ fontFamily: 'var(--sans-ui)' }}
    >
      Skip this step
    </button>
  </div>
);

// ─── Step 3 — Interests ───────────────────────────────────────────────────────

interface Step3Props {
  interests: string[];
  onToggle: (interest: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const Step3: React.FC<Step3Props> = ({ interests, onToggle, onNext, onBack, onSkip }) => (
  <div className="space-y-6">
    <div>
      <p
        className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-3"
        style={{ fontFamily: 'var(--sans-ui)' }}
      >
        Step 3 of 4
      </p>
      <h1
        className="text-3xl text-brand-text-primary mb-2"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 600, lineHeight: 1.2 }}
      >
        What are you most looking for?
      </h1>
      <p
        className="text-brand-text-secondary"
        style={{ fontFamily: 'var(--serif-body)', fontSize: '17px', lineHeight: 1.65 }}
      >
        We'll surface the right things first.
      </p>
    </div>

    <div className="flex flex-wrap gap-2">
      {INTEREST_OPTIONS.map((interest) => {
        const active = interests.includes(interest);
        return (
          <button
            key={interest}
            onClick={() => onToggle(interest)}
            className="px-4 py-2 text-sm border transition-all duration-200"
            style={{
              fontFamily: 'var(--sans-ui)',
              background: active ? 'rgba(183,137,46,0.14)' : 'transparent',
              borderColor: active ? 'var(--gold-ds, #B7892E)' : 'var(--border, rgba(183,137,46,0.2))',
              color: active ? 'var(--gold-ds, #B7892E)' : 'var(--fg-2, #8A7A6A)',
              fontWeight: active ? 600 : 400,
            }}
          >
            {interest}
          </button>
        );
      })}
    </div>

    <div className="flex gap-3">
      <button
        onClick={onBack}
        className="px-5 py-3 border border-brand-border text-brand-text-secondary text-sm hover:text-brand-text-primary transition-colors"
        style={{ fontFamily: 'var(--sans-ui)' }}
      >
        ← Back
      </button>
      <button
        onClick={onNext}
        className="flex-1 py-3 bg-brand-accent text-white font-semibold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
        style={{ fontFamily: 'var(--sans-ui)' }}
      >
        Continue →
      </button>
    </div>

    <button
      onClick={onSkip}
      className="w-full text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors"
      style={{ fontFamily: 'var(--sans-ui)' }}
    >
      Skip this step
    </button>
  </div>
);

// ─── Step 4 — Stay Connected ──────────────────────────────────────────────────

interface Step4Props {
  phone: string;
  onPhoneChange: (v: string) => void;
  smsConsent: boolean;
  onConsentChange: (v: boolean) => void;
  onComplete: () => void;
  onBack: () => void;
  onSkip: () => void;
  isSaving: boolean;
}

const Step4: React.FC<Step4Props> = ({
  phone,
  onPhoneChange,
  smsConsent,
  onConsentChange,
  onComplete,
  onBack,
  onSkip,
  isSaving,
}) => (
  <div className="space-y-6">
    <div>
      <p
        className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-3"
        style={{ fontFamily: 'var(--sans-ui)' }}
      >
        Step 4 of 4
      </p>
      <h1
        className="text-3xl text-brand-text-primary mb-2"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 600, lineHeight: 1.2 }}
      >
        Stay in the loop
      </h1>
      <p
        className="text-brand-text-secondary"
        style={{ fontFamily: 'var(--serif-body)', fontSize: '17px', lineHeight: 1.65 }}
      >
        Optional — add your phone number for key announcements, reminders, and
        important updates.
      </p>
    </div>

    <div>
      <label
        className="block mb-2 text-xs font-bold uppercase tracking-widest text-brand-text-secondary"
        style={{ fontFamily: 'var(--sans-ui)' }}
      >
        Phone Number (Optional)
      </label>
      <input
        type="tel"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        placeholder="+256 7XX XXX XXX"
        className="w-full bg-brand-dark border border-brand-border px-4 py-3 text-brand-text-primary placeholder:text-brand-text-secondary focus:border-brand-accent outline-none transition-colors"
        style={{ fontFamily: 'var(--serif-body)', fontSize: '16px' }}
      />
    </div>

    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5 flex-shrink-0">
        <input
          type="checkbox"
          checked={smsConsent}
          onChange={(e) => onConsentChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className="w-5 h-5 border transition-all flex items-center justify-center"
          style={{
            background: smsConsent ? 'var(--gold-ds, #B7892E)' : 'transparent',
            borderColor: smsConsent ? 'var(--gold-ds, #B7892E)' : 'var(--border, rgba(183,137,46,0.3))',
          }}
        >
          {smsConsent && <span className="text-white text-xs font-bold">✓</span>}
        </div>
      </div>
      <p
        className="text-sm text-brand-text-secondary group-hover:text-brand-text-primary transition-colors"
        style={{ fontFamily: 'var(--serif-body)', lineHeight: 1.6 }}
      >
        I agree to receive occasional announcements, reminders, and updates by SMS from THE CCN DAILY. You can unsubscribe anytime.
      </p>
    </label>

    <div className="flex gap-3">
      <button
        onClick={onBack}
        className="px-5 py-3 border border-brand-border text-brand-text-secondary text-sm hover:text-brand-text-primary transition-colors"
        style={{ fontFamily: 'var(--sans-ui)' }}
      >
        ← Back
      </button>
      <button
        onClick={onComplete}
        disabled={isSaving}
        className="flex-1 py-3 bg-brand-accent text-white font-semibold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-wait"
        style={{ fontFamily: 'var(--sans-ui)' }}
      >
        {isSaving ? 'Saving...' : 'Begin My Journey →'}
      </button>
    </div>

    <button
      onClick={onSkip}
      className="w-full text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors"
      style={{ fontFamily: 'var(--sans-ui)' }}
    >
      No thanks, I'll just use the app
    </button>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const OnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1); // 1 = forward, -1 = back
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [preferredName, setPreferredName] = useState(user?.displayName ?? '');
  const [faithJourney, setFaithJourney] = useState<FaithJourney | ''>('');
  const [interests, setInterests] = useState<string[]>([]);
  const [phone, setPhone] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);

  const advanceTo = (next: number) => {
    setDirection(1);
    setStep(next);
  };

  const backTo = (prev: number) => {
    setDirection(-1);
    setStep(prev);
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const saveAndComplete = async (skipPhone?: boolean) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const data: OnboardingData = {
        // Base identity fields the security rules require on every users/{uid} write
        uid: user.uid,
        email: user.email,
        role: user.role ?? 'user',
        createdAt: serverTimestamp(),
        // Onboarding preferences
        preferredName,
        faithJourney,
        interests,
        phone: skipPhone ? '' : phone,
        smsConsent: skipPhone ? false : smsConsent,
        onboardingComplete: true,
        completedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', user.uid), data, { merge: true });
      navigate('/guided-journey', { replace: true });
    } catch {
      notify('Something went wrong saving your preferences. Please try again.', 'error');
      setIsSaving(false);
    }
  };

  // Variants for slide animation
  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-dark px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <CcnLogo size="md" theme="auto" />
        </div>

        {/* Card */}
        <div
          className="w-full border border-brand-border overflow-hidden"
          style={{ background: 'var(--bg-card, rgba(255,255,255,0.03))' }}
        >
          <div className="p-6 md:p-8">
            <ProgressBar step={step} />

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.32, ease: EASE }}
              >
                {step === 1 && (
                  <Step1
                    preferredName={preferredName}
                    onNameChange={setPreferredName}
                    onNext={() => advanceTo(2)}
                    onSkip={() => advanceTo(2)}
                  />
                )}
                {step === 2 && (
                  <Step2
                    selected={faithJourney}
                    onSelect={setFaithJourney}
                    onNext={() => advanceTo(3)}
                    onBack={() => backTo(1)}
                    onSkip={() => advanceTo(3)}
                  />
                )}
                {step === 3 && (
                  <Step3
                    interests={interests}
                    onToggle={toggleInterest}
                    onNext={() => advanceTo(4)}
                    onBack={() => backTo(2)}
                    onSkip={() => advanceTo(4)}
                  />
                )}
                {step === 4 && (
                  <Step4
                    phone={phone}
                    onPhoneChange={setPhone}
                    smsConsent={smsConsent}
                    onConsentChange={setSmsConsent}
                    onComplete={() => saveAndComplete(false)}
                    onBack={() => backTo(3)}
                    onSkip={() => saveAndComplete(true)}
                    isSaving={isSaving}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
