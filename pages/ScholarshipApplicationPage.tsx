import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { HeartHandshake, CheckCircle2, Clock } from 'lucide-react';
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import {
  submitApplication,
  getMyLatestApplication,
  getErrorMessage,
  SCHOLARSHIP_MONTHS,
  type ScholarshipApplication,
} from '../services/scholarshipService';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fieldClass =
  'w-full rounded-xl border border-brand-border bg-brand-dark px-4 py-3 text-sm text-brand-text-primary outline-none focus:ring-2 focus:ring-brand-accent';

const ScholarshipApplicationPage: React.FC = () => {
  const { user } = useAuth();
  const { notify } = useNotifications();

  const [existing, setExisting] = useState<ScholarshipApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!user?.uid) { setLoading(false); return; }
    getMyLatestApplication(user.uid)
      .then((a) => { if (mounted) setExisting(a); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [user?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitApplication({ country, reason });
      notify('Application submitted. We will be in touch by email.', 'success');
      if (user?.uid) setExisting(await getMyLatestApplication(user.uid));
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const pending = existing && existing.status === 'pending';
  const accepted = existing && existing.status === 'accepted';

  return (
    <div className="max-w-2xl mx-auto pb-24 px-4">
      <motion.div className="mb-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2">Sponsored access</p>
        <h1 className="text-4xl font-black text-brand-text-primary inline-flex items-center gap-3" style={{ fontFamily: 'var(--serif-display)' }}>
          <HeartHandshake className="w-8 h-8 text-brand-accent" /> Scholarship
        </h1>
        <p className="text-sm text-brand-text-secondary mt-2">
          We believe cost should never keep anyone from formation. If a subscription is out of reach right now, apply below.
          Approved applicants receive {SCHOLARSHIP_MONTHS} months of Growth access.
        </p>
      </motion.div>

      {loading ? (
        <Card><p className="text-sm text-brand-text-secondary">Loading…</p></Card>
      ) : accepted ? (
        <Card className="text-center py-10">
          <CheckCircle2 className="w-10 h-10 text-status-success mx-auto mb-3" />
          <h2 className="text-xl font-bold text-brand-text-primary">Your scholarship is active</h2>
          <p className="text-sm text-brand-text-secondary mt-2">Enjoy full Growth access. Welcome.</p>
        </Card>
      ) : pending ? (
        <Card className="text-center py-10">
          <Clock className="w-10 h-10 text-brand-accent mx-auto mb-3" />
          <h2 className="text-xl font-bold text-brand-text-primary">Application received</h2>
          <p className="text-sm text-brand-text-secondary mt-2">We're reviewing it and will email you at <strong>{existing?.applicantEmail}</strong> with the outcome.</p>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary mb-1">Your name</label>
              <input className={`${fieldClass} opacity-70`} value={user?.displayName || ''} disabled />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary mb-1">Email</label>
              <input className={`${fieldClass} opacity-70`} value={user?.email || ''} disabled />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary mb-1">Country</label>
              <input className={fieldClass} value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Uganda" maxLength={80} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary mb-1">Tell us about your situation *</label>
              <textarea className={`${fieldClass} min-h-[140px]`} value={reason} onChange={(e) => setReason(e.target.value)} required maxLength={1999}
                placeholder="Share a little about why a scholarship would help your formation right now." />
            </div>
            <button type="submit" disabled={submitting}
              className="w-full py-3 rounded-xl font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: 'var(--ember)' }}>
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>
          </form>
        </Card>
      )}
    </div>
  );
};

export default ScholarshipApplicationPage;
