import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { listTestimonies } from '../services/testimonyService';
import { useTheme } from '../contexts/ThemeContext';
import CcnLogo from '../components/CcnLogo';
import AmbientDevotionalMotion from '../components/landing/AmbientDevotionalMotion';
import FeaturesDevotionalMotion from '../components/landing/FeaturesDevotionalMotion';
import usePageMeta from '../hooks/usePageMeta';
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
  BookOpenCheck,
  GraduationCap,
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

const detailedFeatures = [
  {
    id: 'feature-devotionals',
    icon: BookOpen,
    label: 'Daily Devotionals',
    text: "Arrive every morning with quiet discipline. We provide a focused Scripture reading, a brief pastoral reflection, and space to settle your thoughts before the workday begins. Written and spoken versions let you choose how to listen.",
    to: '/guided-journey',
    cta: "Open today's devotional",
    accent: 'var(--crimson)',
  },
  {
    id: 'feature-bible',
    icon: BookOpenCheck,
    label: 'Bible Reader',
    text: "Read the Word without distractions. The interface supports multiple translations and curated reading plans that keep you on track. Highlight key verses and build a deep, personal relationship with Scripture.",
    to: '/bible',
    cta: "Open the Bible",
    accent: 'var(--ember)',
  },
  {
    id: 'feature-audio',
    icon: Headphones,
    label: 'Podcasts & Audio',
    text: "Listen to pastoral conversations and study guides while you commute or walk. Form your faith on the move. Press play and let careful teaching anchor your daily routine.",
    to: '/podcasts',
    cta: "Browse podcasts",
    accent: 'var(--amber-ds)',
  },
  {
    id: 'feature-journal',
    icon: NotebookPen,
    label: 'Private Journal',
    text: "Write down your prayers, choices, and convictions in a quiet space. No public feeds or social pressure. Your entries are kept private and secure, helping you see how God works in your life.",
    to: '/journaling',
    cta: "Start writing",
    accent: 'var(--gold-ds)',
  },
  {
    id: 'feature-community',
    icon: Users,
    label: 'Community & Prayer',
    text: "Share prayer requests and testimonies with other believers. Gather with small groups in digital rooms that encourage real connection. Carry each other's burdens.",
    to: '/the-community',
    cta: "Join the community",
    accent: 'var(--sage)',
  },
  {
    id: 'feature-events',
    icon: GraduationCap,
    label: 'Courses & Events',
    text: "Structured studies and live online gatherings help you grow. Learn from experienced leaders who teach sound theology. Engage with practical resources designed to build up your local ministry.",
    to: '/pricing',
    cta: "Explore courses",
    accent: 'var(--color-primary-blue)',
  },
];

const stats = [
  { icon: Globe, value: '40+', label: 'Countries reached' },
  { icon: Flame, value: 'Daily', label: 'Scripture rhythm' },
  { icon: Clock, value: 'Quiet', label: 'Morning reset' },
];

const todayItems = [
  [BookOpen, 'Isaiah 40:31 passage study'],
  [NotebookPen, 'Reflective journal prompt'],
  [Headphones, 'Audio devotion and prayer'],
  [Users, 'Community prayer wall'],
];

const dailyVerse = {
  text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles.',
  ref: 'Isaiah 40:31',
};


// Landing testimonials are pulled live from the Firestore `testimonies` collection
// (the Wall of Testimony). No hardcoded/fake testimonials.
type LandingTestimony = { quote: string; name: string; location?: string };

const formationVerses = [
  {
    text: 'Your word is a lamp to my feet and a light to my path.',
    ref: 'Psalm 119:105',
  },
  {
    text: 'The word of God is living and active, sharper than any two-edged sword, piercing to the division of soul and of spirit.',
    ref: 'Hebrews 4:12',
  },
  {
    text: 'Let the word of Christ dwell in you richly, teaching and admonishing one another in all wisdom.',
    ref: 'Colossians 3:16',
  },
  {
    text: 'Man shall not live by bread alone, but by every word that comes from the mouth of God.',
    ref: 'Matthew 4:4',
  },
];

