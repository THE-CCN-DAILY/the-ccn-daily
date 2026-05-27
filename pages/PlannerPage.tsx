
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DailyEntry {
  morningIntention: string;
  steps: [string, string, string];
  eveningReflection: string;
  savedAt?: unknown;
}

interface WeeklyEntry {
  weeklyIntention: string;
  scriptureAnchor: string;
  savedAt?: unknown;
}

interface WatchDate {
  date: string;
  label: string;
}

interface MonthlyEntry {
  monthlyGoal: string;
  watchDates: WatchDate[];
  savedAt?: unknown;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_VERSES: Record<number, { ref: string; text: string }> = {
  1: {
    ref: 'Proverbs 3:5–6',
    text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
  },
  2: {
    ref: 'Philippians 4:13',
    text: 'I can do all this through him who gives me strength.',
  },
  3: {
    ref: 'Psalm 46:10',
    text: 'Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.',
  },
  4: {
    ref: 'Lamentations 3:22–23',
    text: 'Because of the Lord\'s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.',
  },
  5: {
    ref: 'Isaiah 40:31',
    text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.',
  },
  6: {
    ref: 'Matthew 6:33',
    text: 'But seek first his kingdom and his righteousness, and all these things will be given to you as well.',
  },
  0: {
    ref: 'Psalm 23:1',
    text: 'The Lord is my shepherd, I lack nothing.',
  },
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getISOWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    return dt;
  });
}

function getCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const days: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) for (let i = 0; i < remaining; i++) days.push(null);
  return days;
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--serif-display, "Cormorant Garamond", "Didot", Georgia, serif)',
  fontWeight: 600,
  color: 'var(--fg-1, #2A1C15)',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: 'var(--crimson, #8E1B1B)',
  display: 'block',
  marginBottom: '0.5rem',
};

const textareaStyle: React.CSSProperties = {
  fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)',
  fontSize: '17px',
  lineHeight: 1.7,
  color: 'var(--fg-1, #2A1C15)',
  background: 'transparent',
  width: '100%',
  resize: 'none',
  outline: 'none',
  border: 'none',
  borderBottom: '1px solid var(--color-brand-border, rgba(42,28,21,0.12))',
  paddingBottom: '0.5rem',
  minHeight: '80px',
};

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)',
  fontSize: '16px',
  color: 'var(--fg-1, #2A1C15)',
  background: 'transparent',
  width: '100%',
  outline: 'none',
  border: 'none',
  borderBottom: '1px solid var(--color-brand-border, rgba(42,28,21,0.12))',
  paddingBottom: '0.35rem',
};

const sectionCard = (children: React.ReactNode, className = ''): React.ReactNode => (
  <div
    className={`rounded-2xl p-6 ${className}`}
    style={{
      background: 'var(--bg-card, #FBF6EA)',
      border: '1px solid rgba(42,28,21,0.08)',
      boxShadow: 'var(--sh-card, 0 1px 2px rgba(42,28,21,.06), 0 8px 24px rgba(42,28,21,.05))',
    }}
  >
    {children}
  </div>
);

// ─── Daily View ───────────────────────────────────────────────────────────────

