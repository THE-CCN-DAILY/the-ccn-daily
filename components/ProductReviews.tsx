import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Star, ExternalLink } from 'lucide-react';
import { SpinnerIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import {
  type BookReview,
  type ReviewAggregate,
  type ReviewContentType,
  listReviews,
  submitReview,
  MAX_REVIEW_TEXT,
} from '../services/reviewService';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface ProductReviewsProps {
  contentType: ReviewContentType;
  contentId: string;
  /** Admin-settable marketplace links keyed by platform (amazon, goodreads, …). */
  reviewLinks?: Record<string, string>;
  heading?: string;
}

// Friendly labels for the external marketplace platforms.
const MARKETPLACE_LABELS: Record<string, string> = {
  amazon: 'Amazon',
  goodreads: 'Goodreads',
  appleBooks: 'Apple Books',
  kobo: 'Kobo',
  barnesNoble: 'Barnes & Noble',
  audible: 'Audible',
  other: 'Review online',
};

// ─── Stars ────────────────────────────────────────────────────────────────────

const StarRow: React.FC<{ value: number; size?: number; className?: string }> = ({
  value,
  size = 16,
  className = '',
}) => (
  <span className={`inline-flex items-center gap-0.5 ${className}`} aria-hidden>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        style={{ width: size, height: size }}
        className={n <= Math.round(value) ? 'fill-brand-accent text-brand-accent' : 'text-brand-border'}
      />
    ))}
  </span>
);

const StarPicker: React.FC<{ value: number; onChange: (n: number) => void; disabled?: boolean }> = ({
  value,
  onChange,
  disabled,
}) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          disabled={disabled}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(0)}
          onClick={() => onChange(n)}
          className="p-0.5 disabled:opacity-50 transition-transform hover:scale-110"
        >
          <Star
            className={`h-7 w-7 ${
              n <= (hover || value) ? 'fill-brand-accent text-brand-accent' : 'text-brand-border'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const formatDate = (iso?: string): string => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
};

const initialsOf = (name: string): string =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';

// ─── Component ─────────────────────────────────────────────────────────────────

const ProductReviews: React.FC<ProductReviewsProps> = ({
  contentType,
  contentId,
  reviewLinks = {},
  heading = 'Reviews',
}) => {
  const { user, openSignIn } = useAuth();
  const { notify } = useNotifications();

  const [reviews, setReviews] = useState<BookReview[]>([]);
  const [aggregate, setAggregate] = useState<ReviewAggregate>({ count: 0, average: 0 });
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  const marketplaceEntries = Object.entries(reviewLinks).filter(([, url]) => Boolean(url));

  const load = async () => {
    if (!contentId) {
      setLoading(false);
      return;
    }
    try {
      const { reviews: list, aggregate: agg } = await listReviews(contentType, contentId);
      setReviews(list);
      setAggregate(agg);
    } catch {
      notify('Could not load reviews right now. Please try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType, contentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) {
      notify('Please sign in to leave a review.', 'error');
      openSignIn();
      return;
    }
    if (rating < 1) {
      notify('Please choose a star rating.', 'error');
      return;
    }
    if (posting) return;

    setPosting(true);
    try {
      await submitReview(contentType, contentId, {
        rating,
        body: body.trim(),
        authorName: user.displayName || undefined,
      });
      setRating(0);
      setBody('');
      notify('Thank you! Your review was submitted for approval.', 'success');
      await load();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not submit your review.', 'error');
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="mt-10" aria-labelledby="product-reviews-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2
          id="product-reviews-heading"
          className="flex items-center gap-2 text-lg font-bold text-brand-text-primary"
        >
          <Star className="w-5 h-5 text-brand-accent" />
          {heading}
        </h2>
        {aggregate.count > 0 && (
          <div className="flex items-center gap-2">
            <StarRow value={aggregate.average} />
            <span className="text-sm font-semibold text-brand-text-primary">{aggregate.average.toFixed(1)}</span>
            <span className="text-xs text-brand-text-secondary">
              ({aggregate.count} review{aggregate.count > 1 ? 's' : ''})
            </span>
          </div>
        )}
      </div>
      <p className="text-xs text-brand-text-secondary/70 mb-4">
        Reviews are approved by our team before they appear publicly.
      </p>

      {/* Submit box */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-brand-border bg-brand-secondary/40 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="text-sm font-semibold text-brand-text-primary">Your rating</span>
          <StarPicker value={rating} onChange={setRating} disabled={posting} />
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          maxLength={MAX_REVIEW_TEXT}
          placeholder={user ? 'Share what this meant to you (optional)…' : 'Sign in to leave a review…'}
          disabled={posting}
          className="w-full resize-none rounded-xl border border-brand-border bg-brand-secondary p-3 text-sm text-brand-text-primary placeholder-brand-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:opacity-50"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={posting || rating < 1}
            className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-5 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-40"
          >
            {posting ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
            Submit review
          </button>
        </div>
      </form>

      {/* "Loved it? Review it on…" — external marketplace affordance */}
      {marketplaceEntries.length > 0 && (
        <div className="mb-6 rounded-2xl border border-brand-accent/30 bg-brand-accent/5 p-4">
          <p className="text-sm font-semibold text-brand-text-primary mb-2">Loved it? Review it on…</p>
          <div className="flex flex-wrap gap-2">
            {marketplaceEntries.map(([key, url]) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-secondary px-3 py-1.5 text-xs font-semibold text-brand-text-primary transition-colors hover:border-brand-accent hover:text-brand-accent"
              >
                {MARKETPLACE_LABELS[key] || key}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Approved reviews */}
      {loading ? (
        <div className="flex justify-center py-10">
          <SpinnerIcon className="h-7 w-7 animate-spin text-brand-accent" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="py-8 text-center text-sm text-brand-text-secondary">
          No reviews yet. Be the first to share.
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="rounded-2xl border border-brand-border bg-brand-secondary/30 p-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: 'var(--bg-sunk)', color: 'var(--ember)' }}
                  aria-hidden
                >
                  {initialsOf(r.authorName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-brand-text-primary">{r.authorName}</span>
                    <StarRow value={r.rating} size={13} />
                    <span className="text-xs text-brand-text-secondary/70">{formatDate(r.createdAt)}</span>
                  </div>
                  {r.body && (
                    <p className="text-sm leading-relaxed text-brand-text-secondary mt-1 whitespace-pre-wrap break-words">
                      {r.body}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductReviews;
