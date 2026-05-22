import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, Calendar, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import Card from '../components/Card';
import { listReadingPlans, getReadingPlan } from '../services/booksService';
import type { ReadingPlan, ReadingPlanItem } from '../types';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } } };

const ReadingPlansPage: React.FC = () => {
  const { planId } = useParams<{ planId?: string }>();
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [activePlan, setActivePlan] = useState<ReadingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());

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

      {loading && (
        <div className="py-24 text-center text-brand-text-secondary animate-pulse">
          Loading plans…
        </div>
      )}

      {!loading && plans.length === 0 && (
        <div className="py-16 text-center">
          <Calendar className="w-12 h-12 text-brand-text-secondary mx-auto mb-3 opacity-40" />
          <p className="text-brand-text-secondary">
            No reading plans published yet — check back soon.
          </p>
        </div>
      )}

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
    </div>
  );
};

export default ReadingPlansPage;
