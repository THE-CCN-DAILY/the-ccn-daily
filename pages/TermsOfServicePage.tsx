import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, AlertCircle, FileText, Compass } from 'lucide-react';
import Card from '../components/Card';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const TermsOfServicePage: React.FC = () => {
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
          <FileText className="w-8 h-8" />
        </div>
        <h1
          style={{ fontFamily: 'var(--serif-display, Cormorant Garamond, Georgia, serif)' }}
          className="text-4xl sm:text-5xl font-black mb-4 tracking-tight"
        >
          Terms of Service
        </h1>
        <p className="text-brand-text-secondary max-w-xl mx-auto leading-relaxed">
          Please read these terms carefully before entering and utilizing the Daily Sanctuary services.
        </p>
        <div className="mt-4 text-xs text-brand-text-secondary/60">
          Last Updated: June 27, 2026
        </div>
      </motion.div>

      {/* Main Content Card */}
      <Card className="p-8 sm:p-12 space-y-8 bg-brand-dark/20 border-brand-border/60">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-brand-accent">
            <Compass className="w-5 h-5" />
            <h2 className="text-lg font-bold uppercase tracking-wider">1. Agreement to Terms</h2>
          </div>
          <p className="text-sm text-brand-text-secondary leading-relaxed">
            By creating an account or accessing the-ccn-daily resources, you agree to be bound by these Terms of Service. If you do not agree to all terms, you may not use the platform.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-brand-accent">
            <BookOpen className="w-5 h-5" />
            <h2 className="text-lg font-bold uppercase tracking-wider">2. Intellectual Property &amp; Sharing Limits</h2>
          </div>
          <p className="text-sm text-brand-text-secondary leading-relaxed">
            The books, courses, audiobooks, and devotionals published here are protected by copyright laws. You are granted a limited license for personal reading.
          </p>
          <div className="p-4 bg-brand-accent/5 border-l-4 border-brand-accent rounded-r-xl text-xs text-brand-text-secondary">
            <strong>Copyright Compliance Limit:</strong> For sharing highlights or quotes on social media, you agree to limit selections to a maximum of 1,500 characters of a book at any single time.
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-brand-accent">
            <AlertCircle className="w-5 h-5" />
            <h2 className="text-lg font-bold uppercase tracking-wider">3. Acceptable Use</h2>
          </div>
          <p className="text-sm text-brand-text-secondary leading-relaxed">
            Members are expected to engage in small groups and public comment threads with mutual respect. The ministry reserves the right to review, moderate, and remove any content or comments that fail to maintain our community standard.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-brand-accent">
            <FileText className="w-5 h-5" />
            <h2 className="text-lg font-bold uppercase tracking-wider">4. Revisions &amp; Disclaimers</h2>
          </div>
          <p className="text-sm text-brand-text-secondary leading-relaxed">
            We reserve the right to modify these terms. Continued use of the application indicates your acceptance of updated guidelines. Content provided is for personal, informational, and encouragement purposes.
          </p>
        </section>
      </Card>
    </div>
  );
};

export default TermsOfServicePage;
