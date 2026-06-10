import React, { useState } from 'react';
import { motion } from 'motion/react';
import Card from '../components/Card';
import { CheckIcon } from '../components/icons';
import { HelpCircle, Mail, MessageSquare, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import TurnstileWidget, { isTurnstileEnabled } from '../components/TurnstileWidget';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const CONTACT_EMAIL = 'contact@theccndaily.com';
const RATE_LIMIT_KEY = 'ccn_help_last_submit';
const RATE_LIMIT_MS = 60_000; // 60 seconds between submissions

const CATEGORIES = [
  'Technical Issue',
  'Content Feedback',
  'Account Question',
  'Prayer & Spiritual Support',
  'Partnership / Business',
  'Other',
];

const MAX_MESSAGE = 2000;

/** Strip HTML tags and trim — client-side XSS guard */
function sanitize(str: string): string {
  return str.replace(/<[^>]*>/g, '').replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[c] ?? c;
  }).trim();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

const HelpPage: React.FC = () => {
  const { user } = useAuth();
  const { notify } = useNotifications();

  const [name, setName]       = useState(user?.displayName ?? '');
  const [email, setEmail]     = useState(user?.email ?? '');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  // Honeypot — hidden from real users, bots fill it automatically
  const [website, setWebsite] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldError('');

    // ── 1. Honeypot check (silent drop for bots) ──────────────────────────
    if (website.length > 0) return;

    // ── 2. Client-side rate limiting ──────────────────────────────────────
    const lastSubmit = Number(localStorage.getItem(RATE_LIMIT_KEY) ?? '0');
    if (Date.now() - lastSubmit < RATE_LIMIT_MS) {
      setFieldError('Please wait a moment before sending another message.');
      return;
    }

    // ── 3. Input validation ───────────────────────────────────────────────
    const trimmedName    = name.trim();
    const trimmedEmail   = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || trimmedName.length > 100) {
      setFieldError('Please enter your name (max 100 characters).');
      return;
    }
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setFieldError('Please enter a valid email address.');
      return;
    }
    if (!category) {
      setFieldError('Please choose a category so we can route your message.');
      return;
    }
    if (trimmedMessage.length < 10) {
      setFieldError('Please enter a message of at least 10 characters.');
      return;
    }
    if (trimmedMessage.length > MAX_MESSAGE) {
      setFieldError(`Message is too long — please keep it under ${MAX_MESSAGE} characters.`);
      return;
    }

    if (isTurnstileEnabled && !turnstileToken) {
      setFieldError('Please complete the verification check before sending.');
      return;
    }

    // ── 4. Submit ─────────────────────────────────────────────────────────
    // Goes through the Cloudflare worker: server-side validation, Turnstile
    // verification, durable rate limiting, and D1 storage for the admin inbox.
    setSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    sanitize(trimmedName),
          email:   sanitize(trimmedEmail),
          category,
          message: sanitize(trimmedMessage),
          turnstileToken,
        }),
      });

      if (response.status === 429) {
        setFieldError('You have sent several messages recently. Please wait a few minutes and try again.');
        return;
      }
      if (!response.ok) {
        const body = await response.json().catch(() => ({} as { error?: string }));
        throw new Error(body.error || `Request failed (${response.status})`);
      }

      localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()));
      setSubmitted(true);
    } catch {
      notify('Failed to send your message. Please try again or email us directly.', 'error');
      setFieldError(`Something went wrong. You can also reach us at ${CONTACT_EMAIL}`);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success screen ──────────────────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto pb-20">
        <motion.div
          className="text-center py-20"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <div className="w-20 h-20 rounded-full bg-status-success/20 flex items-center justify-center mx-auto mb-6">
            <CheckIcon className="w-10 h-10 text-status-success" />
          </div>
          <h2
            className="text-3xl font-black text-brand-text-primary mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Message Sent
          </h2>
          <p className="text-brand-text-secondary mb-8 leading-7">
            We received your message and will respond to <strong className="text-brand-text-primary">{email}</strong> as soon as possible.
            Expect a reply within 1–2 business days.
          </p>
          <button
            onClick={() => { setSubmitted(false); setMessage(''); setCategory(''); }}
            className="px-6 py-3 rounded-lg bg-brand-secondary text-brand-text-primary font-semibold hover:bg-brand-border transition-colors"
          >
            Send another message
          </button>
        </motion.div>
      </div>
    );
  }

  /* ── Main form ───────────────────────────────────────────────────────────── */
  return (
    <div className="max-w-2xl mx-auto pb-20">

      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2">Support</p>
        <h1
          className="text-4xl font-black text-brand-text-primary mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Help &amp; Contact
        </h1>
        <p className="text-brand-text-secondary">
          Have a question, a concern, or feedback? Write to us below.
          We read every message and respond personally.
        </p>
      </motion.div>

      {/* Quick contact bar */}
      <motion.div
        className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-brand-dark border border-brand-border"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: EASE }}
      >
        <Mail className="w-5 h-5 text-brand-accent flex-shrink-0" />
        <p className="text-sm text-brand-text-secondary">
          Prefer email directly?{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-brand-accent font-semibold hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </motion.div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
      >
        <Card>
          <form onSubmit={handleSubmit} noValidate>

            {/* ── Honeypot — hidden from real users, traps bots ── */}
            <div aria-hidden="true" style={{ display: 'none' }}>
              <label htmlFor="website">Leave this field empty</label>
              <input
                id="website"
                name="website"
                type="text"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="space-y-5">

              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={100}
                  placeholder="Pastor Eryeza Kalalu"
                  required
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary placeholder:text-brand-text-secondary/50 focus:border-brand-accent outline-none transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  maxLength={254}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary placeholder:text-brand-text-secondary/50 focus:border-brand-accent outline-none transition-colors"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-2">
                  What is this about?
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    required
                    className="w-full appearance-none bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:border-brand-accent outline-none transition-colors pr-10"
                  >
                    <option value="">Select a category…</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-brand-text-secondary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary">
                    Your Message
                  </label>
                  <span className={`text-xs ${message.length > MAX_MESSAGE * 0.9 ? 'text-status-warning' : 'text-brand-text-secondary/60'}`}>
                    {message.length}/{MAX_MESSAGE}
                  </span>
                </div>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  maxLength={MAX_MESSAGE}
                  rows={6}
                  placeholder="Describe your issue or question in as much detail as you'd like. We read every word."
                  required
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary placeholder:text-brand-text-secondary/50 focus:border-brand-accent outline-none transition-colors resize-y"
                />
              </div>

              {/* Error */}
              {fieldError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-status-error/10 border border-status-error/30 text-sm text-status-error"
                >
                  <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{fieldError}</span>
                </motion.div>
              )}

              {/* Verification (renders only when Turnstile is configured) */}
              <TurnstileWidget onToken={setTurnstileToken} className="flex justify-center" />

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-lg bg-brand-accent text-white font-semibold transition-all hover:bg-opacity-90 disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    Sending…
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>

              <p className="text-center text-xs text-brand-text-secondary/60">
                We typically respond within 1–2 business days.
              </p>
            </div>
          </form>
        </Card>
      </motion.div>

      {/* FAQ hint */}
      <motion.div
        className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {[
          {
            q: 'How do I reset my password?',
            a: 'Sign in uses Google. To change your Google password, visit myaccount.google.com.',
          },
          {
            q: 'Can I cancel my subscription?',
            a: 'Yes. Go to Your Journey → Upgrade Plan and cancel anytime — no questions asked.',
          },
          {
            q: 'How do I report a content error?',
            a: 'Choose "Content Feedback" in the form above and describe what you found.',
          },
          {
            q: 'Is my data private?',
            a: 'Yes. Journal entries and prayers are private by default and never shared without your consent.',
          },
        ].map(({ q, a }) => (
          <div key={q} className="p-4 rounded-xl bg-brand-dark border border-brand-border">
            <p className="font-bold text-brand-text-primary text-sm mb-1">{q}</p>
            <p className="text-xs text-brand-text-secondary leading-5">{a}</p>
          </div>
        ))}
      </motion.div>

    </div>
  );
};

export default HelpPage;
