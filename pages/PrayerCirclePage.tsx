/**
 * PrayerCirclePage — intercession management surface.
 *
 * Users build a personal prayer list of people God has placed on
 * their heart. Each day the app surfaces 1–2 people for focused
 * intercession, seeded by date so the selection is consistent
 * across the day.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { usePrayerCircle, PrayerPerson } from '../hooks/usePrayerCircle';

const ease = [0.22, 1, 0.36, 1] as const;

// ─── Icons ───────────────────────────────────────────────────

const HeartIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const PlusIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const PencilIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const TrashIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CheckIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// ─── Relationship badge colours ────────────────────────────

const relationshipColour: Record<string, string> = {
  Family:    'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  Friend:    'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  Colleague: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  Ministry:  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  Neighbour: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
  Other:     'bg-on-surface/10 text-on-surface/60',
};

function relationshipBadge(rel: string): string {
  return relationshipColour[rel] ?? relationshipColour.Other;
}

// ─── Person avatar (initial or photo) ────────────────────────

const PersonAvatar: React.FC<{ person: PrayerPerson; size?: 'sm' | 'lg' }> = ({
  person,
  size = 'sm',
}) => {
  const dim = size === 'lg' ? 'h-16 w-16 text-2xl' : 'h-10 w-10 text-sm';
  const colours = [
    'bg-amber-500', 'bg-sky-500', 'bg-emerald-500',
    'bg-violet-500', 'bg-rose-500', 'bg-teal-500',
  ];
  const colour = colours[person.name.charCodeAt(0) % colours.length];

  if (person.photoUrl) {
    return (
      <img
        src={person.photoUrl}
        alt={person.name}
        className={`${dim} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${dim} ${colour} flex items-center justify-center rounded-full font-bold text-white`}
    >
      {person.name.charAt(0).toUpperCase()}
    </div>
  );
};

// ─── Add / Edit form ─────────────────────────────────────────

const RELATIONSHIPS = ['Family', 'Friend', 'Colleague', 'Ministry', 'Neighbour', 'Other'];

interface PersonFormProps {
  initial?: Partial<PrayerPerson>;
  onSave: (data: Omit<PrayerPerson, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const PersonForm: React.FC<PersonFormProps> = ({ initial, onSave, onCancel }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [relationship, setRelationship] = useState(initial?.relationship ?? 'Family');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [pointsRaw, setPointsRaw] = useState(
    initial?.prayerPoints?.join('\n') ?? ''
  );
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      relationship,
      notes: notes.trim(),
      prayerPoints: pointsRaw
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
      photoUrl: photoUrl.trim() || undefined,
      lastPrayedDate: initial?.lastPrayedDate,
    });
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-on-surface/10 bg-surface p-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.3, ease }}
    >
      <h3 className="font-display text-base font-semibold text-on-surface">
        {initial?.name ? 'Edit person' : 'Add someone to your circle'}
      </h3>

      {/* Name */}
      <div>
        <label className="mb-1 block text-xs font-medium text-on-surface/50">Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Sarah"
          className="w-full rounded-xl border border-on-surface/12 bg-bg px-4 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface/35 focus:border-primary-brand/60"
        />
      </div>

      {/* Relationship */}
      <div>
        <label className="mb-1 block text-xs font-medium text-on-surface/50">Relationship</label>
        <div className="flex flex-wrap gap-2">
          {RELATIONSHIPS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRelationship(r)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                relationship === r
                  ? 'bg-primary-brand text-on-primary-brand'
                  : 'bg-surface-high text-on-surface/60 hover:text-on-surface'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Prayer points */}
      <div>
        <label className="mb-1 block text-xs font-medium text-on-surface/50">
          Prayer points <span className="font-normal">(one per line)</span>
        </label>
        <textarea
          value={pointsRaw}
          onChange={(e) => setPointsRaw(e.target.value)}
          rows={4}
          placeholder={"Healing from illness\nStrength in their marriage\nGuidance for their work"}
          className="w-full resize-none rounded-xl border border-on-surface/12 bg-bg px-4 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface/35 focus:border-primary-brand/60"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block text-xs font-medium text-on-surface/50">
          Context / background <span className="font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Any background that helps you pray specifically"
          className="w-full resize-none rounded-xl border border-on-surface/12 bg-bg px-4 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface/35 focus:border-primary-brand/60"
        />
      </div>

      {/* Photo URL (optional) */}
      <div>
        <label className="mb-1 block text-xs font-medium text-on-surface/50">
          Photo URL <span className="font-normal">(optional)</span>
        </label>
        <input
          type="url"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-xl border border-on-surface/12 bg-bg px-4 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface/35 focus:border-primary-brand/60"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 rounded-xl bg-primary-brand py-3 font-display text-sm font-semibold text-on-primary-brand transition-all hover:bg-primary-brand/90"
        >
          {initial?.name ? 'Save changes' : 'Add to circle'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-on-surface/12 px-4 py-3 font-display text-sm text-on-surface/60 transition-colors hover:text-on-surface"
        >
          Cancel
        </button>
      </div>
    </motion.form>
  );
};

