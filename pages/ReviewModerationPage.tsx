import React, { useEffect, useState } from 'react';
import { Star, Check, X, Clock } from 'lucide-react';
import Card from '../components/Card';
import { useNotifications } from '../contexts/NotificationContext';
import {
  type BookReview,
  listReviewsForModeration,
  setReviewStatus,
} from '../services/reviewService';

const formatDate = (iso?: string): string => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
};

const Stars: React.FC<{ value: number }> = ({ value }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${value} of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        className={`w-4 h-4 ${n <= value ? 'fill-brand-accent text-brand-accent' : 'text-brand-border'}`}
      />
    ))}
  </span>
);

const ReviewModerationPage: React.FC = () => {
  const { notify } = useNotifications();
  const [pending, setPending] = useState<BookReview[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const queue = await listReviewsForModeration('pending');
      setPending(queue);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not load the review queue.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decide = async (review: BookReview, status: 'approved' | 'rejected') => {
    try {
      await setReviewStatus(review.id, status);
      notify(status === 'approved' ? 'Review approved and published.' : 'Review declined.', 'success');
      await load();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not update the review.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2">Command Center</p>
        <h1
          className="text-3xl font-black text-brand-text-primary flex items-center gap-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <Star className="w-7 h-7 text-brand-accent" />
          Review Moderation
        </h1>
        <p className="text-brand-text-secondary mt-2 max-w-xl">
          Book &amp; audiobook reviews wait here until you approve them. Approve to publish on the
          product page, or decline to remove it from the queue.
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-accent" />
        </div>
      ) : pending.length === 0 ? (
        <Card className="text-center py-16">
          <Star className="w-10 h-10 text-brand-text-secondary/50 mx-auto mb-3" />
          <p className="font-bold text-brand-text-primary">Nothing to review</p>
          <p className="text-sm text-brand-text-secondary mt-1">New reviews will appear here for approval.</p>
        </Card>
      ) : (
        <>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-3 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" /> Awaiting review ({pending.length})
          </p>
          <div className="space-y-3">
            {pending.map((r) => (
              <Card key={r.id} className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Stars value={r.rating} />
                    <span className="text-sm font-semibold text-brand-text-primary">{r.authorName}</span>
                  </div>
                  {r.body && (
                    <p className="text-sm text-brand-text-primary whitespace-pre-wrap break-words">{r.body}</p>
                  )}
                  <p className="text-xs text-brand-text-secondary mt-2">
                    on {r.contentType} · {r.bookId} · {formatDate(r.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => decide(r, 'approved')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-status-success hover:bg-status-success/10 transition-colors"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => decide(r, 'rejected')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-status-error hover:bg-status-error/10 transition-colors"
                  >
                    <X className="w-4 h-4" /> Decline
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ReviewModerationPage;