const DailyView: React.FC<{ uid: string }> = ({ uid }) => {
  const today = new Date();
  const dayKey = formatDateKey(today);
  const dayOfWeek = today.getDay();
  const verse = DAY_VERSES[dayOfWeek];

  const [entry, setEntry] = useState<DailyEntry>({
    morningIntention: '',
    steps: ['', '', ''],
    eveningReflection: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const docRef = doc(db, 'users', uid, 'planner', 'daily', dayKey, 'entry');
    getDoc(docRef).then(snap => {
      if (snap.exists()) {
        const data = snap.data() as DailyEntry;
        setEntry({
          morningIntention: data.morningIntention ?? '',
          steps: data.steps ?? ['', '', ''],
          eveningReflection: data.eveningReflection ?? '',
        });
      }
    });
  }, [uid, dayKey]);

  const save = useCallback(
    async (updated: DailyEntry) => {
      setSaving(true);
      try {
        await setDoc(
          doc(db, 'users', uid, 'planner', 'daily', dayKey, 'entry'),
          { ...updated, savedAt: serverTimestamp() }
        );
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        // fail silently — user data shouldn't interrupt the practice
      } finally {
        setSaving(false);
      }
    },
    [uid, dayKey]
  );

  const update = (patch: Partial<DailyEntry>) => {
    const next = { ...entry, ...patch };
    setEntry(next);
    save(next);
  };

  const updateStep = (index: number, value: string) => {
    const steps: [string, string, string] = [...entry.steps] as [string, string, string];
    steps[index] = value;
    update({ steps });
  };

  return (
    <div className="space-y-6">
      {/* Date header */}
      <div className="text-center py-6">
        <p
          style={{
            ...headingStyle,
            fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}
        >
          {today.toLocaleDateString('en-US', { weekday: 'long' })}
        </p>
        <p
          style={{
            fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--fg-2, #5B4A3C)',
            marginTop: '0.25rem',
          }}
        >
          {today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Scripture of the day */}
      <div
        className="py-8 px-6 text-center"
        style={{
          background: 'var(--bg-paper, #F6EFE1)',
          borderRadius: '1.5rem',
          border: '1px solid rgba(42,28,21,0.08)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--serif-display, "Cormorant Garamond", "Didot", Georgia, serif)',
            fontStyle: 'italic',
            fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
            lineHeight: 1.55,
            color: 'var(--fg-1, #2A1C15)',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          "{verse.text}"
        </p>
        <p
          style={{
            fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--crimson, #8E1B1B)',
            marginTop: '1.25rem',
          }}
        >
          {verse.ref}
        </p>
      </div>

      {/* Morning Intention */}
      {sectionCard(
        <>
          <label style={labelStyle}>Morning Intention</label>
          <p
            style={{
              fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)',
              fontStyle: 'italic',
              fontSize: '14px',
              color: 'var(--fg-2, #5B4A3C)',
              marginBottom: '1rem',
            }}
          >
            What is God calling me toward today?
          </p>
          <textarea
            style={textareaStyle}
            value={entry.morningIntention}
            onChange={e => update({ morningIntention: e.target.value })}
            placeholder="Write your morning intention..."
            rows={4}
          />
          <p style={{ marginTop: '0.4rem', fontSize: '11px', color: 'var(--fg-3, #9B8E87)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span aria-hidden="true">🎙</span>
            Type or use your phone's microphone to speak.
          </p>
        </>
      )}

      {/* Three Faithful Steps */}
      {sectionCard(
        <>
          <label style={labelStyle}>Three Faithful Steps</label>
          <p
            style={{
              fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)',
              fontStyle: 'italic',
              fontSize: '14px',
              color: 'var(--fg-2, #5B4A3C)',
              marginBottom: '1.25rem',
            }}
          >
            What I am committing to God today:
          </p>
          <div className="space-y-4">
            {([1, 2, 3] as const).map((num, i) => (
              <div key={num} className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-1"
                  style={{
                    background: entry.steps[i] ? 'var(--crimson, #8E1B1B)' : 'rgba(42,28,21,0.08)',
                    fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: entry.steps[i] ? '#fff' : 'var(--fg-2, #5B4A3C)',
                    transition: 'all 0.25s',
                  }}
                >
                  {num}
                </div>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={entry.steps[i]}
                  onChange={e => updateStep(i, e.target.value)}
                  placeholder={`Step ${num}...`}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Evening Reflection */}
      {sectionCard(
        <>
          <label style={labelStyle}>Evening Reflection</label>
          <p
            style={{
              fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)',
              fontStyle: 'italic',
              fontSize: '14px',
              color: 'var(--fg-2, #5B4A3C)',
              marginBottom: '1rem',
            }}
          >
            Where did I see God move today? What would I do differently?
          </p>
          <textarea
            style={textareaStyle}
            value={entry.eveningReflection}
            onChange={e => update({ eveningReflection: e.target.value })}
            placeholder="Evening reflection..."
            rows={4}
          />
        </>
      )}

      {/* Autosave indicator */}
      <div className="text-center py-2">
        <p
          style={{
            fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)',
            fontSize: '11px',
            letterSpacing: '0.05em',
            color: saved ? 'var(--crimson, #8E1B1B)' : 'var(--fg-2, #5B4A3C)',
            opacity: saving || saved ? 1 : 0.4,
            transition: 'all 0.3s',
          }}
        >
          {saving ? 'Saving...' : saved ? 'Saved' : 'Autosaves as you write'}
        </p>
      </div>
    </div>
  );
};

// ─── Weekly View ──────────────────────────────────────────────────────────────

const WeeklyView: React.FC<{ uid: string }> = ({ uid }) => {
  const today = new Date();
  const weekDates = getWeekDates(today);
  const weekKey = getISOWeekKey(today);
  const [selectedDay, setSelectedDay] = useState(today.getDay() === 0 ? 6 : today.getDay() - 1);
  const [entry, setEntry] = useState<WeeklyEntry>({ weeklyIntention: '', scriptureAnchor: '' });
  const [saving, setSaving] = useState(false);
  const [dayHasEntry, setDayHasEntry] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const docRef = doc(db, 'users', uid, 'planner', 'weekly', weekKey, 'entry');
    getDoc(docRef).then(snap => {
      if (snap.exists()) {
        const data = snap.data() as WeeklyEntry;
        setEntry({
          weeklyIntention: data.weeklyIntention ?? '',
          scriptureAnchor: data.scriptureAnchor ?? '',
        });
      }
    });

    // Check which days have entries
    weekDates.forEach(date => {
      const key = formatDateKey(date);
      getDoc(doc(db, 'users', uid, 'planner', 'daily', key, 'entry')).then(snap => {
        if (snap.exists()) {
          setDayHasEntry(prev => ({ ...prev, [key]: true }));
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, weekKey]);

  const save = useCallback(
    async (updated: WeeklyEntry) => {
      setSaving(true);
      try {
        await setDoc(
          doc(db, 'users', uid, 'planner', 'weekly', weekKey, 'entry'),
          { ...updated, savedAt: serverTimestamp() }
        );
      } catch {
        // fail silently
      } finally {
        setSaving(false);
      }
    },
    [uid, weekKey]
  );

  const update = (patch: Partial<WeeklyEntry>) => {
    const next = { ...entry, ...patch };
    setEntry(next);
    save(next);
  };

  const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6">
      {/* Week header */}
      <div className="text-center pt-4">
        <p style={{ ...headingStyle, fontSize: '1.75rem' }}>
          {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {' – '}
          {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {weekDates.map((date, i) => {
          const key = formatDateKey(date);
          const hasEntry = dayHasEntry[key];
          const isToday = key === formatDateKey(today);
          const isSelected = i === selectedDay;
          return (
            <button
              key={key}
              onClick={() => setSelectedDay(i)}
              className="flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl transition-all"
              style={{
                background: isSelected
                  ? 'var(--crimson, #8E1B1B)'
                  : 'var(--bg-card, #FBF6EA)',
                border: `1px solid ${isSelected ? 'var(--crimson, #8E1B1B)' : 'rgba(42,28,21,0.1)'}`,
                minWidth: '56px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: isSelected ? '#fff' : 'var(--fg-2, #5B4A3C)',
                }}
              >
                {DAYS_SHORT[i]}
              </span>
              <span
                style={{
                  fontFamily: 'var(--serif-display, "Cormorant Garamond", "Didot", Georgia, serif)',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: isSelected ? '#fff' : isToday ? 'var(--crimson, #8E1B1B)' : 'var(--fg-1, #2A1C15)',
                }}
              >
                {date.getDate()}
              </span>
              <div
                className="w-1.5 h-1.5 rounded-full mt-1"
                style={{
                  background: hasEntry
                    ? isSelected ? '#fff' : '#22c55e'
                    : 'rgba(42,28,21,0.15)',
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Selected day summary */}
      <div
        className="p-5 rounded-2xl text-center"
        style={{ background: 'var(--bg-paper, #F6EFE1)', border: '1px solid rgba(42,28,21,0.08)' }}
      >
        <p
          style={{
            fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--crimson, #8E1B1B)',
            marginBottom: '0.5rem',
          }}
        >
          {weekDates[selectedDay]?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <p
          style={{
            fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)',
            fontStyle: 'italic',
            fontSize: '15px',
            color: 'var(--fg-2, #5B4A3C)',
          }}
        >
          {dayHasEntry[formatDateKey(weekDates[selectedDay])]
            ? 'This day has planner entries. View them in the Daily tab.'
            : 'No entries yet for this day. Start in the Daily tab.'}
        </p>
      </div>

      {/* Weekly intention */}
      {sectionCard(
        <>
          <label style={labelStyle}>Weekly Intention</label>
          <p
            style={{
              fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)',
              fontStyle: 'italic',
              fontSize: '14px',
              color: 'var(--fg-2, #5B4A3C)',
              marginBottom: '1rem',
            }}
          >
            What does faithfulness look like this week?
          </p>
          <textarea
            style={textareaStyle}
            value={entry.weeklyIntention}
            onChange={e => update({ weeklyIntention: e.target.value })}
            placeholder="This week, faithfulness looks like..."
            rows={3}
          />
        </>
      )}

      {/* Scripture anchor */}
      {sectionCard(
        <>
          <label style={labelStyle}>Scripture Anchor for the Week</label>
          <p
            style={{
              fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)',
              fontStyle: 'italic',
              fontSize: '14px',
              color: 'var(--fg-2, #5B4A3C)',
              marginBottom: '1rem',
            }}
          >
            One verse to return to all week:
          </p>
          <input
            style={inputStyle}
            value={entry.scriptureAnchor}
            onChange={e => update({ scriptureAnchor: e.target.value })}
            placeholder="e.g. Isaiah 41:10 — Fear not, for I am with you..."
          />
        </>
      )}

      {saving && (
        <p
          className="text-center"
          style={{
            fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)',
            fontSize: '11px',
            color: 'var(--fg-2, #5B4A3C)',
            opacity: 0.5,
          }}
        >
          Saving...
        </p>
      )}
    </div>
  );
};

// ─── Monthly View ─────────────────────────────────────────────────────────────

const MonthlyView: React.FC<{ uid: string }> = ({ uid }) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthKey = getMonthKey(today);
  const calendarDays = getCalendarDays(year, month);

  const [entry, setEntry] = useState<MonthlyEntry>({
    monthlyGoal: '',
    watchDates: [],
  });
  const [dayStatus, setDayStatus] = useState<Record<string, 'complete' | 'partial' | 'empty'>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const docRef = doc(db, 'users', uid, 'planner', 'monthly', monthKey, 'entry');
    getDoc(docRef).then(snap => {
      if (snap.exists()) {
        const data = snap.data() as MonthlyEntry;
        setEntry({
          monthlyGoal: data.monthlyGoal ?? '',
          watchDates: data.watchDates ?? [],
        });
      }
    });

    // Check day statuses for the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const key = formatDateKey(date);
      getDoc(doc(db, 'users', uid, 'planner', 'daily', key, 'entry')).then(snap => {
        if (snap.exists()) {
          const data = snap.data() as DailyEntry;
          const hasAll = data.morningIntention && data.eveningReflection && data.steps?.every(s => s);
          setDayStatus(prev => ({
            ...prev,
            [key]: hasAll ? 'complete' : 'partial',
          }));
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, monthKey, year, month]);

  const save = useCallback(
    async (updated: MonthlyEntry) => {
      setSaving(true);
      try {
        await setDoc(
          doc(db, 'users', uid, 'planner', 'monthly', monthKey, 'entry'),
          { ...updated, savedAt: serverTimestamp() }
        );
      } catch {
        // fail silently
      } finally {
        setSaving(false);
      }
    },
    [uid, monthKey]
  );

  const update = (patch: Partial<MonthlyEntry>) => {
    const next = { ...entry, ...patch };
    setEntry(next);
    save(next);
  };

  const updateWatchDate = (index: number, field: keyof WatchDate, value: string) => {
    const watchDates = entry.watchDates.map((wd, i) =>
      i === index ? { ...wd, [field]: value } : wd
    );
    update({ watchDates });
  };

  const addWatchDate = () => {
    if (entry.watchDates.length >= 5) return;
    update({ watchDates: [...entry.watchDates, { date: '', label: '' }] });
  };

  const removeWatchDate = (index: number) => {
    update({ watchDates: entry.watchDates.filter((_, i) => i !== index) });
  };

  const dotColor = (status: 'complete' | 'partial' | 'empty' | undefined): string => {
    if (status === 'complete') return '#22c55e';
    if (status === 'partial') return '#f59e0b';
    return 'rgba(42,28,21,0.12)';
  };

  return (
    <div className="space-y-6">
      {/* Month header */}
      <div className="text-center pt-4">
        <p style={{ ...headingStyle, fontSize: '2rem' }}>
          {MONTHS[month]} {year}
        </p>
      </div>

      {/* Calendar grid */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(42,28,21,0.08)', background: 'var(--bg-card, #FBF6EA)' }}
      >
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-brand-border">
          {WEEKDAYS.map(d => (
            <div
              key={d}
              className="py-2 text-center"
              style={{
                fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--fg-2, #5B4A3C)',
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, i) => {
            if (!date) {
              return <div key={`empty-${i}`} className="p-2 border-b border-r border-brand-border/40 min-h-[48px]" />;
            }
            const key = formatDateKey(date);
            const status = dayStatus[key];
            const isToday = key === formatDateKey(today);
            return (
              <div
                key={key}
                className="p-2 border-b border-r border-brand-border/40 min-h-[48px] flex flex-col items-center"
              >
                <span
                  style={{
                    fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)',
                    fontSize: '12px',
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? 'var(--crimson, #8E1B1B)' : 'var(--fg-1, #2A1C15)',
                  }}
                >
                  {date.getDate()}
                </span>
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1"
                  style={{ background: dotColor(status) }}
                />
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 py-3 border-t border-brand-border/40">
          {[
            { color: '#22c55e', label: 'Complete' },
            { color: '#f59e0b', label: 'Partial' },
            { color: 'rgba(42,28,21,0.12)', label: 'Empty' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span
                style={{
                  fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)',
                  fontSize: '10px',
                  color: 'var(--fg-2, #5B4A3C)',
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly goal */}
      {sectionCard(
        <>
          <label style={labelStyle}>Monthly Focus</label>
          <p
            style={{
              fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)',
              fontStyle: 'italic',
              fontSize: '14px',
              color: 'var(--fg-2, #5B4A3C)',
              marginBottom: '1rem',
            }}
          >
            My one focus this month, surrendered to God:
          </p>
          <textarea
            style={textareaStyle}
            value={entry.monthlyGoal}
            onChange={e => update({ monthlyGoal: e.target.value })}
            placeholder="This month I am trusting God with..."
            rows={3}
          />
        </>
      )}

      {/* Watch dates */}
      {sectionCard(
        <>
          <div className="flex items-center justify-between mb-4">
            <label style={{ ...labelStyle, marginBottom: 0 }}>Key Watch Dates</label>
            {entry.watchDates.length < 5 && (
              <button
                onClick={addWatchDate}
                className="text-xs font-bold text-brand-accent hover:underline"
                style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)' }}
              >
                + Add date
              </button>
            )}
          </div>
          {entry.watchDates.length === 0 && (
            <p
              style={{
                fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)',
                fontStyle: 'italic',
                fontSize: '14px',
                color: 'var(--fg-2, #5B4A3C)',
                opacity: 0.7,
              }}
            >
              Mark up to 5 important dates for this month.
            </p>
          )}
          <div className="space-y-3">
            {entry.watchDates.map((wd, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="date"
                  value={wd.date}
                  onChange={e => updateWatchDate(i, 'date', e.target.value)}
                  style={{
                    ...inputStyle,
                    width: '140px',
                    flexShrink: 0,
                    fontSize: '13px',
                  }}
                />
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={wd.label}
                  onChange={e => updateWatchDate(i, 'label', e.target.value)}
                  placeholder="Event or intention..."
                />
                <button
                  onClick={() => removeWatchDate(i)}
                  className="flex-shrink-0 text-brand-text-secondary hover:text-brand-accent transition-colors text-lg leading-none"
                  aria-label="Remove watch date"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {saving && (
        <p
          className="text-center"
          style={{
            fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)',
            fontSize: '11px',
            color: 'var(--fg-2, #5B4A3C)',
            opacity: 0.5,
          }}
        >
          Saving...
        </p>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'daily' | 'weekly' | 'monthly';

const TABS: { id: Tab; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

const PlannerPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('daily');

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <p
          style={{
            fontFamily: 'var(--serif-display, "Cormorant Garamond", "Didot", Georgia, serif)',
            fontSize: '1.5rem',
            color: 'var(--fg-1, #2A1C15)',
            marginBottom: '1rem',
          }}
        >
          Sign in to access your planner.
        </p>
        <p
          style={{
            fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)',
            fontSize: '16px',
            color: 'var(--fg-2, #5B4A3C)',
          }}
        >
          Your daily intentions and reflections are private to you.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Page header */}
      <div className="mb-8 text-center">
        <p
          style={{
            fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--crimson, #8E1B1B)',
            marginBottom: '0.5rem',
          }}
        >
          Prayerful Intention
        </p>
        <h1
          style={{
            fontFamily: 'var(--serif-display, "Cormorant Garamond", "Didot", Georgia, serif)',
            fontWeight: 600,
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            lineHeight: 1.15,
            color: 'var(--fg-1, #2A1C15)',
            letterSpacing: '-0.01em',
          }}
        >
          Daily Planner
        </h1>
        <p
          style={{
            fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)',
            fontStyle: 'italic',
            fontSize: '15px',
            color: 'var(--fg-2, #5B4A3C)',
            maxWidth: '400px',
            margin: '0.75rem auto 0',
            lineHeight: 1.6,
          }}
        >
          "In all your ways submit to him, and he will make your paths straight."
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)',
              fontStyle: 'normal',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--crimson, #8E1B1B)',
              marginTop: '0.5rem',
            }}
          >
            Proverbs 3:6
          </span>
        </p>
      </div>

      {/* Tab bar — thin underline style */}
      <div className="flex border-b border-brand-border mb-8 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative px-6 py-3 flex-shrink-0 transition-colors"
            style={{
              fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: activeTab === tab.id ? 'var(--crimson, #8E1B1B)' : 'var(--fg-2, #5B4A3C)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-accent"
                layoutId="planner-tab-indicator"
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {activeTab === 'daily' && <DailyView uid={user.uid} />}
        {activeTab === 'weekly' && <WeeklyView uid={user.uid} />}
        {activeTab === 'monthly' && <MonthlyView uid={user.uid} />}
      </motion.div>
    </div>
  );
};

export default PlannerPage;
