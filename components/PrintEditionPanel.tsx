import React, { useEffect, useState } from 'react';
import { BookCopy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import {
  getPrintAvailability,
  requestPrintAccess,
  type PrintAvailability,
} from '../services/printService';

interface PrintEditionPanelProps {
  bookId: string;
}

/**
 * Print-edition availability for the reader's country (resolved server-side via
 * Cloudflare geo). Three outcomes:
 *   available  — order the print copy at a localized price
 *   comingSoon — print exists but no distribution in their country: offer a
 *                waitlist so the ministry can arrange shipping or a centre
 *   notOffered — render nothing
 */
const PrintEditionPanel: React.FC<PrintEditionPanelProps> = ({ bookId }) => {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [info, setInfo] = useState<PrintAvailability | null>(null);
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState(user?.displayName || '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPrintAvailability(bookId)
      .then((data) => { if (!cancelled) setInfo(data); })
      .catch(() => { /* print panel is supplementary */ });
    return () => { cancelled = true; };
  }, [bookId]);

  if (!info || info.state === 'notOffered') return null;

  const formatPrice = (amount?: number, currency?: string) =>
    currency === 'USD' || !currency ? `$${(amount ?? 0).toLocaleString()}` : `${currency} ${(amount ?? 0).toLocaleString()}`;

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await requestPrintAccess(bookId, { email: email.trim(), name: name.trim() || undefined, message: message.trim() || undefined });
      setRequested(true);
      notify('Thank you. We will reach out about getting a print copy to you.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Your request could not be sent. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 rounded-xl border border-brand-border p-6" style={{ background: 'var(--bg-card, #FBF6EA)' }}>
      <div className="flex items-center gap-2 mb-3">
        <BookCopy className="w-5 h-5 text-brand-accent" />
        <h3 className="text-lg font-bold text-brand-text-primary" style={{ fontFamily: 'var(--serif-display)' }}>Print edition</h3>
      </div>

      {info.state === 'available' ? (
        <div>
          <p className="text-sm text-brand-text-secondary mb-4">
            A physical copy ships to {info.countryName} now.
          </p>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span className="text-2xl font-semibold text-brand-text-primary" style={{ fontFamily: 'var(--serif-display)' }}>
              {formatPrice(info.price ?? info.priceUsd, info.currency)}
            </span>
            <a
              href="/help"
              className="px-5 py-2.5 rounded-lg font-semibold text-white"
              style={{ background: 'var(--ember, #C23B1E)' }}
            >
              Order a print copy
            </a>
          </div>
          <p className="text-xs text-brand-text-secondary mt-3">
            Print orders are arranged with our local team to keep shipping affordable.
          </p>
        </div>
      ) : requested ? (
        <p className="text-sm text-brand-text-secondary">
          You are on the list for {info.countryName}. We will be in touch about getting a print copy to you.
        </p>
      ) : (
        <div>
          <p className="text-sm text-brand-text-secondary mb-1">
            The print edition is not in {info.countryName} yet.
          </p>
          <p className="text-sm text-brand-text-secondary mb-4">
            Join the waitlist and we will arrange a way to get a copy to you — by shipping or by setting up a local distribution point.
          </p>
          <form onSubmit={handleRequest} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-text-primary focus:outline-none focus:border-brand-accent"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-text-primary focus:outline-none focus:border-brand-accent"
              />
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Anything that helps us reach you (city, quantity, etc.) — optional"
              rows={2}
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-text-primary focus:outline-none focus:border-brand-accent"
            />
            <button
              type="submit"
              disabled={submitting || !email.trim()}
              className="px-5 py-2.5 rounded-lg font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--ember, #C23B1E)' }}
            >
              {submitting ? 'Sending…' : 'Request a print copy'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PrintEditionPanel;
