import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import {
  BookOpen,
  CalendarDays,
  Headphones,
  Mail,
  NotebookPen,
  Radio,
  Users,
  ArrowRight,
  Flame,
  Globe,
  Clock,
} from 'lucide-react';

/* ─── Animation Variants ──────────────────────────────────────────────────── */

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const staggerFast = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.7 } },
};

/* ─── Data ────────────────────────────────────────────────────────────────── */

const features = [
  {
    icon: BookOpen,
    label: 'Bible & devotional reading',
    text: 'Start with Scripture, then move into a guided reflection that respects your working life — not a performance, just presence.',
  },
  {
    icon: Headphones,
    label: 'Podcast & audio formation',
    text: 'Listen while commuting, walking, or closing the day. Formation shouldn\'t require a desk.',
  },
  {
    icon: NotebookPen,
    label: 'Private journaling',
    text: 'Capture prayers, convictions, and decisions without turning devotion into another noisy feed. Your words stay yours.',
  },
  {
    icon: Users,
    label: 'Community & leadership',
    text: 'Support families, small groups, testimonies, and prayer rooms. Built for leaders who carry others.',
  },
];

const channels = [
  {
    icon: Mail,
    title: 'Newsletter',
    text: 'Essays and devotionals for faith, work, leadership, and endurance — direct to your inbox.',
  },
  {
    icon: Radio,
    title: 'Podcast',
    text: 'Audio formation for commutes, quiet rooms, and workday resets. Press play anywhere.',
  },
  {
    icon: CalendarDays,
    title: 'Events',
    text: 'Live moments, gatherings, and ministry rhythms as they come online.',
  },
];

const stats = [
  { icon: Globe, value: '40+', label: 'Countries' },
  { icon: Flame, value: 'Daily', label: 'New devotionals' },
  { icon: Clock, value: '10 min', label: 'Morning rhythm' },
];

const todayItems = [
  [BookOpen, 'Scripture & guided devotional'],
  [NotebookPen, 'Journal response prompt'],
  [Headphones, 'Audio reflection (8 min)'],
  [Users, 'Community prayer wall'],
];

const dailyVerse = {
  text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles.',
  ref: 'Isaiah 40:31',
};

/* ─── Scroll-reveal wrapper ───────────────────────────────────────────────── */

const Reveal: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className, delay = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px 0px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
};

/* ─── Component ───────────────────────────────────────────────────────────── */

