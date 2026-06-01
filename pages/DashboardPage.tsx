import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Flame,
  BookOpen,
  NotebookPen,
  Headphones,
  GraduationCap,
  Users,
  CalendarDays,
  Library,
  Star,
  Newspaper,
  ArrowRight,
  Target,
} from 'lucide-react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRAYER_PROMPTS: string[] = [
  'Be still in a world that celebrates hustle. Seek counsel in a culture that worships independence.',
  'Prayer is not preparation for the battle. Prayer is the battle.',
  'God meets you where your faith and your daily life feel most sharply divided.',
  'Relationship creates recognition. Draw near to God and He will draw near to you.',
  'You have nothing left to prove. God already knows the gap. He meets you in the gap, not after it closes.',
  'Faithfulness matters more than flash. Your knees hitting the floor matters more than your eloquence.',
  "God's voice is not a reward for perfect behaviour. It is a promise to His children.",
];

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.52, ease: EASE } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Devotional {
  id: string;
  title: string;
  body: string;
  publishedAt: { seconds: number } | null;
}

interface PodcastEpisode {
  id: string;
  title: string;
  duration?: string;
  publishedAt: { seconds: number } | null;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`rounded-lg bg-brand-border/50 animate-pulse ${className}`}
  />
);

// ─── Featured Devotional Card ─────────────────────────────────────────────────

interface DevotionalCardProps {
  devotional: Devotional | null;
  loading: boolean;
  dateLabel: string;
}

