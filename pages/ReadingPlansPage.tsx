import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, Calendar, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Card from '../components/Card';
import { listReadingPlans, getReadingPlan } from '../services/booksService';
import type { ReadingPlan, ReadingPlanItem } from '../types';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } } };

// ─── Preset plans ────────────────────────────────────────────────────────────

interface PresetPassage {
  day: number;
  ref: string;
  title: string;
}

interface PresetPlan {
  id: string;
  title: string;
  description: string;
  duration: number;
  scripture: string;
  passages: PresetPassage[];
}

const PRESET_PLANS: PresetPlan[] = [
  {
    id: 'psalm-23-deep-dive',
    title: "Psalm 23 — Seven Days in the Shepherd's Field",
    description: 'A week with the most beloved psalm in Scripture. One verse per day, read slowly.',
    duration: 7,
    scripture: 'Psalm 23',
    passages: [
      { day: 1, ref: 'Psalm 23:1', title: 'The Lord Is My Shepherd' },
      { day: 2, ref: 'Psalm 23:2', title: 'Green Pastures, Still Waters' },
      { day: 3, ref: 'Psalm 23:3', title: 'He Restores My Soul' },
      { day: 4, ref: 'Psalm 23:4', title: 'The Valley of the Shadow' },
      { day: 5, ref: 'Psalm 23:5', title: 'You Prepare a Table' },
      { day: 6, ref: 'Psalm 23:6', title: 'Goodness and Mercy' },
      { day: 7, ref: 'Psalm 23:1-6', title: 'Reading It Whole' },
    ],
  },
  {
    id: 'proverbs-wisdom',
    title: 'Proverbs — 14 Days of Wisdom',
    description: 'Two weeks through Proverbs. Wisdom literature for daily decisions.',
    duration: 14,
    scripture: 'Proverbs 1–14',
    passages: [
      { day: 1, ref: 'Proverbs 1:1-7', title: 'The Beginning of Wisdom' },
      { day: 2, ref: 'Proverbs 3:1-12', title: 'Trust in the Lord' },
      { day: 3, ref: 'Proverbs 4:1-9', title: 'Get Wisdom' },
      { day: 4, ref: 'Proverbs 6:6-11', title: 'Consider the Ant' },
      { day: 5, ref: 'Proverbs 8:1-11', title: 'Wisdom Calls' },
      { day: 6, ref: 'Proverbs 9:1-6', title: "Wisdom's Feast" },
      { day: 7, ref: 'Proverbs 10:1-10', title: 'Wise and Foolish' },
      { day: 8, ref: 'Proverbs 11:1-8', title: 'Honest Scales' },
      { day: 9, ref: 'Proverbs 12:1-10', title: 'Accepting Discipline' },
      { day: 10, ref: 'Proverbs 13:1-10', title: 'The Way of the Wise' },
      { day: 11, ref: 'Proverbs 14:1-12', title: 'Every Way Seems Right' },
      { day: 12, ref: 'Proverbs 15:1-4', title: 'A Soft Answer' },
      { day: 13, ref: 'Proverbs 16:1-9', title: 'Plans of the Heart' },
      { day: 14, ref: 'Proverbs 31:10-31', title: 'A Wife of Noble Character (wisdom embodied)' },
    ],
  },
  {
    id: 'gospel-mark',
    title: 'Gospel of Mark — 21 Days',
    description: 'The fastest-moving Gospel. Walk with Jesus through action and authority.',
    duration: 21,
    scripture: 'Mark 1–16',
    passages: [
      { day: 1, ref: 'Mark 1:1-13', title: 'The Beginning of the Gospel' },
      { day: 2, ref: 'Mark 1:14-28', title: 'The Kingdom Is Near' },
      { day: 3, ref: 'Mark 2:1-12', title: 'The Healing of the Paralytic' },
      { day: 4, ref: 'Mark 3:1-19', title: 'The Twelve' },
      { day: 5, ref: 'Mark 4:1-20', title: 'The Parable of the Sower' },
      { day: 6, ref: 'Mark 5:1-20', title: 'The Man with the Legion' },
      { day: 7, ref: 'Mark 6:30-44', title: 'Feeding the Five Thousand' },
      { day: 8, ref: 'Mark 7:1-23', title: 'Clean and Unclean' },
      { day: 9, ref: 'Mark 8:27-38', title: 'Who Do You Say I Am?' },
      { day: 10, ref: 'Mark 9:2-13', title: 'The Transfiguration' },
      { day: 11, ref: 'Mark 10:17-31', title: 'The Rich Young Man' },
      { day: 12, ref: 'Mark 10:32-45', title: 'Servant of All' },
      { day: 13, ref: 'Mark 11:1-11', title: 'The Triumphal Entry' },
      { day: 14, ref: 'Mark 12:28-34', title: 'The Greatest Command' },
      { day: 15, ref: 'Mark 13:1-13', title: 'Signs of the End' },
      { day: 16, ref: 'Mark 14:1-11', title: 'The Anointing' },
      { day: 17, ref: 'Mark 14:32-42', title: 'Gethsemane' },
      { day: 18, ref: 'Mark 14:53-72', title: 'The Trial' },
      { day: 19, ref: 'Mark 15:1-20', title: 'Pilate and the Cross' },
      { day: 20, ref: 'Mark 15:21-47', title: 'The Crucifixion' },
      { day: 21, ref: 'Mark 16:1-8', title: 'The Empty Tomb' },
    ],
  },
];

