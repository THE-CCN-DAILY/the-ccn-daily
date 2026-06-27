import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react';
import Card from '../components/Card';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pb-24 text-brand-text-primary">
      {/* Back button */}
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-text-secondary hover:text-brand-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sanctuary
        </Link>
      </div>

      {/* Header */}
      <motion.div
        className="mb-12 text-center"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div className="inline-flex items-center justify-center p-3 bg-brand-accent/10 rounded-full text-brand-accent mb-4 border border-brand-accent/20">
          <Shield className="w-8 h-8" />
        </div>
        <h1
          style={{ fontFamily: 'var(--serif-display, Cormorant Garamond, Georgia, serif)' }}
          className="text-4xl sm:text-5xl font-black mb-4 tracking-tight"
        >
          Privacy Policy
        </h1>
        <p className="text-brand-text-secondary max-w-xl mx-auto leading-relaxed">
          Your privacy and the security of your spiritual journey data are paramount to us. Learn how we protect your information.
        </p>
        <div className="mt-4 text-xs text-brand-text-secondary/60">
          Last Updated: June 27, 2026
        </div>
      </motion.div>

      {/* Main Content Card */}
      <Card className="p-8 sm:p-12 space-y-8 bg-brand-dark/20 border-brand-border/60">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-brand-accent">
            <Lock className="w-5 h-5" />
            <h2 className="text-lg font-bold uppercase tracking-wider">1. Our Commitment</h2>
          </div>
          <p className="text-sm text-brand-text-secondary leading-relaxed">
            The CCN Daily values the trust you place in us. We do not sell, rent, or trade your personal data. Any journaling reflections, small group responses, or prayer requests remain secure, guarded by standard data protocols.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-brand-accent">
            <Eye className="w-5 h-5" />
            <h2 className="text-lg font-bold uppercase tracking-wider">2. Information We Collect</h2>
          </div>
          <p className="text-sm text-brand-text-secondary leading-relaxed">
            We collect the minimum amount of personal data necessary to provide you with a personalized experience:
          </p>
          <ul className="list-disc pl-5 text-sm text-brand-text-secondary space-y-2">
            <li><strong>Account details:</strong> Email address and profile name to manage authentication, streaks, and settings.</li>
            <li><strong>Sanctuary metrics:</strong> Devotional progress, book reading progress, and prayer check-ins to power daily gamification streaks.</li>
            <li><strong>Journal logs:</strong> Optional text reflections stored securely inside your private library.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-brand-accent">
            <Shield className="w-5 h-5" />
            <h2 className="text-lg font-bold uppercase tracking-wider">3. How Your Data is Used</h2>
          </div>
          <p className="text-sm text-brand-text-secondary leading-relaxed">
            We use collected metrics strictly to support your spiritual routines. In-app community actions (like posting a prayer request) are shared publicly within the community feed only when you explicitly select the option to publish it.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-brand-accent">
            <FileText className="w-5 h-5" />
            <h2 className="text-lg font-bold uppercase tracking-wider">4. Security Standards</h2>
          </div>
          <p className="text-sm text-brand-text-secondary leading-relaxed">
            Data transmission is encrypted via Secure Socket Layer (SSL) technology. We store authentication credentials via Firebase Auth and database rows in Cloudflare D1. We employ robust authorization checks (RBAC) to ensure that no third party or standard staff role can view or tamper with private member records.
          </p>
        </section>
      </Card>
    </div>
  );
};

export default PrivacyPolicyPage;
