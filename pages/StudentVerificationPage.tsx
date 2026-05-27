import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, CheckCircle, Info } from 'lucide-react';
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNotifications } from '../contexts/NotificationContext';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const VALID_STUDENT_DOMAINS = [
  '.edu',
  '.ac.ug',
  '.ac.ke',
  '.ac.za',
  '.ac.rw',
  '.ac.tz',
  '.ac.gh',
  '.ac.ng',
  '.edu.ng',
  '.ac.et',
  '.ac.',
  '.university',
];

function isValidStudentEmail(email: string): boolean {
  const lower = email.toLowerCase();
  if (!lower.includes('@')) return false;
  return VALID_STUDENT_DOMAINS.some((domain) => lower.includes(domain));
}

const StudentVerificationPage: React.FC = () => {
  const { user } = useAuth();
  const { notify } = useNotifications();

  const [universityEmail, setUniversityEmail] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [fileName, setFileName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('');
      return;
    }
    if (!isValidStudentEmail(value)) {
      setEmailError(
        'Please enter a valid university email (e.g. name@university.edu, name@university.ac.ug)'
      );
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      notify('Please sign in to apply for student verification.', 'error');
      return;
    }

    if (!isValidStudentEmail(universityEmail)) {
      setEmailError('Please enter a valid university email address.');
      return;
    }

    if (!universityName.trim()) {
      notify('Please enter your university name.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      await setDoc(doc(db, 'studentVerifications', user.uid), {
        uid: user.uid,
        email: user.email,
        universityEmail: universityEmail.trim(),
        universityName: universityName.trim(),
        fileName: fileName || null,
        submittedAt: serverTimestamp(),
        status: 'pending',
      });

      setSubmitted(true);
    } catch (err) {
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
              Application Submitted
            </h2>
            <p className="text-brand-text-secondary max-w-md mx-auto leading-relaxed">
              We'll review and activate your student Premium within 48 hours. You'll be notified via the app.
            </p>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 px-4">
      {/* Header */}
      <motion.div
        className="mb-10"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.45, ease: EASE }}
      >
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-accent/15 flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-brand-accent" />
          </div>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-accent text-center mb-3">
          Student Access
        </p>
        <h1 className="text-3xl font-black text-brand-text-primary text-center mb-4">
          6 Months Free Premium
        </h1>
        <p className="text-brand-text-secondary text-center leading-relaxed">
          University students at accredited institutions get six months of full Premium access —
          free. Verify your student status below.
        </p>
      </motion.div>

      {/* Info banner */}
      <motion.div
        className="mb-8 flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.45, delay: 0.08, ease: EASE }}
      >
        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700 leading-relaxed">
          Our team will contact you within 48 hours to confirm your student status. No payment
          information is required.
        </p>
      </motion.div>

      {/* Form */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.45, delay: 0.15, ease: EASE }}
      >
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* University email */}
            <div>
              <label className="block text-sm font-semibold text-brand-text-primary mb-2">
                University Email Address <span className="text-brand-accent">*</span>
              </label>
              <input
                type="email"
                value={universityEmail}
                onChange={(e) => {
                  setUniversityEmail(e.target.value);
                  validateEmail(e.target.value);
                }}
                placeholder="yourname@university.edu"
                required
                className="w-full bg-brand-dark border border-brand-border rounded-xl py-3 px-4 text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm"
              />
              {emailError && (
                <p className="mt-1.5 text-xs text-red-400">{emailError}</p>
              )}
              <p className="mt-1.5 text-xs text-brand-text-secondary">
                Must be a .edu, .ac.ug, .ac.ke, .ac.za, .edu.ng, or similar institutional address.
              </p>
            </div>

            {/* University name */}
            <div>
              <label className="block text-sm font-semibold text-brand-text-primary mb-2">
                University / Institution Name <span className="text-brand-accent">*</span>
              </label>
              <input
                type="text"
                value={universityName}
                onChange={(e) => setUniversityName(e.target.value)}
                placeholder="e.g. Makerere University"
                required
                className="w-full bg-brand-dark border border-brand-border rounded-xl py-3 px-4 text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm"
              />
            </div>

            {/* Proof upload */}
            <div>
              <label className="block text-sm font-semibold text-brand-text-primary mb-2">
                Proof of Enrollment <span className="text-brand-text-secondary font-normal">(optional but recommended)</span>
              </label>
              <p className="text-xs text-brand-text-secondary mb-3">
                Student ID, enrollment letter, or class schedule. Accepts images or PDF.
              </p>
              <label className="flex items-center justify-center gap-3 w-full border-2 border-dashed border-brand-border rounded-xl py-6 px-4 cursor-pointer hover:border-brand-accent/50 transition-colors">
                <GraduationCap className="w-5 h-5 text-brand-text-secondary" />
                <span className="text-sm text-brand-text-secondary">
                  {fileName ? fileName : 'Click to attach file'}
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || !!emailError}
              className="w-full py-3 rounded-xl bg-brand-accent text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting…' : 'Submit Application'}
            </button>

            <p className="text-xs text-brand-text-secondary text-center">
              By submitting, you confirm that you are currently enrolled as a student at the
              institution listed above.
            </p>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default StudentVerificationPage;