const DevotionalCard: React.FC<DevotionalCardProps> = ({ devotional, loading, dateLabel }) => {
  const excerpt = devotional?.body
    ? devotional.body.replace(/\n+/g, ' ').trim().slice(0, 160) + '…'
    : null;

  return (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: 'var(--bg-deep)',
        boxShadow: '0 2px 6px rgba(0,0,0,.12), 0 20px 60px rgba(0,0,0,.18)',
      }}
    >
      {loading ? (
        <div className="p-8 md:p-12 flex flex-col gap-4">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-9 w-36 mt-2" />
        </div>
      ) : (
        <div className="p-8 md:p-12">
          {/* Eyebrow */}
          <p
            style={{
              fontFamily: 'var(--sans-ui)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--ember)',
            }}
            className="mb-4"
          >
            Today&apos;s Devotional &middot; {dateLabel}
          </p>

          {/* Title */}
          <h2
            style={{
              fontFamily: 'var(--serif-display)',
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
              fontWeight: 600,
              lineHeight: 1.1,
              color: 'var(--bg-paper)',
            }}
            className="mb-4"
          >
            {devotional?.title ?? 'Your next devotional is being prepared.'}
          </h2>

          {/* Excerpt */}
          {excerpt ? (
            <p
              style={{
                fontFamily: 'var(--serif-body)',
                fontSize: '1.0625rem',
                lineHeight: 1.7,
                color: 'var(--fg-3)',
              }}
              className="mb-8 max-w-2xl"
            >
              {excerpt}
            </p>
          ) : (
            <p
              style={{
                fontFamily: 'var(--serif-body)',
                fontSize: '1.0625rem',
                lineHeight: 1.7,
                color: 'var(--fg-3)',
              }}
              className="mb-8"
            >
              Begin with the Guided Journey. A path is already waiting for you.
            </p>
          )}

          {/* CTA */}
          <Link
            to="/app/guided-journey"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:gap-3"
            style={{
              fontFamily: 'var(--sans-ui)',
              background: 'var(--ember)',
              color: '#fff',
            }}
          >
            Open Daily Journey
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
};

// ─── Continue Strip Cards ─────────────────────────────────────────────────────

const CONTINUE_CARDS = [
  {
    icon: Target,
    title: 'Planner',
    desc: 'Set your intention for today',
    route: '/app/planner',
  },
  {
    icon: BookOpen,
    title: 'Bible',
    desc: 'Continue reading',
    route: '/app/bible',
  },
  {
    icon: NotebookPen,
    title: 'Journaling',
    desc: 'Write a reflection',
    route: '/app/journaling',
  },
] as const;

// ─── Quick Links ──────────────────────────────────────────────────────────────

const QUICK_LINKS = [
  { label: 'Courses', route: '/app/courses', icon: GraduationCap },
  { label: 'Community', route: '/app/community-rooms', icon: Users },
  { label: 'Events', route: '/app/events', icon: CalendarDays },
  { label: 'Books', route: '/app/books', icon: Library },
  { label: 'Testimonies', route: '/app/testimonies', icon: Star },
  { label: 'Newsletter', route: '/app/newsletters', icon: Newspaper },
] as const;

// ─── Main Component ───────────────────────────────────────────────────────────

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // ── Time-aware greeting ──────────────────────────────────────────────────
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.displayName?.split(' ')[0] ?? 'Friend';

  // ── Date labels ──────────────────────────────────────────────────────────
  const dayLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const shortDateLabel = now.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // ── Prayer prompt — one per day of week ─────────────────────────────────
  const prayerPrompt = PRAYER_PROMPTS[now.getDay()];

  // ── Firestore data ───────────────────────────────────────────────────────
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [devotionalLoading, setDevotionalLoading] = useState(true);

  const [streak, setStreak] = useState(0);

  const [podcast, setPodcast] = useState<PodcastEpisode | null>(null);
  const [podcastLoading, setPodcastLoading] = useState(true);

  useEffect(() => {
    // Fetch latest devotional
    const fetchDevotional = async () => {
      try {
        // Match the guided journey: latest PUBLISHED devotional dated on/before today.
        // (Devotionals store a `date` string, not `publishedAt` — ordering by the missing
        // field was returning nothing.) Filter in JS to avoid a composite index.
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const snap = await getDocs(query(collection(db, 'devotionals'), orderBy('date', 'desc'), limit(30)));
        const match = snap.docs
          .map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }))
          .find((d) => d.data.status === 'published' && typeof d.data.date === 'string' && (d.data.date as string) <= todayStr);
        if (match) {
          setDevotional({
            id: match.id,
            title: String(match.data.title ?? ''),
            body: String(match.data.body ?? match.data.content ?? ''),
            publishedAt: null,
          });
        }
      } catch {
        // Firestore unavailable — show placeholder
      } finally {
        setDevotionalLoading(false);
      }
    };

    // Fetch streak
    const fetchStreak = async () => {
      if (!user?.uid) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setStreak(typeof data?.currentStreak === 'number' ? data.currentStreak : 0);
        }
      } catch {
        // Default 0 — safe fallback
      }
    };

    // Fetch latest podcast episode
    // Podcasts: the Anchor.fm RSS feed is the source of truth (same as the public library).
    const fetchPodcast = async () => {
      try {
        const { fetchRSSFeed } = await import('../services/rssService');
        const feed = await fetchRSSFeed('https://anchor.fm/s/f7311ecc/podcast/rss');
        const item = feed.items.find((i) => i.enclosure?.type?.startsWith('audio')) ?? feed.items[0];
        if (item) {
          setPodcast({
            id: item.guid || '0',
            title: item.title || 'Latest Episode',
            duration: item.itunes?.duration,
            publishedAt: item.pubDate ? { seconds: Math.floor(new Date(item.pubDate).getTime() / 1000) } : null,
          });
        }
      } catch {
        // Show placeholder
      } finally {
        setPodcastLoading(false);
      }
    };

    fetchDevotional();
    fetchStreak();
    fetchPodcast();
  }, [user?.uid]);

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto pb-24 px-0">

      {/* ── 1. Greeting Header ─────────────────────────────────────────────── */}
      <motion.section
        className="mb-12 pt-2"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        {/* Prayer prompt — pull quote eyebrow */}
        <p
          style={{
            fontFamily: 'var(--serif-body)',
            fontStyle: 'italic',
            fontSize: '0.9375rem',
            lineHeight: 1.6,
            color: 'var(--fg-3)',
          }}
          className="mb-4 max-w-xl"
        >
          &ldquo;{prayerPrompt}&rdquo;
        </p>

        {/* Main greeting */}
        <h1
          style={{
            fontFamily: 'var(--serif-display)',
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            fontWeight: 600,
            lineHeight: 1.05,
            color: 'var(--fg-1)',
          }}
          className="mb-2"
        >
          {greeting}, {firstName}.
        </h1>

        {/* Date */}
        <p
          style={{
            fontFamily: 'var(--sans-ui)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            letterSpacing: '0.04em',
            color: 'var(--fg-3)',
          }}
        >
          {dayLabel}
        </p>
      </motion.section>

      {/* ── 2. Today's Featured Devotional ────────────────────────────────── */}
      <motion.section
        className="mb-12"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE, delay: 0.08 }}
      >
        <DevotionalCard
          devotional={devotional}
          loading={devotionalLoading}
          dateLabel={shortDateLabel}
        />
      </motion.section>

      {/* ── 3. Continue Where You Left Off ────────────────────────────────── */}
      <motion.section
        className="mb-12"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.18 }}
      >
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
          Continue
        </p>

        {/* Horizontal scroll strip */}
        <div
          className="flex gap-3 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {CONTINUE_CARDS.map((card) => (
            <motion.div
              key={card.route}
              whileHover={{ y: -3, scale: 1.02 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="flex-shrink-0"
            >
              <Link
                to={card.route}
                className="flex flex-col gap-3 p-5 rounded-xl border border-brand-border transition-colors duration-200 w-48 group"
                style={{
                  background: 'var(--bg-card)',
                  boxShadow: 'var(--sh-card)',
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-200 group-hover:bg-ember/15"
                  style={{ background: 'rgba(var(--cta-raw), 0.10)' }}
                >
                  <card.icon
                    className="w-4 h-4 transition-colors duration-200"
                    style={{ color: 'var(--ember)' }}
                  />
                </div>
                <div>
                  <p
                    className="font-semibold text-brand-text-primary text-sm mb-0.5"
                    style={{ fontFamily: 'var(--sans-ui)' }}
                  >
                    {card.title}
                  </p>
                  <p
                    className="text-xs leading-snug"
                    style={{ fontFamily: 'var(--sans-ui)', color: 'var(--fg-3)' }}
                  >
                    {card.desc}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── 4. Community & Momentum ───────────────────────────────────────── */}
      <motion.section
        className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-5"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        {/* Streak counter */}
        <motion.div variants={fadeUp}>
          <div
            className="h-full rounded-2xl border border-brand-border p-6 flex flex-col justify-between"
            style={{ background: 'rgb(var(--surface-raw))' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p
                  style={{
                    fontFamily: 'var(--sans-ui)',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--fg-3)',
                  }}
                  className="mb-1"
                >
                  Streak
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    style={{
                      fontFamily: 'var(--serif-display)',
                      fontSize: '3.5rem',
                      fontWeight: 700,
                      lineHeight: 1,
                      color: 'var(--fg-1)',
                    }}
                  >
                    {streak}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--sans-ui)',
                      fontSize: '0.875rem',
                      color: 'var(--fg-3)',
                    }}
                  >
                    day{streak !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <Flame
                className="w-8 h-8 mt-1"
                style={{ color: 'var(--ember)' }}
              />
            </div>
            <p
              style={{
                fontFamily: 'var(--serif-body)',
                fontStyle: 'italic',
                fontSize: '0.9375rem',
                lineHeight: 1.55,
                color: 'var(--fg-3)',
              }}
            >
              Every day you show up is a seed sown.
            </p>
          </div>
        </motion.div>

        {/* Latest podcast */}
        <motion.div variants={fadeUp}>
          <div
            className="h-full rounded-2xl border border-brand-border p-6 flex flex-col justify-between"
            style={{ background: 'rgb(var(--surface-raw))' }}
          >
            <div className="mb-4">
              <p
                style={{
                  fontFamily: 'var(--sans-ui)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--fg-3)',
                }}
                className="mb-3"
              >
                Latest Episode
              </p>

              {podcastLoading ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ) : podcast ? (
                <>
                  <p
                    style={{
                      fontFamily: 'var(--serif-display)',
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      lineHeight: 1.25,
                      color: 'var(--fg-1)',
                    }}
                    className="mb-1"
                  >
                    {podcast.title}
                  </p>
                  {podcast.duration && (
                    <p
                      style={{
                        fontFamily: 'var(--sans-ui)',
                        fontSize: '0.8125rem',
                        color: 'var(--fg-3)',
                      }}
                    >
                      {podcast.duration}
                    </p>
                  )}
                </>
              ) : (
                <p
                  style={{
                    fontFamily: 'var(--serif-body)',
                    fontStyle: 'italic',
                    fontSize: '0.9375rem',
                    color: 'var(--fg-3)',
                  }}
                >
                  Latest episode coming soon.
                </p>
              )}
            </div>

            <Link
              to="/app/podcasts"
              className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80"
              style={{
                fontFamily: 'var(--sans-ui)',
                color: 'rgb(var(--cta-raw))',
              }}
            >
              <Headphones className="w-4 h-4" />
              Listen now
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </motion.section>

      {/* ── 5. Quick Links Grid ───────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.45, ease: EASE }}
      >
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
          Explore
        </p>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {QUICK_LINKS.map((link) => (
            <motion.div
              key={link.route}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18, ease: EASE }}
            >
              <Link
                to={link.route}
                className="flex flex-col items-center gap-2 py-4 px-2 rounded-xl border border-brand-border transition-colors duration-200 group"
                style={{
                  background: 'var(--bg-card)',
                  boxShadow: 'var(--sh-card)',
                }}
              >
                <link.icon
                  className="w-5 h-5 transition-colors duration-200"
                  style={{ color: 'var(--fg-3)' }}
                />
                <span
                  className="text-[11px] font-medium text-center leading-tight transition-colors duration-200"
                  style={{ fontFamily: 'var(--sans-ui)', color: 'var(--fg-3)' }}
                >
                  {link.label}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
};

export default DashboardPage;
