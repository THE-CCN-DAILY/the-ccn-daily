import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Clock } from 'lucide-react';
import { SendIcon, SpinnerIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import {
  type Comment,
  type CommentContentType,
  listPublishedComments,
  listMyComments,
  submitComment,
} from '../services/commentsService';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const MAX_TEXT = 2000;

interface ProductCommentsProps {
  contentType: CommentContentType;
  contentId: string;
  /** Optional heading override (defaults to "Comments"). */
  heading?: string;
}

// ─── Avatar (initials fallback) ───────────────────────────────────────────────

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?';

const Avatar: React.FC<{ name: string }> = ({ name }) => (
  <div
    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
    style={{ background: 'var(--bg-sunk)', color: 'var(--ember)' }}
    aria-hidden
  >
    {initialsOf(name)}
  </div>
);

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

// ─── Published comment card (matches testimony card styling) ──────────────────

const PublishedComment: React.FC<{ comment: Comment }> = ({ comment }) => (
  <div className="flex items-start gap-3 py-4 border-b border-brand-border last:border-b-0">
    <Avatar name={comment.author} />
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-sm font-semibold text-brand-text-primary">{comment.author}</span>
        <span className="text-xs text-brand-text-secondary/70">{formatDate(comment.createdAt)}</span>
      </div>
      <p className="text-sm leading-relaxed text-brand-text-secondary mt-1 whitespace-pre-wrap break-words">
        {comment.text}
      </p>
    </div>
  </div>
);

// ─── Component ─────────────────────────────────────────────────────────────────

const ProductComments: React.FC<ProductCommentsProps> = ({
  contentType,
  contentId,
  heading = 'Comments',
}) => {
  const { user, openSignIn } = useAuth();
  const { notify } = useNotifications();

  const [comments, setComments] = useState<Comment[]>([]);
  const [mine, setMine] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const load = async () => {
    if (!contentId) {
      setLoading(false);
      return;
    }
    try {
      const [published, myOwn] = await Promise.all([
        listPublishedComments(contentType, contentId),
        user?.uid ? listMyComments(user.uid) : Promise.resolve<Comment[]>([]),
      ]);
      setComments(published);
      setMine(myOwn);
    } catch {
      notify('Could not load comments right now. Please try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType, contentId, user?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) {
      notify('Please sign in to leave a comment.', 'error');
      openSignIn();
      return;
    }
    const trimmed = text.trim();
    if (!trimmed || posting) return;

    setPosting(true);
    try {
      await submitComment(
        { uid: user.uid, displayName: user.displayName },
        { contentType, contentId, text: trimmed },
      );
      setText('');
      notify('Thank you! Your comment was submitted for review.', 'success');
      await load();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not post your comment.', 'error');
    } finally {
      setPosting(false);
    }
  };

  // The author's own comments for THIS item that aren't public yet (pending/rejected).
  const myUnpublished = mine.filter(
    (c) =>
      c.contentType === contentType &&
      c.contentId === contentId &&
      c.status !== 'published',
  );

  return (
    <section className="mt-10" aria-labelledby="product-comments-heading">
      <h2
        id="product-comments-heading"
        className="flex items-center gap-2 text-lg font-bold text-brand-text-primary mb-1"
      >
        <MessageCircle className="w-5 h-5 text-brand-accent" />
        {heading}
        {comments.length > 0 && (
          <span className="text-sm font-semibold text-brand-text-secondary">
            ({comments.length})
          </span>
        )}
      </h2>
      <p className="text-xs text-brand-text-secondary/70 mb-4">
        Comments are reviewed before they appear publicly.
      </p>

      {/* Submit box */}
      <form onSubmit={handleSubmit} className="flex items-start gap-3 mb-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={MAX_TEXT}
          placeholder={user ? 'Share an encouraging thought…' : 'Sign in to leave a comment…'}
          disabled={posting}
          className="flex-1 resize-none rounded-xl border border-brand-border bg-brand-secondary p-3 text-sm text-brand-text-primary placeholder-brand-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!text.trim() || posting}
          aria-label="Submit comment for review"
          className="flex-shrink-0 rounded-full bg-brand-accent p-3 text-white shadow-md disabled:opacity-40"
        >
          {posting ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SendIcon className="w-5 h-5" />}
        </button>
      </form>

      {/* The author's own pending / declined comments (status + reason) */}
      <AnimatePresence>
        {myUnpublished.length > 0 && (
          <motion.div
            className="mb-6 space-y-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-text-secondary">
              Your submissions
            </p>
            {myUnpublished.map((c) => (
              <div
                key={c.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-brand-border bg-brand-secondary/50 p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-brand-text-primary line-clamp-2">{c.text}</p>
                  {c.status === 'rejected' && c.declineReason && (
                    <p className="text-xs text-status-error mt-1">Not published: {c.declineReason}</p>
                  )}
                </div>
                <span
                  className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    c.status === 'pending'
                      ? 'text-status-warning bg-status-warning/10'
                      : 'text-status-error bg-status-error/10'
                  }`}
                >
                  {c.status === 'pending' && <Clock className="w-3 h-3" />}
                  {c.status === 'pending' ? 'In review' : 'Declined'}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Published comments */}
      {loading ? (
        <div className="flex justify-center py-10">
          <SpinnerIcon className="h-7 w-7 animate-spin text-brand-accent" />
        </div>
      ) : comments.length === 0 ? (
        <p className="py-8 text-center text-sm text-brand-text-secondary">
          No comments yet. Be the first to share.
        </p>
      ) : (
        <div className="rounded-2xl border border-brand-border bg-brand-secondary/30 px-4">
          {comments.map((c) => (
            <PublishedComment key={c.id} comment={c} />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductComments;
