import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { HeartHandshake, Check, X } from 'lucide-react';
import Card from '../components/Card';
import { useNotifications } from '../contexts/NotificationContext';
import {
  subscribeApplications,
  decideApplication,
  getErrorMessage,
  type ScholarshipApplication,
} from '../services/scholarshipService';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const StatusPill: React.FC<{ status: ScholarshipApplication['status'] }> = ({ status }) => {
  const map = {
    pending: 'bg-brand-accent/15 text-brand-accent',
    accepted: 'bg-status-success/15 text-status-success',
    declined: 'bg-status-error/15 text-status-error',
  } as const;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${map[status]}`}>{status}</span>;
};

const ScholarshipReviewPage: React.FC = () => {
  const { notify } = useNotifications();
  const [items, setItems] = useState<ScholarshipApplication[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => subscribeApplications(setItems), []);

  const pendingCount = useMemo(() => items.filter((a) => a.status === 'pending').length, [items]);

  const accept = async (app: ScholarshipApplication) => {
    setBusyId(app.id);
    try {
      await decideApplication(app, 'accept');
      notify(`Approved — ${app.applicantName} now has Growth access.`, 'success');
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDecline = async (app: ScholarshipApplication) => {
    setBusyId(app.id);
    try {
      await decideApplication(app, 'decline', declineReason);
      notify('Application declined and the applicant notified.', 'success');
      setDecliningId(null);
      setDeclineReason('');
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4">
      <motion.div className="mb-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2">Review</p>
        <h1 className="text-4xl font-black text-brand-text-primary inline-flex items-center gap-3" style={{ fontFamily: 'var(--serif-display)' }}>
          <HeartHandshake className="w-8 h-8 text-brand-accent" /> Scholarships
        </h1>
        <p className="text-sm text-brand-text-secondary mt-2">{pendingCount} awaiting review. Approving grants 6 months of Growth and emails the applicant.</p>
      </motion.div>

      <div className="space-y-3">
        {items.length === 0 && <p className="text-sm text-brand-text-secondary text-center py-8">No applications yet.</p>}
        {items.map((app) => (
          <Card key={app.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-brand-text-primary truncate">{app.applicantName}</p>
                  <StatusPill status={app.status} />
                </div>
                <p className="text-xs text-brand-text-secondary">{app.applicantEmail}{app.country ? ` · ${app.country}` : ''}</p>
                <p className="text-sm text-brand-text-secondary mt-2 whitespace-pre-wrap">{app.reason}</p>
                {app.status === 'declined' && app.declineReason && (
                  <p className="text-xs text-status-error mt-2">Reason: {app.declineReason}</p>
                )}
              </div>
              {app.status === 'pending' && (
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button type="button" onClick={() => accept(app)} disabled={busyId === app.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: 'var(--sage)' }}>
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button type="button" onClick={() => { setDecliningId(app.id); setDeclineReason(''); }} disabled={busyId === app.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-status-error border border-status-error/30 hover:bg-status-error/10">
                    <X className="w-4 h-4" /> Decline
                  </button>
                </div>
              )}
            </div>

            {decliningId === app.id && (
              <div className="mt-4 border-t border-brand-border pt-4">
                <label className="block text-xs font-semibold text-brand-text-secondary mb-1">Reason (sent to the applicant)</label>
                <textarea className="w-full rounded-lg border border-brand-border bg-brand-dark px-3 py-2 text-sm text-brand-text-primary outline-none focus:ring-2 focus:ring-brand-accent min-h-[80px]"
                  value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} maxLength={1999} placeholder="A kind, clear reason." />
                <div className="flex items-center gap-2 mt-2">
                  <button type="button" onClick={() => confirmDecline(app)} disabled={busyId === app.id}
                    className="px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: 'var(--crimson)' }}>
                    {busyId === app.id ? 'Sending…' : 'Confirm decline'}
                  </button>
                  <button type="button" onClick={() => { setDecliningId(null); setDeclineReason(''); }}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-brand-text-secondary hover:bg-brand-secondary">Cancel</button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ScholarshipReviewPage;
