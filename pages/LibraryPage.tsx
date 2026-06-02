import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { NotebookPen, BookMarked, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { SpinnerIcon } from '../components/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { listJournalEntries, type JournalEntry } from '../services/journalService';

// ─── Motion ─────────────────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type LibraryTab = 'notes' | 'highlights';

// Tonal accent for the left rule on each note, derived from the entry's saved colour.
// Tints stay within the brand surface system — no raw palette swatches.
const NOTE_RULE: Record<JournalEntry['color'], string> = {
  blue: 'var(--gold-ds, #B7892E)',
  green: 'var(--ember, #C23B1E)',
  yellow: 'var(--amber-ds, #E87A2C)',
  pink: 'var(--crimson, #8E1B1B)',
};

const formatDate = (iso: string): string => {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return '';
  return new Date(parsed).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// ─── Eyebrow / section label ────────────────────────────────────────────────

const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p
    style={{
      fontFamily: 'var(--sans-ui)',
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)',
    }}
    className="mb-4"
  >
    {children}
  </p>
);

// ─── Note card ──────────────────────────────────────────────────────────────

const NoteCard: React.FC<{ entry: JournalEntry }> = ({ entry }) => {
  const dateLabel = formatDate(entry.createdAt);
  return (
    <motion.div variants={fadeUp}>
      <Card
        className="h-full flex flex-col"
        style={{ borderLeft: `3px solid ${NOTE_RULE[entry.color]}` }}
      >
        {entry.prompt && (
          <p
            style={{
              fontFamily: 'var(--serif-body)',
              fontStyle: 'italic',
              fontSize: '0.875rem',
              lineHeight: 1.5,
              color: 'var(--fg-3)',
            }}
            className="mb-3"
          >
            &ldquo;{entry.prompt}&rdquo;
          </p>
        )}

        <p
          style={{
            fontFamily: 'var(--serif-body)',
            fontSize: '1rem',
            lineHeight: 1.65,
            color: 'var(--fg-1)',
            whiteSpace: 'pre-wrap',
          }}
          className="flex-1"
        >
          {entry.text}
        </p>

        {dateLabel && (
          <p
            style={{
              fontFamily: 'var(--sans-ui)',
              fontSize: '0.75rem',
              letterSpacing: '0.03em',
              color: 'var(--fg-3)',
            }}
            className="mt-4 pt-3 border-t border-brand-border"
          >
            {dateLabel}
          </p>
        )}
      </Card>
    </motion.div>
  );
};

// ─── Main page ──────────────────────────────────────────────────────────────

const LibraryPage: React.FC = () => {
  const { user } = useAuth();
  const { notify } = useNotifications();

  const [activeTab, setActiveTab] = useState<LibraryTab>('notes');
  const [notes, setNotes] = useState<JournalEntry[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setNotes([]);
      setLoadingNotes(false);
      return;
    }

    setLoadingNotes(true);
    listJournalEntries(user.uid)
      .then((entries) => {
        if (!cancelled) setNotes(entries);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : 'We could not load your notes just now.';
        notify(message, 'error');
      })
      .finally(() => {
        if (!cancelled) setLoadingNotes(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, notify]);

  const noteCountLabel = useMemo(() => {
    if (loadingNotes) return '';
    return `${notes.length} ${notes.length === 1 ? 'entry' : 'entries'}`;
  }, [loadingNotes, notes.length]);

  const tabs: { id: LibraryTab; label: string }[] = [
    { id: 'notes', label: 'Notes' },
    { id: 'highlights', label: 'Highlights' },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-24 px-0">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.header
        className="mb-10 pt-2"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <p
          style={{
            fontFamily: 'var(--sans-ui)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ember)',
          }}
          className="mb-3"
        >
          Yours, in one place
        </p>

        <h1
          style={{
            fontFamily: 'var(--serif-display)',
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            fontWeight: 600,
            lineHeight: 1.05,
            color: 'var(--fg-1)',
          }}
          className="mb-3"
        >
          Your Library
        </h1>

        <p
          style={{
            fontFamily: 'var(--serif-body)',
            fontStyle: 'italic',
            fontSize: '1.0625rem',
            lineHeight: 1.6,
            color: 'var(--fg-3)',
          }}
          className="max-w-xl"
        >
          Every reflection you have written and every passage you have marked,
          gathered together. A quiet record of where God has met you.
        </p>
      </motion.header>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-1 mb-8 border-b border-brand-border"
        role="tablist"
        aria-label="Library sections"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className="relative px-4 py-3 text-sm font-semibold transition-colors"
              style={{
                fontFamily: 'var(--sans-ui)',
                color: isActive ? 'var(--fg-1)' : 'var(--fg-3)',
              }}
            >
              {tab.label}
              {isActive && (
                <motion.span
                  layoutId="library-tab-underline"
                  className="absolute left-0 right-0 -bottom-px h-0.5"
                  style={{ background: 'var(--ember)' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Notes ───────────────────────────────────────────────────────── */}
      {activeTab === 'notes' && (
        <section aria-label="Notes">
          {loadingNotes ? (
            <div className="flex justify-center py-20">
              <SpinnerIcon className="w-8 h-8" style={{ color: 'var(--ember)' }} />
            </div>
          ) : notes.length === 0 ? (
            <EmptyState
              icon={<NotebookPen className="w-7 h-7" />}
              heading="No notes yet"
              subtext="Your journal entries and reflections will gather here. Start with a single line."
              ctaLabel="Open Journaling"
              ctaHref="/app/journaling"
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <Eyebrow>{noteCountLabel}</Eyebrow>
                <Link
                  to="/app/journaling"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{ fontFamily: 'var(--sans-ui)', color: 'var(--ember)' }}
                >
                  Write a new entry
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
                variants={stagger}
                initial="hidden"
                animate="visible"
              >
                {notes.map((entry) => (
                  <NoteCard key={entry.id} entry={entry} />
                ))}
              </motion.div>
            </>
          )}
        </section>
      )}

      {/* ── Highlights ──────────────────────────────────────────────────── */}
      {activeTab === 'highlights' && (
        <section aria-label="Highlights">
          {/* Highlights are stored per-content (Bible, books, devotionals) and read
              one source at a time. A unified, cross-content view is the next step;
              until the aggregation endpoint lands, this section invites the reader
              back to where highlights are made. */}
          <EmptyState
            icon={<BookMarked className="w-7 h-7" />}
            heading="Your highlights, coming together"
            subtext="Passages you mark while reading the Bible and books live with each text today. A single home for all of them is on the way."
            ctaLabel="Open the Bible Reader"
            ctaHref="/app/bible"
          />
        </section>
      )}
    </div>
  );
};

export default LibraryPage;