const scriptureVerses = [
  { text: '"Do not be anxious about anything..."', ref: 'Phil. 4:6' },
  { text: '"Trust in the Lord with all your heart..."', ref: 'Prov. 3:5' },
  { text: '"Be still, and know that I am God."', ref: 'Ps. 46:10' },
  { text: '"The Lord is my shepherd; I shall not want."', ref: 'Ps. 23:1' },
  { text: '"I can do all this through him who gives me strength."', ref: 'Phil. 4:13' },
];

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

/* ─── Sunrise Emblem (decorative SVG) ────────────────────────────────────── */

// Clean, legible watermark: a single sunrise arc + rays cradling an open book with a
// flame clearly lifted above its spine. Kept deliberately simple — the previous version
// stacked curved pages, page-text strokes, and a flame under a heavy blur, which muddied
// into an unreadable smudge at the low watermark opacity.
const SunriseEmblem: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="glowRad" cx="50%" cy="58%" r="55%">
        <stop offset="0%" stopColor="#F27D26" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#F27D26" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="flameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFD9A0" />
        <stop offset="100%" stopColor="#F27D26" />
      </linearGradient>
      <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#F27D26" stopOpacity="0.25" />
        <stop offset="50%" stopColor="#FFAF50" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#F27D26" stopOpacity="0.25" />
      </linearGradient>
    </defs>

    {/* Soft ambient halo */}
    <circle cx="100" cy="118" r="74" fill="url(#glowRad)" />

    {/* Sunrise arc + horizon */}
    <path d="M 46 132 A 54 54 0 0 1 154 132" stroke="url(#arcGrad)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    <line x1="36" y1="132" x2="164" y2="132" stroke="#F27D26" strokeWidth="1" strokeOpacity="0.28" />

    {/* A few clean rays fanning above the horizon */}
    {[-46, -23, 0, 23, 46].map((deg, i) => {
      const rad = (deg - 90) * (Math.PI / 180);
      const x1 = 100 + 60 * Math.cos(rad);
      const y1 = 132 + 60 * Math.sin(rad);
      const x2 = 100 + 74 * Math.cos(rad);
      const y2 = 132 + 74 * Math.sin(rad);
      return (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFAF50" strokeWidth="1" strokeOpacity={deg === 0 ? 0.85 : 0.4} strokeLinecap="round" />
      );
    })}

    {/* Open book — two straight pages meeting at the spine (no muddy curves/text) */}
    <g stroke="#FFAF50" strokeOpacity="0.85" strokeWidth="1.6" strokeLinejoin="round" fill="none">
      <path d="M100 112 L 56 104 L 56 124 L 100 130 Z" />
      <path d="M100 112 L 144 104 L 144 124 L 100 130 Z" />
      <line x1="100" y1="112" x2="100" y2="130" strokeOpacity="0.6" />
    </g>

    {/* Flame, clearly lifted above the spine with a gap so the two read as separate marks */}
    <path d="M100 60 C 113 78, 110 92, 100 100 C 90 92, 87 78, 100 60 Z" fill="url(#flameGrad)" />
    <path d="M100 74 C 106 84, 105 92, 100 97 C 95 92, 94 84, 100 74 Z" fill="#FFE6BE" fillOpacity="0.85" />
  </svg>
);

/* ─── Component ───────────────────────────────────────────────────────────── */

/* ─── Theme-aware CTA section gradient config ─────────────────────────────── */

