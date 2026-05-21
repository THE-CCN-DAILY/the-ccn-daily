import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../components/Card';
import { PaintBrushIcon, PlusCircleIcon } from '../components/icons';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.03 } } };
import { useAuth } from '../contexts/AuthContext';
import {
  listJournalEntries,
  saveJournalEntry,
  type JournalEntry,
} from '../services/journalService';

const JournalingPage: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isWriting, setIsWriting] = useState(false);
  const [newEntryText, setNewEntryText] = useState('');
  const [selectedColor, setSelectedColor] = useState<JournalEntry['color']>('blue');

  const colors = [
    { id: 'blue',   bg: 'bg-blue-900/30',   border: 'border-blue-500/50',   stripe: 'bg-blue-400/60' },
    { id: 'green',  bg: 'bg-green-900/30',  border: 'border-green-500/50',  stripe: 'bg-green-400/60' },
    { id: 'yellow', bg: 'bg-yellow-900/30', border: 'border-yellow-500/50', stripe: 'bg-yellow-400/60' },
    { id: 'pink',   bg: 'bg-pink-900/30',   border: 'border-pink-500/50',   stripe: 'bg-pink-400/60' },
  ];

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchEntries = async () => {
      setLoading(true);
      setError('');
      try {
        setEntries(await listJournalEntries(user.uid));
      } catch (error) {
        setError('We could not load your journal entries. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [user]);

  const handleSaveEntry = async () => {
    if (!newEntryText.trim() || !user) return;

    const optimisticEntry: JournalEntry = {
      id: `journal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: user.uid,
      text: newEntryText.trim(),
      color: selectedColor,
      createdAt: new Date().toISOString(),
    };

    setSaving(true);
    setError('');
    try {
      setEntries([optimisticEntry, ...entries]);
      setNewEntryText('');
      setIsWriting(false);
      const savedEntry = await saveJournalEntry(user.uid, optimisticEntry);
      setEntries((current) =>
        current.map((entry) => (entry.id === optimisticEntry.id ? savedEntry : entry))
      );
    } catch (error) {
      setEntries((current) => current.filter((entry) => entry.id !== optimisticEntry.id));
      setError('We could not save that journal entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4">
      <div className="flex justify-between items-end mb-8">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2">PRAY</p>
          <h1 className="text-4xl font-black text-brand-text-primary mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Journaling
          </h1>
          <p className="text-brand-text-secondary">Write what God is speaking to you. Your private sanctuary of reflection.</p>
        </motion.div>
        <AnimatePresence>
          {!isWriting && (
            <motion.button
              onClick={() => setIsWriting(true)}
              className="flex items-center px-4 py-2 bg-brand-accent text-white font-bold rounded-xl hover:bg-opacity-90 transition-colors"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, ease: EASE }}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            >
              <PlusCircleIcon className="w-5 h-5 mr-2" />
              New Entry
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
      {isWriting && (
        <motion.div
          key="writing-panel"
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="mb-8"
        >
        <Card className="border-brand-accent/50 bg-brand-dark/50 p-0 overflow-hidden">
          {/* Accent stripe */}
          <div className="h-1 w-full bg-brand-accent/70 rounded-t-2xl" />
          <div className="p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-brand-text-primary">New Reflection</h3>
              <div className="flex items-center gap-2">
                {colors.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedColor(c.id as JournalEntry['color'])}
                    className={`w-6 h-6 rounded-full border-2 ${c.stripe} ${selectedColor === c.id ? c.border + ' ring-2 ring-offset-1 ring-offset-brand-dark ring-brand-accent/40' : 'border-transparent'} transition-transform hover:scale-110`}
                    aria-label={`Use ${c.id} journal color`}
                  />
                ))}
              </div>
            </div>
            <textarea
              value={newEntryText}
              onChange={(e) => setNewEntryText(e.target.value)}
              placeholder="What is on your heart today?"
              className="w-full h-40 bg-brand-dark border border-brand-border rounded-xl p-4 text-brand-text-primary focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 resize-none mb-5 placeholder-brand-text-secondary/60 leading-relaxed"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-brand-text-secondary/60">
                {newEntryText.trim() ? `${newEntryText.trim().split(/\s+/).filter(Boolean).length} words` : 'Start writing…'}
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsWriting(false)}
                  className="px-4 py-2 text-brand-text-secondary font-semibold hover:text-brand-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEntry}
                  disabled={!newEntryText.trim() || saving}
                  className="px-6 py-2 bg-brand-accent text-white font-bold rounded-xl disabled:opacity-50 hover:bg-opacity-90 transition-colors"
                >
                  {saving ? 'Saving…' : 'Save Entry'}
                </button>
              </div>
            </div>
          </div>
        </Card>
        </motion.div>
      )}
      </AnimatePresence>

      {error && (
        <Card className="mb-6 border-status-error/40 bg-status-error/10 p-4">
          <p className="text-sm font-semibold text-status-error">{error}</p>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
        </div>
      ) : entries.length > 0 ? (
        <motion.div
          className="space-y-6"
          variants={stagger} initial="hidden" animate="visible"
        >
          {entries.map((entry) => {
            const colorObj = colors.find(c => c.id === entry.color) || colors[0];
            return (
              <motion.div key={entry.id} variants={fadeUp} transition={{ duration: 0.45, ease: EASE }}>
              <Card className={`border ${colorObj.border} ${colorObj.bg} p-0 overflow-hidden`}>
                {/* Color-keyed accent stripe */}
                <div className={`h-1 w-full ${colorObj.stripe} rounded-t-2xl`} />
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${colorObj.border} ${colorObj.bg} text-brand-text-secondary`}>
                      {formatDate(entry.createdAt)}
                    </span>
                    <PaintBrushIcon className="w-4 h-4 text-brand-text-secondary/40" />
                  </div>
                  <p className="text-brand-text-primary whitespace-pre-wrap leading-relaxed text-[15px]">
                    {entry.text}
                  </p>
                  <div className="mt-5 pt-3 border-t border-current/10 flex items-center justify-end">
                    <span className="text-xs text-brand-text-secondary/50">
                      {entry.text.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                </div>
              </Card>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        !isWriting && (
          <Card className="text-center py-20 border-brand-border border-dashed bg-transparent">
            <PaintBrushIcon className="w-12 h-12 text-brand-text-secondary/50 mx-auto mb-5" />
            <h3 className="text-xl font-bold text-brand-text-primary mb-2">Your journal is empty</h3>
            <p className="text-brand-text-secondary mb-8 max-w-sm mx-auto leading-relaxed">
              Write what God is speaking to you. Every word matters here.
            </p>
            <button
              onClick={() => setIsWriting(true)}
              className="px-6 py-2.5 bg-brand-accent text-white font-bold rounded-xl border border-brand-accent hover:bg-opacity-90 transition-colors"
            >
              Write First Entry
            </button>
          </Card>
        )
      )}
    </div>
  );
};

export default JournalingPage;
