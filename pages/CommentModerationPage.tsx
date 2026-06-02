import React, { useEffect, useState } from 'react';
import { MessagesSquare, Check, X, Clock } from 'lucide-react';
import Card from '../components/Card';
import { useNotifications } from '../contexts/NotificationContext';
import {
  type Comment,
  listPendingComments,
  approveComment,
  rejectComment,
} from '../services/commentsService';

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

const CommentModerationPage: React.FC = () => {
  const { notify } = useNotifications();
  const [pending, setPending] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const queue = await listPendingComments();
      setPending(queue);
    } catch {
      notify('Could not load the comment queue. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (c: Comment) => {
    try {
      await approveComment(c.id);
      notify('Comment approved and published.', 'success');
      await load();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not approve comment.', 'error');
    }
  };

  const handleReject = async (c: Comment) => {
    const reason = window.prompt('Decline this comment — give a reason the author will see:')?.trim();
    if (!reason) return;
    try {
      await rejectComment(c.id, reason);
      notify('Comment declined; the author will see your reason.', 'success');
      await load();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not decline comment.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2">
          Command Center
        </p>
        <h1
          className="text-3xl font-black text-brand-text-primary flex items-center gap-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <MessagesSquare className="w-7 h-7 text-brand-accent" />
          Comment Moderation
        </h1>
        <p className="text-brand-text-secondary mt-2 max-w-xl">
          Public comments wait here until you approve them. Approve to publish, or decline with a
          reason the author will see.
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-accent" />
        </div>
      ) : pending.length === 0 ? (
        <Card className="text-center py-16">
          <MessagesSquare className="w-10 h-10 text-brand-text-secondary/50 mx-auto mb-3" />
          <p className="font-bold text-brand-text-primary">Nothing to review</p>
          <p className="text-sm text-brand-text-secondary mt-1">
            New comments will appear here for approval.
          </p>
        </Card>
      ) : (
        <>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-3 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" /> Awaiting review ({pending.length})
          </p>
          <div className="space-y-3">
            {pending.map((c) => (
              <Card
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm text-brand-text-primary whitespace-pre-wrap break-words">
                    {c.text}
                  </p>
                  <p className="text-xs text-brand-text-secondary mt-2">
                    By {c.author} · on {c.contentType} · {formatDate(c.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(c)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-status-success hover:bg-status-success/10 transition-colors"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(c)}
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

export default CommentModerationPage;
