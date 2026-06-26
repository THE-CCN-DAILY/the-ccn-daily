import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import AnnouncementBanner from '../components/AnnouncementBanner';
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
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useGamification } from '../contexts/GamificationContext';

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
    ? devotional.body.replace(/\n+/g, ' ').trim().slice(0, 160) + '\u2026'
    : null;

  return (
    <Link
      to="/guided-journey"
      className="block w-full rounded-2xl overflow-hidden glass-panel border border-brand-border/30 hover:border-brand-accent/40 shadow-lg hover:shadow-[0_0_35px_rgba(242,125,38,0.15)] transition-all duration-300 group cursor-pointer"
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
          <p className="ds-eyebrow mb-4 tracking-widest text-brand-accent">
            Today&apos;s Devotional &middot; {dateLabel}
          </p>

          {/* Title */}
          <h2 className="ds-display text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight text-brand-text-primary mb-4">
            {devotional?.title ?? 'Your next devotional is being prepared.'}
          </h2>

          {/* Excerpt */}
          {excerpt ? (
            <p className="font-serif text-base sm:text-lg leading-relaxed text-brand-text-secondary mb-8 max-w-2xl">
              {excerpt}
            </p>
          ) : (
            <p className="font-serif text-base sm:text-lg leading-relaxed text-brand-text-secondary mb-8">
              Begin with the Daily Sanctuary. A quiet path is already waiting for you.
            </p>
          )}

          {/* CTA */}
          <span className="inline-flex items-center gap-2 rounded-md bg-brand-accent hover:bg-brand-cta-light px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 group-hover:translate-x-0.5">
            Open Daily Sanctuary
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      )}
    </Link>
  );
};

// ─── Continue Strip Cards ─────────────────────────────────────────────────────

const CONTINUE_CARDS = [
  {
    icon: Target,
    title: 'Planner',
    desc: 'Set your intention for today',
    route: '/planner',
  },
  {
    icon: BookOpen,
    title: 'Bible',
    desc: 'Continue reading',
    route: '/bible',
  },
  {
    icon: NotebookPen,
    title: 'Journaling',
    desc: 'Write a reflection',
    route: '/journaling',
  },
] as const;

// ─── Quick Links ──────────────────────────────────────────────────────────────

const QUICK_LINKS = [
  { label: 'Courses', route: '/courses', icon: GraduationCap },
  { label: 'Community', route: '/community-rooms', icon: Users },
  { label: 'Events', route: '/events', icon: CalendarDays },
  { label: 'Books', route: '/books', icon: Library },
  { label: 'Testimonies', route: '/testimonies', icon: Star },
  { label: 'Newsletter', route: '/newsletters', icon: Newspaper },
] as const;