// ─── Person card ─────────────────────────────────────────────

interface PersonCardProps {
  person: PrayerPerson;
  onEdit: (p: PrayerPerson) => void;
  onDelete: (id: string) => void;
  onMarkPrayed: (id: string) => void;
  highlight?: boolean;
}

const PersonCard: React.FC<PersonCardProps> = ({
  person,
  onEdit,
  onDelete,
  onMarkPrayed,
  highlight = false,
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const prayedToday = person.lastPrayedDate === today;

  return (
    <motion.div
      layout
      className={`rounded-2xl border p-5 transition-colors ${
        highlight
          ? 'border-primary-brand/30 bg-primary-brand/5'
          : 'border-on-surface/10 bg-surface'
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25, ease }}
    >
      <div className="flex items-start gap-3">
        <PersonAvatar person={person} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-sm font-semibold text-on-surface">
              {person.name}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${relationshipBadge(person.relationship)}`}
            >
              {person.relationship}
            </span>
            {highlight && (
              <span className="rounded-full bg-primary-brand/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-brand">
                Today
              </span>
            )}
          </div>

          {person.prayerPoints.length > 0 && (
            <ul className="mt-2 space-y-1">
              {person.prayerPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-on-surface/70">
                  <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-brand/60" />
                  {pt}
                </li>
              ))}
            </ul>
          )}

          {person.notes && (
            <p className="mt-2 text-xs italic text-on-surface/50">{person.notes}</p>
          )}

          {person.lastPrayedDate && (
            <p className="mt-2 text-[10px] text-on-surface/40">
              Last prayed: {prayedToday ? 'Today' : person.lastPrayedDate}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => onMarkPrayed(person.id)}
          disabled={prayedToday}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
            prayedToday
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-primary-brand/10 text-primary-brand hover:bg-primary-brand/20'
          }`}
        >
          <CheckIcon className="h-3.5 w-3.5" />
          {prayedToday ? 'Prayed today' : 'Mark prayed'}
        </button>

        <button
          onClick={() => onEdit(person)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-on-surface/50 transition-colors hover:bg-surface-high hover:text-on-surface"
        >
          <PencilIcon className="h-3.5 w-3.5" />
          Edit
        </button>

        <button
          onClick={() => onDelete(person.id)}
          className="ml-auto flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs text-on-surface/30 transition-colors hover:bg-red-500/10 hover:text-red-500"
        >
          <TrashIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

// ─── Main page ─────────────────────────────────────────────

const PrayerCirclePage: React.FC = () => {
  const { user } = useAuth();
  const { people, todaysPeople, addPerson, updatePerson, deletePerson, markPrayed } =
    usePrayerCircle(user?.uid);

  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<PrayerPerson | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const todayIds = new Set(todaysPeople.map((p) => p.id));

  const handleSave = (data: Omit<PrayerPerson, 'id' | 'createdAt'>) => {
    if (editingPerson) {
      updatePerson(editingPerson.id, data);
    } else {
      addPerson(data);
    }
    setShowForm(false);
    setEditingPerson(null);
  };

  const handleEdit = (person: PrayerPerson) => {
    setEditingPerson(person);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deletePerson(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 pb-24 pt-6 md:px-0">

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-brand">Pray</p>
        <h1
          className="mb-2 text-4xl font-black text-on-surface font-display"
        >
          Prayer Circle
        </h1>
        <p className="text-on-surface/60">
          The people God has placed on your heart. Intercede for them — one day at a time.
        </p>
      </motion.div>

      {/* Today's prayer */}
      {todaysPeople.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease }}
        >
          <div className="mb-4 flex items-center gap-2">
            <HeartIcon className="h-4 w-4 text-primary-brand" />
            <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-primary-brand">
              Praying today
            </h2>
          </div>
          <div className="space-y-3">
            {todaysPeople.map((p) => (
              <PersonCard
                key={p.id}
                person={p}
                highlight
                onEdit={handleEdit}
                onDelete={handleDelete}
                onMarkPrayed={markPrayed}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* Empty state */}
      {people.length === 0 && !showForm && (
        <motion.div
          className="rounded-2xl border border-dashed border-on-surface/20 px-6 py-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <HeartIcon className="mx-auto mb-3 h-10 w-10 text-primary-brand/30" />
          <p className="font-display text-sm font-semibold text-on-surface">
            Your circle is empty
          </p>
          <p className="mt-1 text-xs text-on-surface/50">
            Add the people God has placed on your heart to pray for them with intention.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 rounded-xl bg-primary-brand px-5 py-2.5 font-display text-sm font-semibold text-on-primary-brand transition-all hover:bg-primary-brand/90"
          >
            Add your first person
          </button>
        </motion.div>
      )}

      {/* Add / Edit form */}
      <AnimatePresence>
        {showForm && (
          <PersonForm
            initial={editingPerson ?? undefined}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingPerson(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Full circle list */}
      {people.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-on-surface/50">
              All {people.length} {people.length === 1 ? 'person' : 'people'}
            </h2>
            {!showForm && (
              <button
                onClick={() => { setEditingPerson(null); setShowForm(true); }}
                className="flex items-center gap-1.5 rounded-xl bg-primary-brand/10 px-3 py-2 font-display text-xs font-semibold text-primary-brand transition-colors hover:bg-primary-brand/20"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Add person
              </button>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {people.map((p) => (
                <PersonCard
                  key={p.id}
                  person={p}
                  highlight={todayIds.has(p.id)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onMarkPrayed={markPrayed}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.section>
      )}

      {/* Scripture anchor */}
      <motion.blockquote
        className="border-l-2 border-primary-brand/40 pl-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="font-serif text-sm italic text-on-surface/60">
          "Therefore confess your sins to each other and pray for each other so that you may be healed.
          The prayer of a righteous person is powerful and effective."
        </p>
        <cite className="mt-1 block text-xs text-on-surface/40 not-italic">James 5:16</cite>
      </motion.blockquote>

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {deleteConfirmId && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full max-w-sm rounded-2xl border border-on-surface/12 bg-surface p-6 shadow-2xl"
                initial={{ scale: 0.95, y: 8 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.97, y: 4 }}
                transition={{ duration: 0.2, ease }}
                onClick={(e) => e.stopPropagation()}
              >
                <p className="font-display text-base font-semibold text-on-surface">
                  Remove from circle?
                </p>
                <p className="mt-1 text-sm text-on-surface/60">
                  {(() => {
                    const p = people.find((x) => x.id === deleteConfirmId);
                    return p
                      ? `${p.name} will be removed from your prayer circle.`
                      : 'This person will be removed.';
                  })()}
                </p>
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={confirmDelete}
                    className="flex-1 rounded-xl bg-red-500 py-2.5 font-display text-sm font-semibold text-white transition-all hover:bg-red-600"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="flex-1 rounded-xl border border-on-surface/12 py-2.5 font-display text-sm text-on-surface/70 transition-colors hover:text-on-surface"
                  >
                    Keep
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrayerCirclePage;