const LandingPage: React.FC = () => {
  const { user, signIn } = useAuth();
  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: '-60px 0px' });

  return (
    <div className="min-h-screen bg-brand-secondary text-brand-text-primary">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.header
        className="sticky top-0 z-40 border-b border-brand-border bg-brand-secondary/90 backdrop-blur-md"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-lg font-bold tracking-tight text-brand-text-primary">
            THE CCN DAILY
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-brand-text-secondary md:flex">
            <Link to="/newsletter" className="transition-colors hover:text-brand-text-primary">Newsletter</Link>
            <Link to="/podcasts" className="transition-colors hover:text-brand-text-primary">Podcasts</Link>
            <Link to="/blog" className="transition-colors hover:text-brand-text-primary">Blog</Link>
            <Link to="/pricing" className="transition-colors hover:text-brand-text-primary">Pricing</Link>
          </nav>
          {user ? (
            <Link
              to="/app/guided-journey"
              className="flex items-center gap-2 border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text-primary transition-colors hover:bg-brand-dark"
            >
              Open app <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <button
              onClick={signIn}
              className="flex items-center gap-2 border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text-primary transition-colors hover:bg-brand-dark"
            >
              Sign in <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </motion.header>

      <main>

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* Ambient glow */}
          <div
            className="pointer-events-none absolute inset-x-0 -top-40 h-[600px] opacity-30"
            aria-hidden
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgb(242 125 38 / 0.35) 0%, transparent 70%)',
            }}
          />

          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-32">

            {/* Left — copy */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.p
                variants={fadeUp}
                className="mb-5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-accent"
              >
                Faith for the workday soul
              </motion.p>

              <motion.h1
                variants={fadeUp}
                className="font-display text-5xl font-bold leading-[1.15] text-brand-text-primary md:text-6xl lg:text-[3.75rem]"
              >
                A quiet daily rhythm for Scripture, prayer, and spiritual steadiness.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-7 max-w-xl text-[1.125rem] leading-[1.8] text-brand-text-secondary"
              >
                THE CCN DAILY helps busy professionals begin again with God — read, listen, reflect,
                journal, and lead with a formed inner life. Ten minutes. Every morning.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-10 flex flex-col gap-3 sm:flex-row"
              >
                <Link
                  to="/app/guided-journey"
                  className="group flex items-center justify-center gap-2 bg-brand-accent px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-cta-light hover:shadow-[0_0_24px_rgb(242_125_38_/_0.35)]"
                >
                  Begin your daily formation
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/newsletter"
                  className="flex items-center justify-center border border-brand-border px-7 py-3.5 text-sm font-semibold text-brand-text-primary transition-colors hover:bg-brand-dark"
                >
                  Read latest letter
                </Link>
              </motion.div>

              {/* Stats row */}
              <motion.div
                variants={staggerFast}
                className="mt-12 flex flex-wrap gap-x-8 gap-y-4"
              >
                {stats.map(({ icon: Icon, value, label }) => (
                  <motion.div
                    key={label}
                    variants={fadeUp}
                    className="flex items-center gap-2.5 text-brand-text-secondary"
                  >
                    <Icon className="h-4 w-4 text-brand-accent opacity-70" />
                    <span className="text-sm">
                      <strong className="font-semibold text-brand-text-primary">{value}</strong>{' '}
                      {label}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — Today preview card */}
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
              className="relative border border-brand-border bg-brand-dark p-8 lg:self-start"
            >
              {/* Subtle inner glow */}
              <div
                className="pointer-events-none absolute inset-0 opacity-10"
                aria-hidden
                style={{
                  background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgb(242 125 38) 0%, transparent 70%)',
                }}
              />

              <p className="relative mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-brand-text-secondary">
                Today inside the sanctuary
              </p>

              {/* Verse preview */}
              <blockquote className="relative mb-6 border-l-2 border-brand-accent pl-4">
                <p className="font-display text-sm italic leading-relaxed text-brand-text-primary">
                  "{dailyVerse.text}"
                </p>
                <footer className="mt-2 text-xs text-brand-accent">{dailyVerse.ref}</footer>
              </blockquote>

              <h2 className="relative font-display text-2xl font-bold leading-snug text-brand-text-primary">
                Prepare your heart before the day takes your attention.
              </h2>

              <div className="relative mt-7 space-y-4 border-t border-brand-border pt-7">
                {todayItems.map(([Icon, label], i) => (
                  <motion.div
                    key={label as string}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.08, duration: 0.4 }}
                    className="flex items-center gap-3.5 text-brand-text-secondary"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-sm border border-brand-border bg-brand-secondary">
                      <Icon className="h-3.5 w-3.5 text-brand-accent" />
                    </div>
                    <span className="text-sm">{label as string}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.85 }}
                className="relative mt-7"
              >
                <Link
                  to="/app/guided-journey"
                  className="block w-full border border-brand-accent bg-brand-accent/10 py-3 text-center text-xs font-semibold uppercase tracking-widest text-brand-accent transition-colors hover:bg-brand-accent hover:text-white"
                >
                  Enter sanctuary →
                </Link>
              </motion.div>
            </motion.aside>
          </div>
        </section>

        {/* ── Channels bar ──────────────────────────────────────────────────── */}
        <Reveal>
          <section className="border-y border-brand-border bg-brand-dark">
            <div className="mx-auto grid max-w-6xl divide-y divide-brand-border px-6 md:grid-cols-3 md:divide-x md:divide-y-0">
              {channels.map(({ icon: Icon, title, text }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="group py-10 md:px-8"
                >
                  <Icon className="mb-5 h-5 w-5 text-brand-accent transition-transform group-hover:scale-110" />
                  <h3 className="font-display text-xl font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-brand-text-secondary">{text}</p>
                </motion.div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* ── Features ──────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 py-20 md:py-28" ref={featuresRef}>
          <Reveal className="mb-14 max-w-2xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-brand-accent">
              A real app, not only a website
            </p>
            <h2 className="font-display text-4xl font-bold leading-tight">
              Built for formation, content, community, leadership, and administration.
            </h2>
          </Reveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={featuresInView ? 'visible' : 'hidden'}
            className="grid gap-px border border-brand-border bg-brand-border md:grid-cols-2"
          >
            {features.map(({ icon: Icon, label, text }) => (
              <motion.article
                key={label}
                variants={fadeUp}
                className="group bg-brand-secondary p-8 transition-colors hover:bg-brand-dark"
              >
                <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-sm border border-brand-border bg-brand-dark transition-colors group-hover:border-brand-accent/40 group-hover:bg-brand-accent/10">
                  <Icon className="h-4.5 w-4.5 text-brand-accent" />
                </div>
                <h3 className="text-base font-semibold">{label}</h3>
                <p className="mt-3 text-sm leading-7 text-brand-text-secondary">{text}</p>
              </motion.article>
            ))}
          </motion.div>
        </section>

        {/* ── Closing CTA ───────────────────────────────────────────────────── */}
        <Reveal>
          <section className="border-t border-brand-border bg-brand-dark">
            <div className="relative mx-auto max-w-6xl overflow-hidden px-6 py-20 text-center md:py-28">
              {/* Glow */}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-64 opacity-20"
                aria-hidden
                style={{
                  background: 'radial-gradient(ellipse 70% 80% at 50% 100%, rgb(242 125 38) 0%, transparent 70%)',
                }}
              />
              <p className="relative mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-brand-accent">
                Begin for free
              </p>
              <h2 className="relative font-display text-4xl font-bold leading-tight md:text-5xl">
                New mercies. Every morning.
              </h2>
              <p className="relative mx-auto mt-6 max-w-xl text-lg leading-relaxed text-brand-text-secondary">
                No noise. No performance. Just ten minutes with God before the day begins.
                Start free — upgrade when you're ready.
              </p>
              <div className="relative mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/app/guided-journey"
                  className="group flex items-center gap-2 bg-brand-accent px-8 py-4 text-sm font-semibold text-white transition-all hover:shadow-[0_0_32px_rgb(242_125_38_/_0.4)]"
                >
                  Start your morning rhythm
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/pricing"
                  className="flex items-center gap-2 border border-brand-border px-8 py-4 text-sm font-semibold text-brand-text-primary transition-colors hover:bg-brand-secondary"
                >
                  View plans
                </Link>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <footer className="border-t border-brand-border bg-brand-secondary">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-xs text-brand-text-secondary sm:flex-row">
            <span className="font-display font-bold text-brand-text-primary">THE CCN DAILY</span>
            <nav className="flex flex-wrap justify-center gap-5">
              <Link to="/newsletter" className="hover:text-brand-text-primary">Newsletter</Link>
              <Link to="/podcasts" className="hover:text-brand-text-primary">Podcasts</Link>
              <Link to="/blog" className="hover:text-brand-text-primary">Blog</Link>
              <Link to="/pricing" className="hover:text-brand-text-primary">Pricing</Link>
              <Link to="/app/giving" className="hover:text-brand-text-primary">Support</Link>
            </nav>
            <span>© {new Date().getFullYear()} THE CCN DAILY</span>
          </div>
        </footer>

      </main>
    </div>
  );
};

export default LandingPage;