// ─── Main Component ───────────────────────────────────────────────────────────

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Time-aware greeting
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.displayName?.split(' ')[0] ?? 'Friend';

  // Date labels
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

  // Prayer prompt: one per day of week
  const prayerPrompt = PRAYER_PROMPTS[now.getDay()];

  // Firestore data
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [devotionalLoading, setDevotionalLoading] = useState(true);

  // Single source of truth for the streak (shared with the Gamification page + Journey).
  const { stats } = useGamification();
  const streak = stats.currentStreak;

  const [podcast, setPodcast] = useState<PodcastEpisode | null>(null);
  const [podcastLoading, setPodcastLoading] = useState(true);

  useEffect(() => {
    // Fetch latest devotional
    const fetchDevotional = async () => {
      try {
        // Match the guided journey: latest PUBLISHED devotional dated on/before today.
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
        // Firestore unavailable: show placeholder
      } finally {
        setDevotionalLoading(false);
      }
    };

    // Fetch latest podcast episode
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
    fetchPodcast();
  }, [user?.uid]);

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4 md:px-0">

      {/* Admin-authored promo banner (schedule + audience filtered) */}
      <AnnouncementBanner />

      {/* 1. Greeting Header */}
      <motion.section
        className="mb-10 overflow-hidden rounded-lg border border-brand-border p-7 md:p-9"
        style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-paper) 62%, color-mix(in srgb, var(--gold-ds) 9%, var(--bg-card)) 100%)',
          boxShadow: 'var(--sh-card)',
        }}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        {/* Prayer prompt */}
        <p className="font-serif italic text-sm leading-relaxed text-brand-text-secondary mb-4 max-w-2xl">
          &ldquo;{prayerPrompt}&rdquo;
        </p>

        {/* Main greeting */}
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-brand-text-primary mb-2">
          {greeting}, {firstName}.
        </h1>

        {/* Date */}
        <p className="font-sans text-xs font-medium tracking-wider text-brand-text-tertiary">
          {dayLabel}
        </p>
      </motion.section>

      {/* 2. Today's Featured Devotional */}
      <motion.section
        className="mb-10"
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

      {/* 3. Continue Where You Left Off */}
      <motion.section
        className="mb-10"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.18 }}
      >
        <p className="ds-eyebrow mb-4 tracking-wider text-brand-text-tertiary">
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
              whileHover={{ y: -2 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="flex-shrink-0"
            >
              <Link
                to={card.route}
                className="flex flex-col gap-3 p-5 border border-brand-border transition-all duration-200 w-48 group ds-card"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-brand-accent/10 transition-colors duration-200 group-hover:bg-brand-accent/20">
                  <card.icon className="w-4 h-4 text-brand-accent" />
                </div>
                <div>
                  <p className="font-sans font-semibold text-brand-text-primary text-sm mb-0.5">
                    {card.title}
                  </p>
                  <p className="font-sans text-xs text-brand-text-tertiary leading-snug">
                    {card.desc}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* 4. Community and Momentum */}
      <motion.section
        className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-2"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        {/* Streak counter */}
        <motion.div variants={fadeUp}>
          <div className="h-full border border-brand-border p-6 flex flex-col justify-between ds-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="ds-eyebrow mb-1 tracking-wider text-brand-text-tertiary">
                  Streak
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-5xl sm:text-6xl font-bold leading-none text-brand-text-primary">
                    {streak}
                  </span>
                  <span className="font-sans text-sm text-brand-text-secondary">
                    day{streak !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <Flame className="w-8 h-8 mt-1 text-brand-accent" />
            </div>
            <p className="font-serif italic text-sm leading-relaxed text-brand-text-secondary">
              Every day you show up is a seed sown.
            </p>
          </div>
        </motion.div>

        {/* Latest podcast */}
        <motion.div variants={fadeUp}>
          <div className="h-full border border-brand-border p-6 flex flex-col justify-between ds-card">
            <div className="mb-4">
              <p className="ds-eyebrow mb-3 tracking-wider text-brand-text-tertiary">
                Latest Episode
              </p>

              {podcastLoading ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ) : podcast ? (
                <>
                  <p className="font-display text-lg sm:text-xl font-semibold leading-snug text-brand-text-primary mb-1">
                    {podcast.title}
                  </p>
                  {podcast.duration && (
                    <p className="font-sans text-xs text-brand-text-tertiary">
                      {podcast.duration}
                    </p>
                  )}
                </>
              ) : (
                <p className="font-serif italic text-sm leading-relaxed text-brand-text-secondary">
                  The next episode will appear here when it is published.
                </p>
              )}
            </div>

            <Link
              to="/podcasts"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent transition-colors hover:text-brand-cta-light mt-4"
            >
              <Headphones className="w-4 h-4" />
              Listen now
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </motion.section>

      {/* 5. Quick Links Grid */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.45, ease: EASE }}
      >
        <p className="ds-eyebrow mb-4 tracking-wider text-brand-text-tertiary">
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
                className="flex flex-col items-center gap-2 py-4 px-2 border border-brand-border transition-all duration-200 group ds-card"
              >
                <link.icon className="w-5 h-5 text-brand-text-secondary group-hover:text-brand-accent transition-colors duration-200" />
                <span className="font-sans text-xs font-medium text-brand-text-secondary group-hover:text-brand-text-primary text-center leading-tight transition-colors duration-200">
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
