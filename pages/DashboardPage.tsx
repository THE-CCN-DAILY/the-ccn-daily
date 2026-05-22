import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  BookOpen,
  Headphones,
  Newspaper,
  Route,
  Trophy,
  CalendarDays,
  NotebookPen,
  Flame,
  ChevronRight,
  GraduationCap,
  Target,
  Users,
  MessageCircle,
  Gift,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

interface FeatureCard {
  title: string;
  description: string;
  route: string;
  icon: React.ElementType;
  accentColor: string;
}

const PRIORITY_FEATURES: FeatureCard[] = [
  {
    title: 'Daily Journey',
    description: 'Start your guided devotional for today',
    route: '/app/guided-journey',
    icon: Route,
    accentColor: 'var(--crimson, #8E1B1B)',
  },
  {
    title: 'Bible Reader',
    description: 'Read and study Scripture',
    route: '/app/bible',
    icon: BookOpen,
    accentColor: 'var(--ember, #C23B1E)',
  },
  {
    title: 'Newsletter',
    description: 'Latest devotionals and updates',
    route: '/app/newsletters',
    icon: Newspaper,
    accentColor: 'var(--gold-ds, #B7892E)',
  },
  {
    title: 'Podcast',
    description: 'Listen to messages and teachings',
    route: '/app/podcasts',
    icon: Headphones,
    accentColor: 'var(--amber-ds, #E87A2C)',
  },
  {
    title: 'Journaling',
    description: 'Write what God is speaking to you',
    route: '/app/journaling',
    icon: NotebookPen,
    accentColor: 'var(--crimson, #8E1B1B)',
  },
  {
    title: 'Live Events',
    description: 'Join live broadcasts and services',
    route: '/app/events',
    icon: CalendarDays,
    accentColor: 'var(--ember, #C23B1E)',
  },
];

interface MoreLink {
  label: string;
  route: string;
  icon: React.ElementType;
}

const MORE_LINKS: MoreLink[] = [
  { label: 'Courses', route: '/app/courses', icon: GraduationCap },
  { label: 'Audiobook Library', route: '/app/audiobook-library', icon: Headphones },
  { label: 'Challenges', route: '/app/challenges', icon: Target },
  { label: 'Community', route: '/app/the-community', icon: Users },
  { label: 'Community Rooms', route: '/app/community-rooms', icon: MessageCircle },
  { label: 'Testimonies', route: '/app/testimonies', icon: Trophy },
  { label: 'Grace Links', route: '/app/grace-link', icon: Gift },
];

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color }) => (
  <div
    className="flex items-center gap-3 p-3 rounded-xl"
    style={{ background: `${color}12`, border: `1px solid ${color}25` }}
  >
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: `${color}20` }}
    >
      <Icon className="w-4 h-4" style={{ color }} />
    </div>
    <div>
      <p className="text-lg font-black text-brand-text-primary leading-none">{value}</p>
      <p className="text-[11px] text-brand-text-secondary mt-0.5">{label}</p>
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const displayName = user?.displayName?.split(' ')[0] ?? 'Friend';

  const today = new Date();
  const dayLabel = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex gap-8 max-w-7xl mx-auto pb-20">
      {/* Left Sidebar — desktop only */}
      <aside className="hidden lg:flex flex-col gap-5 w-56 flex-shrink-0">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          <Card className="p-5 flex flex-col gap-4">
            {/* Greeting */}
            <div>
              <p
                style={{
                  fontFamily: 'var(--sans-ui)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  color: 'var(--gold-ds, #B7892E)',
                }}
                className="mb-1"
              >
                Welcome back
              </p>
              <h2
                className="text-xl font-black text-brand-text-primary leading-tight"
                style={{ fontFamily: 'var(--serif-display)' }}
              >
                {displayName}
              </h2>
              <p className="text-xs text-brand-text-secondary mt-1">{dayLabel}</p>
            </div>

            {/* Divider */}
            <div className="border-t border-brand-border" />

            {/* Quick stats */}
            <div className="flex flex-col gap-2.5">
              <StatCard
                label="Day Streak"
                value={1}
                icon={Flame}
                color="var(--ember, #C23B1E)"
              />
              <StatCard
                label="Chapters Read"
                value={0}
                icon={BookOpen}
                color="var(--crimson, #8E1B1B)"
              />
              <StatCard
                label="Prayers Journaled"
                value={0}
                icon={NotebookPen}
                color="var(--gold-ds, #B7892E)"
              />
            </div>

            {/* Progress placeholder */}
            <div className="border-t border-brand-border pt-3">
              <div className="flex justify-between items-center mb-1.5">
                <p className="text-[11px] font-semibold text-brand-text-secondary">Your Journey</p>
                <p className="text-[11px] font-bold text-brand-text-primary">0%</p>
              </div>
              <div className="h-1.5 w-full rounded-full bg-brand-border overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: '2%', background: 'var(--crimson, #8E1B1B)' }}
                />
              </div>
              <p className="text-[10px] text-brand-text-secondary/60 mt-1.5">Keep going — every day matters.</p>
            </div>
          </Card>
        </motion.div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Page header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: EASE }}
        >
          <p
            style={{
              fontFamily: 'var(--sans-ui)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: 'var(--crimson, #8E1B1B)',
            }}
            className="mb-2"
          >
            Sanctuary
          </p>
          <h1
            className="text-4xl font-black text-brand-text-primary mb-2"
            style={{ fontFamily: 'var(--serif-display)', fontWeight: 600, lineHeight: 1.2 }}
          >
            Today
          </h1>
          <p
            style={{
              fontFamily: 'var(--serif-body)',
              fontSize: '18px',
              lineHeight: 1.65,
              color: 'var(--fg-2, #5B4A3C)',
            }}
          >
            {dayLabel} — begin where you left off.
          </p>
        </motion.div>

        {/* Priority feature grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {PRIORITY_FEATURES.map((feat) => (
            <motion.div
              key={feat.route}
              variants={fadeUp}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <Link to={feat.route} className="block h-full">
                <Card
                  className="group p-5 hover:shadow-lg transition-all cursor-pointer border-t-2 h-full"
                  style={{ borderTopColor: feat.accentColor }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${feat.accentColor}18` }}
                    >
                      <feat.icon className="w-5 h-5" style={{ color: feat.accentColor }} />
                    </div>
                    <ChevronRight className="w-4 h-4 text-brand-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3
                    className="font-bold text-brand-text-primary mb-1"
                    style={{ fontFamily: 'var(--serif-display)' }}
                  >
                    {feat.title}
                  </h3>
                  <p className="text-xs text-brand-text-secondary">{feat.description}</p>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* More features */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: EASE, delay: 0.35 }}
        >
          <p
            style={{
              fontFamily: 'var(--sans-ui)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: 'var(--gold-ds, #B7892E)',
            }}
            className="mb-3"
          >
            More Features
          </p>
          <div className="flex flex-wrap gap-2">
            {MORE_LINKS.map((link) => (
              <Link
                key={link.route}
                to={link.route}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-border text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary hover:border-brand-accent/40 hover:bg-brand-secondary transition-all"
              >
                <link.icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