const CTA_COLORS = {
  dark: {
    skyFrom: '#0D0B09', skyTo: '#1C0F08',
    dawnOpacity: 0.50, dawnMidOpacity: 0.20, dawnMidColor: '#7B3200',
    centerOpacity: 0.06,
    overlayBg: 'rgba(15,13,11,0.65)',
    glowColor: 'rgba(242,125,38,0.30)',
    arcColor: '#F27D26',
    arcOpacities: [0.20, 0.14, 0.10, 0.07, 0.05, 0.03] as number[],
    rayColor: '#F8A060', rayOpacity: 0.055,
    starColor: '#F8C090', starOpacity: 0.40,
    horizonColor: '#F27D26', horizonOpacity: 0.07,
    headingColor: 'white', bodyColor: 'rgba(255,255,255,0.72)',
    btnBorderColor: 'rgba(255,255,255,0.25)', btnTextColor: 'rgba(255,255,255,0.80)',
  },
  light: {
    skyFrom: '#FDF8F0', skyTo: '#FFF4E0',
    dawnOpacity: 0.32, dawnMidOpacity: 0.12, dawnMidColor: '#D4813C',
    centerOpacity: 0.04,
    overlayBg: 'rgba(253,248,240,0.20)',
    glowColor: 'rgba(242,125,38,0.18)',
    arcColor: '#C23B1E',
    arcOpacities: [0.22, 0.16, 0.12, 0.09, 0.06, 0.04] as number[],
    rayColor: '#E87A2C', rayOpacity: 0.07,
    starColor: '#8E1B1B', starOpacity: 0.18,
    horizonColor: '#E87A2C', horizonOpacity: 0.10,
    headingColor: '#2A1C15', bodyColor: 'rgba(42,28,21,0.65)',
    btnBorderColor: 'rgba(42,28,21,0.30)', btnTextColor: 'rgba(42,28,21,0.70)',
  },
  sepia: {
    skyFrom: '#F5EDD8', skyTo: '#EDE0C4',
    dawnOpacity: 0.38, dawnMidOpacity: 0.14, dawnMidColor: '#A8521E',
    centerOpacity: 0.05,
    overlayBg: 'rgba(245,237,216,0.18)',
    glowColor: 'rgba(180,100,20,0.18)',
    arcColor: '#8E1B1B',
    arcOpacities: [0.22, 0.16, 0.12, 0.09, 0.06, 0.04] as number[],
    rayColor: '#C23B1E', rayOpacity: 0.07,
    starColor: '#8E1B1B', starOpacity: 0.16,
    horizonColor: '#C23B1E', horizonOpacity: 0.09,
    headingColor: '#2A1C15', bodyColor: 'rgba(42,28,21,0.62)',
    btnBorderColor: 'rgba(42,28,21,0.28)', btnTextColor: 'rgba(42,28,21,0.68)',
  },
} as const;

