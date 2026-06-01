import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2 } from 'lucide-react';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { SparklesIcon, SendIcon } from '../components/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import {
  type Testimony,
  listTestimonies,
  submitTestimony,
  deleteTestimony,
} from '../services/testimonyService';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const GHOST_STARTER =
  'There was a season when… and then God…';

// ─── Avatar (initials fallback) ───────────────────────────────────────────────

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '✦';

const Avatar: React.FC<{ name: string }> = ({ name }) => (
  <div
    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
    style={{ background: 'var(--bg-sunk)', color: 'var(--ember)' }}
    aria-hidden
  >
    {initialsOf(name)}
  </div>
);

// ─── Share Story Modal ────────────────────────────────────────────────────────

const ShareStoryModal: React.FC<{
  onClose: () => void;
  onSubmit: (title: string, text: string) => Promise<void>;
}> = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !text.trim() || saving) return;
    setSaving(true);
    try {
      await onSubmit(title, text);
      setSaved(true);
      setTimeout(onClose, 1600);
    } catch {
      // Error surfaced via toast by the caller
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-end sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-brand-secondary rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md p-6 m-0 sm:m-4"
        initial={{ y: 48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 48, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 38 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-2xl font-black text-brand-text-primary mb-5 flex items-center gap-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <SparklesIcon className="w-6 h-6 text-brand-accent" />
          Share Your Story
        </h2>

        {saved ? (
          <div className="py-8 text-center">
            <p className="text-brand-text-primary font-bold text-lg mb-1" style={{ fontFamily: 'var(--serif-display, var(--font-display))' }}>Your testimony has been received.</p>
            <p className="text-sm text-brand-text-secondary" style={{ fontFamily: 'var(--serif-body)' }}>Thank you for declaring what God has done.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="A title for your testimony"
                maxLength={160}
                className="w-full bg-brand-dark border border-brand-border rounded-xl py-2.5 px-3 text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                maxLength={2000}
                className="w-full p-3 bg-brand-dark border border-brand-border rounded-xl text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none"
                placeholder={`${GHOST_STARTER}\n\nShare your story of faith, gratitude, or a moment of God's goodness…`}
              />
              <p className="text-xs text-brand-text-secondary/60 flex items-center gap-1.5">
                <span aria-hidden>🎙</span>
                Type or use your phone's microphone to speak.
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-xl text-brand-text-secondary hover:bg-brand-border transition-colors"
              >
                Cancel
              </button>
              <motion.button
                onClick={handleSave}
                disabled={!title.trim() || !text.trim() || saving}
                className="px-6 py-2.5 rounded-xl bg-brand-accent text-white font-semibold shadow-md disabled:opacity-40"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {saving ? 'Sharing…' : 'Share Story'}
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

// ─── Testimony Card ───────────────────────────────────────────────────────────

const TestimonyCard: React.FC<{
  testimony: Testimony;
  canModerate: boolean;
  onDelete: (t: Testimony) => void;
}> = ({ testimony, canModerate, onDelete }) => (
  <motion.div variants={fadeUp} transition={{ duration: 0.4, ease: EASE }}>
    <Card className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-3 pb-3 border-b border-brand-border gap-2">
        <h3 className="text-base font-bold text-brand-accent flex items-center gap-2 leading-snug">
          <SparklesIcon className="w-4 h-4 flex-shrink-0" />
          {testimony.title}
        </h3>
        {canModerate && (
          <button
            onClick={() => onDelete(testimony)}
            className="flex-shrink-0 text-brand-text-secondary hover:text-red-400 transition-colors"
            title="Remove testimony"
            aria-label="Remove testimony"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-brand-text-primary text-sm leading-relaxed flex-grow">
        {testimony.text}
      </p>

      <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-brand-border">
        <Avatar name={testimony.author} />
        <span className="text-xs font-semibold text-brand-text-secondary">{testimony.author}</span>
      </div>
    </Card>
  </motion.div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const TestimoniesPage: React.FC = () => {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canModerate = user?.role === 'admin';

  const load = async () => {
    try {
      setTestimonies(await listTestimonies());
    } catch {
      notify('Could not load testimonies right now. Please try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (title: string, text: string) => {
    if (!user?.uid) {
      notify('Please sign in to share your story.', 'error');
      throw new Error('auth required');
    }
    try {
      await submitTestimony({ uid: user.uid, displayName: user.displayName }, { title, text });
      notify('Your testimony has been shared. Thank you!', 'success');
      await load();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not share your testimony.', 'error');
      throw error;
    }
  };

  const handleDelete = async (t: Testimony) => {
    if (!window.confirm(`Remove the testimony "${t.title}"?`)) return;
    try {
      await deleteTestimony(t.id);
      notify('Testimony removed.', 'success');
      setTestimonies((prev) => prev.filter((x) => x.id !== t.id));
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not remove testimony.', 'error');
    }
  };

  const hasTestimonies = testimonies.length > 0;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <motion.div
        className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2">
            Community
          </p>
          <h1
            className="text-4xl font-black text-brand-text-primary mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Wall of Testimony
          </h1>
          <p className="text-brand-text-secondary max-w-xl">
            A space to celebrate God's faithfulness — answered prayers, quiet mercies, and the
            everyday moments that remind us He is near.
          </p>
        </div>

        <motion.button
          onClick={() => setIsModalOpen(true)}
          className="flex-shrink-0 px-6 py-3 rounded-full bg-brand-accent text-white font-bold shadow-lg flex items-center gap-2 self-start sm:self-auto"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <SendIcon className="w-4 h-4" />
          Share Your Story
        </motion.button>
      </motion.div>

      {/* Body */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-accent" />
        </div>
      ) : !hasTestimonies ? (
        <EmptyState
          icon={<SparklesIcon className="w-8 h-8" />}
          heading="No testimonies yet"
          subtext="Yours could be the first. What has God done?"
          ctaLabel="Share Your Story"
          ctaOnClick={() => setIsModalOpen(true)}
        />
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {testimonies.map((item) => (
            <TestimonyCard
              key={item.id}
              testimony={item}
              canModerate={canModerate}
              onDelete={handleDelete}
            />
          ))}
        </motion.div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <ShareStoryModal
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TestimoniesPage;
