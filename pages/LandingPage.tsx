import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  Headphones,
  Mail,
  NotebookPen,
  Radio,
  Users,
} from 'lucide-react';

const featureRows = [
  { icon: BookOpen, label: 'Bible and devotional reading', text: 'Start with Scripture, then move into a guided reflection that respects your working life.' },
  { icon: Headphones, label: 'Podcast and audio formation', text: 'Listen to THE CCN DAILY while commuting, preparing, walking, or closing the day.' },
  { icon: NotebookPen, label: 'Private journaling', text: 'Capture prayers, convictions, and decisions without turning devotion into another noisy feed.' },
  { icon: Users, label: 'Community and leadership', text: 'Support families, small groups, testimonies, prayer rooms, and leader care without losing privacy.' },
];

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-secondary text-brand-text-primary">
      <header className="border-b border-brand-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="font-display text-xl font-bold tracking-normal">
            THE CCN DAILY
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-brand-text-secondary md:flex">
            <Link to="/newsletter" className="hover:text-brand-text-primary">Newsletter</Link>
            <Link to="/podcasts" className="hover:text-brand-text-primary">Podcasts</Link>
            <Link to="/blog" className="hover:text-brand-text-primary">Blog</Link>
            <Link to="/pricing" className="hover:text-brand-text-primary">Pricing</Link>
          </nav>
          <Link
            to="/app/guided-journey"
            className="border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text-primary hover:bg-brand-dark"
          >
            Enter app
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-16 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div>
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.08em] text-brand-text-secondary">
              Faith for the workday soul
            </p>
            <h1 className="font-display text-5xl font-bold leading-tight text-brand-text-primary md:text-6xl">
              A quiet daily rhythm for Scripture, prayer, work, and spiritual steadiness.
            </h1>
            <p className="mt-8 max-w-2xl text-xl leading-[1.75] text-brand-text-secondary">
              THE CCN DAILY helps busy professionals begin again with God: read, listen, reflect,
              journal, grow in community, and lead with a formed inner life.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/app/guided-journey"
                className="border border-brand-accent bg-brand-accent px-6 py-3 text-center text-sm font-semibold text-brand-secondary hover:opacity-90"
              >
                Start today
              </Link>
              <Link
                to="/newsletter"
                className="border border-brand-border px-6 py-3 text-center text-sm font-semibold text-brand-text-primary hover:bg-brand-dark"
              >
                Read latest letter
              </Link>
            </div>
          </div>

          <aside className="border border-brand-border bg-brand-dark p-8">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-brand-text-secondary">
              Today inside the sanctuary
            </p>
            <h2 className="font-display text-3xl font-bold leading-tight">
              Prepare your heart before the day takes your attention.
            </h2>
            <div className="mt-8 space-y-5 border-t border-brand-border pt-8">
              {[
                [BookOpen, 'Scripture and devotional'],
                [NotebookPen, 'Journal response'],
                [Headphones, 'Audio reflection'],
                [Users, 'Community prayer'],
              ].map(([Icon, label]) => (
                <div key={label as string} className="flex items-center gap-4 text-brand-text-secondary">
                  <Icon className="h-5 w-5 text-brand-accent" />
                  <span className="text-sm">{label as string}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="border-y border-brand-border bg-brand-dark">
          <div className="mx-auto grid max-w-6xl divide-y divide-brand-border px-6 md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              [Mail, 'Newsletter', 'Essays and devotionals for faith, work, leadership, and endurance.'],
              [Radio, 'Podcast', 'Audio formation for commutes, quiet rooms, and workday resets.'],
              [CalendarDays, 'Events', 'Live moments, gatherings, and ministry rhythms as they come online.'],
            ].map(([Icon, title, text]) => (
              <div key={title as string} className="py-10 md:px-8">
                <Icon className="mb-5 h-6 w-6 text-brand-accent" />
                <h3 className="font-display text-2xl font-bold">{title as string}</h3>
                <p className="mt-3 text-sm leading-7 text-brand-text-secondary">{text as string}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 max-w-3xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-brand-text-secondary">
              A real app, not only a website
            </p>
            <h2 className="font-display text-4xl font-bold leading-tight">
              Built for formation, content, community, leadership, and administration.
            </h2>
          </div>
          <div className="grid gap-px border border-brand-border bg-brand-border md:grid-cols-2">
            {featureRows.map(({ icon: Icon, label, text }) => (
              <article key={label} className="bg-brand-secondary p-8">
                <Icon className="mb-6 h-6 w-6 text-brand-accent" />
                <h3 className="text-lg font-semibold">{label}</h3>
                <p className="mt-3 text-sm leading-7 text-brand-text-secondary">{text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