// ─── Preset plan card ─────────────────────────────────────────────────────────

interface PresetPlanCardProps {
  plan: PresetPlan;
  onBegin: (plan: PresetPlan) => void;
  enrolled: boolean;
}

const PresetPlanCard: React.FC<PresetPlanCardProps> = ({ plan, onBegin, enrolled }) => (
  <motion.div variants={fadeUp} transition={{ duration: 0.4, ease: EASE }}>
    <Card
      className="p-5 border-l-4 hover:shadow-md transition-all"
      style={{ borderLeftColor: 'var(--ember, #C23B1E)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="text-xs font-bold uppercase text-brand-text-secondary"
              style={{ fontFamily: 'var(--sans-ui)' }}
            >
              Scripture
            </span>
            <span className="text-xs text-brand-text-secondary">·</span>
            <span className="text-xs text-brand-text-secondary">{plan.duration} days</span>
            <span className="text-xs px-1.5 py-0.5 rounded border border-brand-border text-brand-text-secondary">
              Free
            </span>
          </div>
          <h3
            className="font-bold text-brand-text-primary mb-1"
            style={{ fontFamily: 'var(--serif-display)' }}
          >
            {plan.title}
          </h3>
          <p className="text-xs text-brand-text-secondary mb-1">{plan.scripture}</p>
          <p className="text-xs text-brand-text-secondary line-clamp-2">{plan.description}</p>
        </div>
        <button
          onClick={() => onBegin(plan)}
          disabled={enrolled}
          className={`flex-shrink-0 text-sm font-bold px-4 py-2 rounded-full transition-colors ${
            enrolled
              ? 'bg-brand-secondary text-brand-text-secondary border border-brand-border cursor-default'
              : 'bg-brand-accent text-white hover:opacity-90'
          }`}
        >
          {enrolled ? 'Enrolled ✓' : 'Begin Plan'}
        </button>
      </div>
    </Card>
  </motion.div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const ReadingPlansPage: React.FC = () => {
  const { planId } = useParams<{ planId?: string }>();
  const { user } = useAuth();
  const { notify } = useNotifications();

  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [activePlan, setActivePlan] = useState<ReadingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());
  const [enrolledPlanIds, setEnrolledPlanIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    setCompletedDays(new Set());
    if (planId) {
      getReadingPlan(planId).then(setActivePlan).finally(() => setLoading(false));
    } else {
      listReadingPlans(true).then(setPlans).finally(() => setLoading(false));
    }
  }, [planId]);

  const toggleDay = (day: number) => {
    setCompletedDays(prev => {
      const next = new Set(prev);
      next.has(day) ? next.delete(day) : next.add(day);
      return next;
    });
  };

  const handleBeginPresetPlan = async (plan: PresetPlan) => {
    if (!user) {
      notify('Sign in to track your reading plan progress.', 'info');
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'reading_plans', plan.id), {
        planId: plan.id,
        title: plan.title,
        startedAt: serverTimestamp(),
        currentDay: 1,
        completed: false,
      });
      setEnrolledPlanIds(prev => new Set(prev).add(plan.id));
      notify(`You've started "${plan.title}". Day 1 is ready.`, 'success');
    } catch {
      notify('Could not save your plan. Please try again.', 'error');
    }
  };

  // Plan detail view
  if (planId && activePlan) {
    const progress = activePlan.totalDays > 0
      ? Math.round((completedDays.size / activePlan.totalDays) * 100)
      : 0;

    return (
      <div className="max-w-2xl mx-auto pb-20 px-4">
        <div className="mb-6">
          <Link
            to="/app/reading-plans"
            className="flex items-center gap-1.5 text-sm text-brand-text-secondary hover:text-brand-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Reading Plans
          </Link>
        </div>

        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <p
            className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{ fontFamily: 'var(--sans-ui)', color: 'var(--ember, #C23B1E)' }}
          >
            {activePlan.category}
          </p>
          <h1
            className="text-3xl font-black text-brand-text-primary mb-2"
            style={{ fontFamily: 'var(--serif-display)' }}
          >
            {activePlan.title}
          </h1>
          <p className="text-brand-text-secondary text-sm mb-4">{activePlan.description}</p>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-brand-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: 'var(--ember, #C23B1E)' }}
              />
            </div>
            <span className="text-xs font-bold text-brand-text-secondary">{progress}%</span>
          </div>
        </motion.div>

        {/* Days list */}
        <motion.div className="space-y-3" variants={stagger} initial="hidden" animate="visible">
          {activePlan.items.map((item: ReadingPlanItem) => (
            <motion.div key={item.day} variants={fadeUp} transition={{ duration: 0.35, ease: EASE }}>
              <Card
                className={`p-4 flex items-start gap-4 cursor-pointer transition-all ${
                  completedDays.has(item.day) ? 'opacity-70' : ''
                }`}
                onClick={() => toggleDay(item.day)}
              >
                <button className="flex-shrink-0 mt-0.5" onClick={e => { e.stopPropagation(); toggleDay(item.day); }}>
                  {completedDays.has(item.day) ? (
                    <CheckCircle className="w-5 h-5" style={{ color: 'var(--ember, #C23B1E)' }} />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-brand-border" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-xs font-bold uppercase text-brand-text-secondary"
                      style={{ fontFamily: 'var(--sans-ui)' }}
                    >
                      Day {item.day}
                    </span>
                    {item.durationMinutes && (
                      <span className="flex items-center gap-1 text-xs text-brand-text-secondary">
                        <Clock className="w-3 h-3" /> {item.durationMinutes} min
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-brand-text-primary text-sm">{item.title}</h3>
                  {item.chapters && (
                    <p className="text-xs text-brand-text-secondary mt-0.5">{item.chapters}</p>
                  )}
                  {item.description && (
                    <p className="text-xs text-brand-text-secondary mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>

                {item.bookId && (
                  <Link
                    to={`/app/book/${item.bookId}`}
                    onClick={e => e.stopPropagation()}
                    className="flex-shrink-0 text-xs text-brand-accent hover:underline flex items-center gap-1"
                  >
                    Open <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  // Loading state for detail view
  if (planId && loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-pulse text-brand-text-secondary">Loading plan…</div>
      </div>
    );
  }

  // Plan not found
  if (planId && !loading && !activePlan) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-brand-text-secondary">Reading plan not found.</p>
        <Link to="/app/reading-plans" className="mt-4 inline-block text-brand-accent hover:underline">
          Back to Plans
        </Link>
      </div>
    );
  }

  // Plans list
  return (
    <div className="max-w-3xl mx-auto pb-20 px-4">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <p
          className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{ fontFamily: 'var(--sans-ui)', color: 'var(--ember, #C23B1E)' }}
        >
          Read
        </p>
        <h1
          className="text-4xl font-black text-brand-text-primary mb-2"
          style={{ fontFamily: 'var(--serif-display)' }}
        >
          Reading Plans
        </h1>
        <p className="text-brand-text-secondary">
          Structured journeys through books, topics, and Scripture.
        </p>
      </motion.div>

      {/* Preset plans — always shown at the top */}
      <motion.div className="space-y-4 mb-8" variants={stagger} initial="hidden" animate="visible">
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.3, ease: EASE }}
          className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary"
        >
          Start Here
        </motion.p>
        {PRESET_PLANS.map(plan => (
          <PresetPlanCard
            key={plan.id}
            plan={plan}
            onBegin={handleBeginPresetPlan}
            enrolled={enrolledPlanIds.has(plan.id)}
          />
        ))}
      </motion.div>

      {/* Firestore plans below */}
      {loading && (
        <div className="py-12 text-center text-brand-text-secondary animate-pulse">
          Loading more plans…
        </div>
      )}

      {!loading && plans.length > 0 && (
        <>
          <motion.p
            className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            More Plans
          </motion.p>
          <motion.div className="space-y-4" variants={stagger} initial="hidden" animate="visible">
            {plans.map(plan => (
              <motion.div key={plan.id} variants={fadeUp} transition={{ duration: 0.4, ease: EASE }}>
                <Link to={`/app/reading-plans/${plan.id}`}>
                  <Card
                    className="group p-5 flex gap-4 border-l-4 hover:shadow-md transition-all"
                    style={{ borderLeftColor: 'var(--ember, #C23B1E)' }}
                  >
                    {plan.coverUrl && (
                      <img
                        src={plan.coverUrl}
                        alt={plan.title}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-bold uppercase text-brand-text-secondary"
                          style={{ fontFamily: 'var(--sans-ui)' }}
                        >
                          {plan.category}
                        </span>
                        <span className="text-xs text-brand-text-secondary">·</span>
                        <span className="text-xs text-brand-text-secondary">{plan.totalDays} days</span>
                        {plan.isFree && (
                          <span className="text-xs px-1.5 py-0.5 rounded border border-brand-border text-brand-text-secondary">
                            Free
                          </span>
                        )}
                      </div>
                      <h3
                        className="font-bold text-brand-text-primary"
                        style={{ fontFamily: 'var(--serif-display)' }}
                      >
                        {plan.title}
                      </h3>
                      <p className="text-xs text-brand-text-secondary mt-1 line-clamp-2">
                        {plan.description}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-brand-text-secondary flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default ReadingPlansPage;
