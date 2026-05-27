import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Handshake, Mail, Podcast, Smartphone, CheckCircle } from 'lucide-react';
import Card from '../components/Card';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNotifications } from '../contexts/NotificationContext';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

type OrgType = 'Church' | 'Business' | 'NGO' | 'Individual' | 'Other';
type SponsorInterest = 'Newsletter' | 'App Feature' | 'Podcast' | 'Event';

const ORG_TYPES: OrgType[] = ['Church', 'Business', 'NGO', 'Individual', 'Other'];
const INTERESTS: SponsorInterest[] = ['Newsletter', 'App Feature', 'Podcast', 'Event'];

const BENEFITS = [
  {
    icon: Mail,
    title: 'Newsletter Mention',
    description:
      'Your name in the weekly devotional email, reaching active subscribers across East Africa.',
    color: 'var(--crimson)',
    bg: 'bg-red-500/10',
  },
  {
    icon: Smartphone,
    title: 'App Presence',
    description:
      'A featured spot in the app for one month, with your logo and message visible to every member.',
    color: 'var(--ember)',
    bg: 'bg-orange-500/10',
  },
  {
    icon: Podcast,
    title: 'Podcast Sponsorship',
    description:
      'A 30-second mention at the opening of a podcast episode, heard by engaged listeners.',
    color: 'var(--gold-ds)',
    bg: 'bg-yellow-500/10',
  },
];

const SponsorshipPage: React.FC = () => {
  const { notify } = useNotifications();

  const [orgName, setOrgName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [orgType, setOrgType] = useState<OrgType | ''>('');
  const [interests, setInterests] = useState<SponsorInterest[]>([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleInterest = (interest: SponsorInterest) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgName.trim() || !contactName.trim() || !contactEmail.trim() || !orgType) {
      notify('Please fill in all required fields.', 'error');
      return;
    }

    if (interests.length === 0) {
      notify('Please select at least one sponsorship interest.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'sponsorshipInquiries'), {
        orgName: orgName.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        phone: phone.trim() || null,
        orgType,
        interests,
        message: message.trim() || null,
        submittedAt: serverTimestamp(),
        status: 'new',
      });

      setSubmitted(true);
    } catch {
      notify('Something went wrong. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <Card className="text-center py-16">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-brand-text-primary mb-3">
              Thank You!
            </h2>
            <p className="text-brand-text-secondary max-w-md mx-auto leading-relaxed">
              We'll be in touch within 5 business days to discuss how we can partner together for the mission.
            </p>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-10"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgb(242 125 38) 0%, transparent 70%)',
        }}
      />

      {/* Header */}
      <motion.div
        className="relative text-center py-12 mb-8"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-brand-accent/15 flex items-center justify-center">
            <Handshake className="w-7 h-7 text-brand-accent" />
          </div>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-accent mb-3">
          Community Partnership
        </p>
        <h1 className="text-4xl font-black text-brand-text-primary mb-4">
          Partner with THE CCN DAILY
        </h1>
        <p className="text-brand-text-secondary max-w-2xl mx-auto leading-relaxed text-lg">
          Your organization can support the mission while connecting with thousands of believers
          across East Africa.
        </p>
      </motion.div>

      {/* Benefits */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
      >
        {BENEFITS.map((benefit) => (
          <motion.div
            key={benefit.title}
            variants={fadeUp}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <Card className="h-full">
              <div
                className={`w-10 h-10 rounded-xl ${benefit.bg} flex items-center justify-center mb-4`}
              >
                <benefit.icon className="w-5 h-5" style={{ color: benefit.color }} />
              </div>
              <h3 className="font-bold text-brand-text-primary mb-2">{benefit.title}</h3>
              <p className="text-sm text-brand-text-secondary leading-relaxed">
                {benefit.description}
              </p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Inquiry form */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <Card>
          <h2 className="text-xl font-bold text-brand-text-primary mb-1">
            Partnership Inquiry
          </h2>
          <p className="text-sm text-brand-text-secondary mb-8">
            Tell us about your organization and what you're interested in. We'll follow up within 5 business days.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Organization name */}
              <div>
                <label className="block text-sm font-semibold text-brand-text-primary mb-2">
                  Organization Name <span className="text-brand-accent">*</span>
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Namirembe Diocese"
                  required
                  className="w-full bg-brand-dark border border-brand-border rounded-xl py-3 px-4 text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm"
                />
              </div>

              {/* Contact person */}
              <div>
                <label className="block text-sm font-semibold text-brand-text-primary mb-2">
                  Contact Person <span className="text-brand-accent">*</span>
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Full name"
                  required
                  className="w-full bg-brand-dark border border-brand-border rounded-xl py-3 px-4 text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm"
                />
              </div>

              {/* Contact email */}
              <div>
                <label className="block text-sm font-semibold text-brand-text-primary mb-2">
                  Contact Email <span className="text-brand-accent">*</span>
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="you@organization.com"
                  required
                  className="w-full bg-brand-dark border border-brand-border rounded-xl py-3 px-4 text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-brand-text-primary mb-2">
                  Phone{' '}
                  <span className="text-brand-text-secondary font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+256 700 000 000"
                  className="w-full bg-brand-dark border border-brand-border rounded-xl py-3 px-4 text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm"
                />
              </div>
            </div>

            {/* Organization type */}
            <div>
              <label className="block text-sm font-semibold text-brand-text-primary mb-2">
                Organization Type <span className="text-brand-accent">*</span>
              </label>
              <select
                value={orgType}
                onChange={(e) => setOrgType(e.target.value as OrgType)}
                required
                className="w-full bg-brand-dark border border-brand-border rounded-xl py-3 px-4 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm appearance-none"
              >
                <option value="" disabled>
                  Select type…
                </option>
                {ORG_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-semibold text-brand-text-primary mb-3">
                What are you interested in sponsoring?{' '}
                <span className="text-brand-accent">*</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {INTERESTS.map((interest) => {
                  const active = interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                        active
                          ? 'bg-brand-accent text-white border-brand-accent'
                          : 'border-brand-border text-brand-text-secondary hover:border-brand-accent/50 hover:text-brand-text-primary'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-semibold text-brand-text-primary mb-2">
                Brief Message / Proposal{' '}
                <span className="text-brand-text-secondary font-normal">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about your organization's vision, the audience you're hoping to reach, or any specific ideas you have…"
                rows={4}
                className="w-full bg-brand-dark border border-brand-border rounded-xl py-3 px-4 text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-brand-accent text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Handshake className="w-4 h-4" />
              {isSubmitting ? 'Sending…' : 'Send Partnership Inquiry'}
            </button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default SponsorshipPage;