const LandingPage: React.FC = () => {
  const { user, openSignIn } = useAuth();
  const { theme } = useTheme();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const feature = params.get('feature');
    const hash = window.location.hash;
    const targetId = feature ? `feature-${feature}` : (hash ? hash.replace('#', '') : null);
    
    if (targetId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, []);

  usePageMeta({
    title: 'THE CCN DAILY: Your personal devotional space',
    rawTitle: true,
    description:
      'A steady daily place to meet God with Scripture, prayer, audio devotionals, and guided reflection for believers who want to walk closely with God wherever they are.',
  });

  // Live testimonials from the Wall of Testimony (latest 3 published). Public read.
  const [testimonials, setTestimonials] = useState<LandingTestimony[]>([]);
  useEffect(() => {
    let mounted = true;
    listTestimonies(3)
      .then((items) => {
        if (mounted) setTestimonials(items.map((t) => ({ quote: t.text, name: t.author })));
      })
      .catch(() => {
        /* public page — if Firestore is unavailable, simply show no testimonials */
      });
    return () => {
      mounted = false;
    };
  }, []);

  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: '-60px 0px' });

  // ── Parallax scroll values ─────────────────────────────────────────────
  const { scrollY } = useScroll();
  const emblemY       = useTransform(scrollY, [0, 700], [0, 110]);
  const emblemScale   = useTransform(scrollY, [0, 700], [1, 0.86]);
  const ambientGlowY  = useTransform(scrollY, [0, 500], [0, -55]);

  // ── Theme-aware CTA colors ─────────────────────────────────────────────
  const cta = CTA_COLORS[theme] ?? CTA_COLORS.dark;

  // ── Hero ambient glow color (theme-aware) ──────────────────────────────
  const heroAmbient = theme === 'dark'
    ? 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(242,125,38,0.28) 0%, transparent 70%)'
    : theme === 'sepia'
      ? 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(180,100,20,0.18) 0%, transparent 70%)'
      : 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(242,125,38,0.15) 0%, transparent 70%)';

  const cardInnerGlow = theme === 'dark'
    ? 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(242,125,38,0.10) 0%, transparent 70%)'
    : 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(242,125,38,0.06) 0%, transparent 70%)';

  return (
    <div className="min-h-screen overflow-x-hidden bg-brand-secondary text-brand-text-primary">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.header
        className="sticky top-0 z-40 border-b border-brand-border bg-brand-secondary/90 backdrop-blur-md"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to={user ? "/dashboard" : "/"} aria-label="THE CCN DAILY: home" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <CcnLogo size="md" theme="auto" />
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-brand-text-secondary md:flex">
            <Link to="/?feature=devotionals" onClick={(e) => { e.preventDefault(); scrollToSection('feature-devotionals'); }} className="transition-colors hover:text-brand-text-primary">Devotionals</Link>
            <Link to="/?feature=bible" onClick={(e) => { e.preventDefault(); scrollToSection('feature-bible'); }} className="transition-colors hover:text-brand-text-primary">Bible</Link>
            <Link to="/?feature=audio" onClick={(e) => { e.preventDefault(); scrollToSection('feature-audio'); }} className="transition-colors hover:text-brand-text-primary">Audio</Link>
            <Link to="/?feature=journal" onClick={(e) => { e.preventDefault(); scrollToSection('feature-journal'); }} className="transition-colors hover:text-brand-text-primary">Journal</Link>
            <Link to="/?feature=community" onClick={(e) => { e.preventDefault(); scrollToSection('feature-community'); }} className="transition-colors hover:text-brand-text-primary">Community</Link>
            <Link to="/pricing" className="transition-colors hover:text-brand-text-primary">Pricing</Link>
          </nav>
          {user ? (
            <Link
              to="/guided-journey"
              className="flex shrink-0 items-center gap-2 rounded-md border border-brand-border px-3 py-2 text-xs font-semibold text-brand-text-primary transition-colors hover:bg-brand-dark sm:px-4 sm:text-sm"
            >
              Open app <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <button
              onClick={() => openSignIn()}
              className="flex shrink-0 items-center gap-2 rounded-md border border-brand-border px-3 py-2 text-xs font-semibold text-brand-text-primary transition-colors hover:bg-brand-dark sm:px-4 sm:text-sm"
            >
              Sign in <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </motion.header>

      <main>

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section className="grain relative overflow-hidden border-b border-brand-border">
          {/* Ambient glow */}
          {/* Ambient glow — theme-aware, parallaxes upward on scroll */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 -top-44 h-[520px] opacity-20"
            aria-hidden
            style={{ background: heroAmbient, y: ambientGlowY }}
          />
          {/* Large decorative emblem — parallax layer, moves at 40% scroll rate */}
          <motion.div
            className="pointer-events-none absolute -right-20 -top-20 h-[420px] w-[420px]"
            aria-hidden
            style={{ y: emblemY, scale: emblemScale, opacity: theme === 'dark' ? 0.12 : 0.07 }}
            initial={{ opacity: 0, scale: 0.92, rotate: -4 }}
            animate={{
              opacity: theme === 'dark' ? 0.12 : 0.07,
              scale: 1, rotate: 0,
            }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <SunriseEmblem className="h-full w-full" />
          </motion.div>

          <div className="mx-auto max-w-6xl px-4 py-[4.5rem] sm:px-6 lg:py-28 flex flex-col items-center text-center">

            {/* Centered copy */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center text-center"
            >
              <motion.p
                variants={fadeUp}
                className="mb-5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-accent"
              >
                THE CCN DAILY
              </motion.p>

              <motion.h1
                variants={fadeUp}
                className="font-display text-4xl font-semibold leading-[1.08] sm:text-5xl md:text-6xl lg:text-[4.25rem] max-w-4xl"
                style={{ color: 'var(--fg-1)' }}
              >
                Your personal devotional space.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-7 max-w-xl text-[1.125rem] leading-[1.8] text-brand-text-secondary mx-auto"
              >
                A steady place to meet God each morning. We offer Scripture, prayer, and a few honest minutes of reflection, before the day starts asking everything of you.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-10 flex flex-col gap-3 sm:flex-row justify-center w-full"
              >
                <motion.div whileTap={{ scale: 0.99 }}>
                  <Link
                    to="/guided-journey"
                    className="group flex items-center justify-center gap-2 rounded-md bg-brand-accent px-7 py-3.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(94,15,15,0.18)] transition-colors hover:bg-brand-cta-light"
                  >
                    Open today&apos;s devotional
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>
                <motion.div whileTap={{ scale: 0.99 }}>
                  <Link
                    to="/newsletter"
                    className="flex items-center justify-center rounded-md border border-brand-border px-7 py-3.5 text-sm font-semibold text-brand-text-primary transition-colors hover:bg-brand-dark"
                  >
                    Read latest letter
                  </Link>
                </motion.div>
              </motion.div>

              {/* Stats row */}
              <motion.div
                variants={staggerFast}
                className="mt-12 flex flex-wrap gap-x-8 gap-y-4 justify-center"
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
          </div>
        </section>



        {/* ── Features ──────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 py-20 md:py-28" ref={featuresRef}>
          <Reveal className="mb-14 max-w-2xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-brand-accent">
              A quieter way to begin
            </p>
            <h2 className="font-display text-4xl font-bold leading-tight">
              One rhythm for Scripture, prayer, learning, and shared encouragement.
            </h2>
          </Reveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={featuresInView ? 'visible' : 'hidden'}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {detailedFeatures.map(({ id, icon: Icon, label, text, to, cta, accent }) => (
              <Link
                key={label}
                to={to}
                id={id}
                className="block group scroll-mt-24"
                style={{ '--accent-color': accent } as React.CSSProperties}
              >
                <motion.article
                  variants={fadeUp}
                  className="premium-feature-card p-8 h-full flex flex-col justify-between"
                >
                  <div>
                    <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg premium-feature-icon">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-base font-bold text-brand-text-primary">{label}</h3>
                    <p className="mt-3 text-sm leading-7 text-brand-text-secondary font-serif">{text}</p>
                  </div>
                  <span
                    className="mt-4 inline-flex items-center gap-1 text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: 'var(--accent-color)' }}
                  >
                    {cta} <ArrowRight className="h-3 w-3" />
                  </span>
                </motion.article>
              </Link>
            ))}
          </motion.div>
        </section>

        <FeaturesDevotionalMotion />

        {/* ── Scripture Accent — Psalm 119:105 ───────────────────────────────── */}
        <div className="py-10 px-6 text-center bg-brand-dark border-t border-brand-border/40">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="max-w-lg mx-auto"
          >
            <p className="font-serif italic text-base leading-[1.9] text-brand-text-secondary">
              "Your word is a lamp to my feet and a light to my path."
            </p>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent">
              Psalm 119:105
            </p>
          </motion.div>
        </div>

        {/* ── Origin Story ──────────────────────────────────────────────────── */}
        <section className="w-full bg-brand-dark py-20 px-6 md:py-28">
          <style>{`
            @keyframes scrollLeft {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-14 lg:grid-cols-2 lg:gap-20 items-center">

              {/* Mobile: photo first; Desktop: text left, photo right */}
              {/* Photo column — shown first on mobile via order */}
              <motion.div
                className="order-first lg:order-last"
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="relative overflow-hidden rounded-2xl aspect-[3/4] max-h-[560px]">
                  <img
                    src="/pr-eryeza.jpg"
                    alt="Eryeza Kalalu"
                    className="w-full h-full object-cover object-top"
                  />
                  {/* dark editorial gradient overlay */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(to top, rgba(13,11,9,0.75) 0%, rgba(13,11,9,0.30) 40%, transparent 70%)',
                    }}
                    aria-hidden
                  />
                </div>
              </motion.div>

              {/* Text column — Welcome message */}
              <motion.div
                className="order-last lg:order-first"
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              >
                <h2 className="font-display text-3xl font-bold leading-tight text-brand-text-primary md:text-4xl mb-8">
                  Welcome to your digital spiritual home
                </h2>
                <div className="space-y-5 text-base leading-[1.9] text-brand-text-secondary font-serif">
                  <p>
                    This app was built to be a space where you slow down, hear God's Word, and
                    carry it into the ordinary places of your day. What started in 2017 as
                    Bible-based encouragement sent to a small group of friends has grown into a
                    daily home for believers who want to walk closely with God, think biblically,
                    and live faithfully wherever He has placed them.
                  </p>
                  <p>
                    Inside, you will find devotionals rooted in Scripture, prayer prompts, guided
                    reflections, and resources that enrich your faith every day.
                  </p>
                  <p>
                    God is near. His Word is alive. And your daily walk with Him matters more than
                    you know.
                  </p>
                </div>
                <p className="mt-8 font-serif italic text-brand-text-primary text-base">
                  Welcome to the sanctuary.
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-brand-accent">
                  Pastor Eryeza Kalalu
                </p>
              </motion.div>

            </div>
          </div>
        </section>

        {/* ── Ambient devotional motion — dawn over Scripture (Remotion, lazy) ──── */}
        <AmbientDevotionalMotion
          verseText="Man shall not live by bread alone, but by every word that comes from the mouth of God."
          verseRef="Matthew 4:4"
        />



        {/* ── Scripture Ticker Strip ─────────────────────────────────────────── */}
        <div
          className="w-full overflow-hidden py-4"
          style={{ backgroundColor: '#5E0F0F' }}
          aria-label="Scripture verses"
        >
          <div
            style={{
              display: 'flex',
              width: 'fit-content',
              animation: 'scrollLeft 32s linear infinite',
            }}
          >
            {[...scriptureVerses, ...scriptureVerses].map((verse, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-3 whitespace-nowrap px-8 text-sm font-serif text-amber-50/90"
              >
                <span className="text-amber-200/50 text-base" aria-hidden>✦</span>
                <em>{verse.text}</em>
                <span className="text-amber-200/60 text-xs not-italic font-sans tracking-wide">
                  {verse.ref}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Testimonials (live from the Wall of Testimony) ──────────────────── */}
        {testimonials.length > 0 && (
        <section className="bg-brand-dark py-20 px-6 md:py-28">
          <div className="mx-auto max-w-6xl">
            <Reveal className="mb-14 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-4">
                What People Say
              </p>
              <h2 className="font-display text-3xl font-bold leading-tight text-brand-text-primary md:text-4xl max-w-2xl mx-auto">
                Trusted by believers across the world.
              </h2>
            </Reveal>

            <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map(({ quote, name, location }, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl border border-brand-border bg-brand-secondary p-8"
                >
                  <div
                    className="font-display text-5xl leading-none text-brand-accent mb-4 select-none"
                    aria-hidden
                  >
                    "
                  </div>
                  <blockquote className="italic font-serif text-base leading-[1.85] text-brand-text-primary mb-6">
                    {quote}
                  </blockquote>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-text-primary" style={{ fontVariant: 'small-caps' }}>
                      {name}
                    </p>
                    {location && <p className="text-xs text-brand-text-secondary mt-0.5">{location}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* ── Scripture Accent — Hebrews 4:12 ─────────────────────────────────── */}
        <div className="py-10 px-6 text-center bg-brand-dark border-t border-brand-border/40">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="max-w-xl mx-auto"
          >
            <p className="font-serif italic text-base leading-[1.9] text-brand-text-secondary">
              "The word of God is living and active, sharper than any two-edged sword, piercing to the division of soul and of spirit."
            </p>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent">
              Hebrews 4:12
            </p>
          </motion.div>
        </div>

        {/* ── Final CTA ─────────────────────────────────────────────────────── */}
        <Reveal>
          <section className="bg-brand-secondary border-t border-brand-border py-20 px-6 md:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-5">
                  Begin For Free
                </p>
                <h2 className="font-display text-4xl font-bold leading-tight text-brand-text-primary md:text-5xl mb-6">
                  A daily place to return to God.
                </h2>
                <p className="text-lg leading-relaxed text-brand-text-secondary mb-10">
                  No card is required to start. Enjoy Scripture, prayer, and a quiet rhythm you can keep. More options open up when you are ready to go deeper.
                </p>
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <motion.div
                    whileHover={{ scale: 1.04, boxShadow: '0 0 36px rgba(242,125,38,0.42)', transition: { type: 'spring', stiffness: 360, damping: 22 } }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Link
                      to="/guided-journey"
                      className="group flex items-center gap-2 bg-brand-accent px-8 py-4 text-sm font-semibold text-white transition-all hover:opacity-90"
                    >
                      Begin today
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02, transition: { type: 'spring', stiffness: 360, damping: 26 } }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to="/guided-journey"
                      className="flex items-center gap-2 border border-brand-border px-8 py-4 text-sm font-semibold text-brand-text-primary transition-colors hover:bg-brand-dark"
                    >
                      Explore the App
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </section>
        </Reveal>

        {/* ── Scripture Accent — Colossians 3:16 ──────────────────────────────── */}
        <div className="py-10 px-6 text-center bg-brand-dark border-t border-brand-border/40">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="max-w-lg mx-auto"
          >
            <p className="font-serif italic text-base leading-[1.9] text-brand-text-secondary">
              "Let the word of Christ dwell in you richly, teaching and admonishing one another in all wisdom."
            </p>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent">
              Colossians 3:16
            </p>
          </motion.div>
        </div>

        {/* ── Closing CTA ───────────────────────────────────────────────────── */}
        <Reveal>
          <section className="relative overflow-hidden border-t border-brand-border">
            {/* Theme-aware abstract dawn illustration — concentric arcs + radiant rays.
                All colours are derived from CTA_COLORS so the section responds to dark / light / sepia. */}
            <svg
              viewBox="0 0 1920 800"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid slice"
              className="absolute inset-0 h-full w-full"
              aria-hidden
            >
              <defs>
                <radialGradient id="rg-dawn" cx="50%" cy="100%" r="75%">
                  <stop offset="0%"   stopColor={cta.arcColor}     stopOpacity={cta.dawnOpacity} />
                  <stop offset="45%"  stopColor={cta.dawnMidColor} stopOpacity={cta.dawnMidOpacity} />
                  <stop offset="100%" stopColor={cta.skyFrom}      stopOpacity={0} />
                </radialGradient>
                <radialGradient id="rg-center" cx="50%" cy="55%" r="45%">
                  <stop offset="0%"   stopColor={cta.arcColor} stopOpacity={cta.centerOpacity} />
                  <stop offset="100%" stopColor={cta.skyFrom}  stopOpacity={0} />
                </radialGradient>
                <linearGradient id="lg-sky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={cta.skyFrom} />
                  <stop offset="100%" stopColor={cta.skyTo} />
                </linearGradient>
              </defs>

              {/* Base sky */}
              <rect width="1920" height="800" fill="url(#lg-sky)" />
              {/* Dawn horizon glow */}
              <rect width="1920" height="800" fill="url(#rg-dawn)" />
              {/* Subtle centre atmosphere */}
              <rect width="1920" height="800" fill="url(#rg-center)" />

              {/* Concentric arcs — sunrise ripples */}
              <g fill="none" stroke={cta.arcColor}>
                {([380, 560, 750, 950, 1160, 1400] as const).map((r, i) => (
                  <circle
                    key={r}
                    cx="960" cy="960" r={r}
                    strokeWidth={[1.5, 1, 0.8, 0.6, 0.4, 0.3][i]}
                    strokeOpacity={cta.arcOpacities[i]}
                  />
                ))}
              </g>

              {/* Light rays radiating upward */}
              <g stroke={cta.rayColor} strokeOpacity={cta.rayOpacity} strokeWidth="2">
                {[80, 340, 560, 760, 960, 1160, 1380, 1600, 1840].map((x2) => (
                  <line key={x2} x1="960" y1="960" x2={x2} y2="0" />
                ))}
              </g>

              {/* Stars — scattered light particles */}
              <g fill={cta.starColor} fillOpacity={cta.starOpacity}>
                <circle cx="185"  cy="135" r="1"   />
                <circle cx="490"  cy="90"  r="1.5" />
                <circle cx="730"  cy="165" r="1"   />
                <circle cx="1020" cy="78"  r="1.5" />
                <circle cx="1280" cy="125" r="1"   />
                <circle cx="1590" cy="180" r="1.5" />
                <circle cx="320"  cy="270" r="1"   />
                <circle cx="655"  cy="305" r="1"   />
                <circle cx="1160" cy="245" r="1.5" />
                <circle cx="1455" cy="285" r="1"   />
                <circle cx="840"  cy="215" r="1"   />
                <circle cx="1720" cy="138" r="1"   />
                <circle cx="420"  cy="400" r="1"   />
                <circle cx="1500" cy="380" r="1"   />
              </g>

              {/* Warm horizon brightspot */}
              <ellipse
                cx="960" cy="800" rx="500" ry="120"
                fill={cta.horizonColor} fillOpacity={cta.horizonOpacity}
              />
            </svg>

            {/* Theme-aware overlay — darkens in dark mode, barely visible in light/sepia */}
            <div className="absolute inset-0" style={{ background: cta.overlayBg }} aria-hidden />

            {/* Bottom glow pulse */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-72 opacity-30"
              aria-hidden
              style={{
                background: `radial-gradient(ellipse 70% 80% at 50% 100%, ${cta.arcColor} 0%, transparent 70%)`,
              }}
            />

            <div className="relative mx-auto max-w-6xl px-6 py-24 text-center md:py-36">
              <h2
                className="font-display text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
                style={{ color: cta.headingColor }}
              >
                New mercies wait<br className="hidden sm:block" /> in the morning.
              </h2>
              <p
                className="mx-auto mt-6 max-w-xl text-lg leading-relaxed"
                style={{ color: cta.bodyColor }}
              >
                Scripture-anchored. Distraction-free. A space to meet God before the world makes its demands.
                Begin free and go deeper when you are ready.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <motion.div whileTap={{ scale: 0.99 }}>
                  <Link
                    to="/guided-journey"
                    className="group flex items-center gap-2 rounded-md bg-brand-accent px-8 py-4 text-sm font-semibold text-white transition-colors hover:bg-brand-cta-light"
                  >
                    Open today&apos;s devotional
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </motion.div>
                <motion.div whileTap={{ scale: 0.99 }}>
                  <Link
                    to="/pricing"
                    className="flex items-center gap-2 rounded-md border px-8 py-4 text-sm font-semibold transition-colors"
                    style={{ borderColor: cta.btnBorderColor, color: cta.btnTextColor }}
                  >
                    View plans
                  </Link>
                </motion.div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <footer className="border-t border-brand-border bg-brand-secondary">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-xs text-brand-text-secondary sm:flex-row">
            <CcnLogo size="sm" />
            <nav className="flex flex-wrap justify-center gap-5">
              <Link to="/newsletter" className="hover:text-brand-text-primary">Newsletter</Link>
              <Link to="/podcasts" className="hover:text-brand-text-primary">Podcasts</Link>
              <Link to="/blog" className="hover:text-brand-text-primary">Blog</Link>
              <Link to="/pricing" className="hover:text-brand-text-primary">Pricing</Link>
              <Link to="/giving" className="hover:text-brand-text-primary">Support</Link>
              <Link to="/help" className="hover:text-brand-text-primary">Help</Link>
            </nav>
            <span>© {new Date().getFullYear()} THE CCN DAILY</span>
          </div>
        </footer>

      </main>
    </div>
  );
};

export default LandingPage;
