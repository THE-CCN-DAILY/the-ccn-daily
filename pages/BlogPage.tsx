import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import usePageMeta from '../hooks/usePageMeta';
import { ArrowRight, BookOpen, PenLine, RefreshCw, Search } from 'lucide-react';
import { listPublishedBlogPosts, type BlogPost } from '../services/blogService';
import CcnLogo from '../components/CcnLogo';

const EASE = [0.2, 0.6, 0.2, 1] as [number, number, number, number];
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };

const fallbackPosts: BlogPost[] = [
  {
    id: 'fallback-faith-monday',
    slug: 'faith-that-can-survive-monday-morning',
    title: 'Faith that can survive Monday morning',
    excerpt:
      'The point of a devotional life is not escape from responsibility. It is to become the kind of person who can carry responsibility without losing the soul.',
    content: '',
    category: 'Work and devotion',
    status: 'published',
    authorName: 'THE CCN DAILY',
    publishedAt: '2026-05-15T00:00:00.000Z',
  },
  {
    id: 'fallback-quiet-strength',
    slug: 'why-quiet-is-not-weakness',
    title: 'Why quiet is not weakness',
    excerpt:
      'A quiet heart is not an inactive heart. It is a governed heart: alert, receptive, and less easily ruled by noise.',
    content: '',
    category: 'Spiritual formation',
    status: 'published',
    authorName: 'THE CCN DAILY',
    publishedAt: '2026-05-14T00:00:00.000Z',
  },
  {
    id: 'fallback-professional-rhythm',
    slug: 'a-better-rhythm-for-christian-professionals',
    title: 'A better rhythm for working believers',
    excerpt:
      'The working believer needs more than motivation. We need Scripture, prayer, reflection, and a way to return to God in the middle of pressure.',
    content: '',
    category: 'Leadership',
    status: 'published',
    authorName: 'THE CCN DAILY',
    publishedAt: '2026-05-13T00:00:00.000Z',
  },
];

const formatDate = (value?: string) => {
  if (!value) return 'Draft date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Draft date';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const BlogPage: React.FC = () => {
  usePageMeta({
    title: 'Blog',
    description: 'Essays and devotionals on faith, work, leadership, and endurance — Scripture-anchored writing from THE CCN DAILY.',
  });
  const [posts, setPosts] = React.useState<BlogPost[]>(fallbackPosts);
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const loadPosts = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const nextPosts = await listPublishedBlogPosts();
      setPosts(nextPosts.length ? nextPosts : fallbackPosts);
    } catch (err) {
      setPosts(fallbackPosts);
      setError(err instanceof Error ? err.message : 'Could not load blog posts.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const filteredPosts = posts.filter((post) => {
    const haystack = `${post.title} ${post.excerpt} ${post.category}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const leadPost = filteredPosts[0];
  const remainingPosts = filteredPosts.slice(1);
  const categories = Array.from(new Set(posts.map((post) => post.category))).slice(0, 6);

  return (
    <div className="min-h-screen text-brand-text-primary" style={{ background: 'var(--bg-paper, #F6EFE1)' }}>
      <header className="border-b border-brand-border" style={{ background: 'var(--bg-paper, #F6EFE1)' }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <Link to="/" aria-label="THE CCN DAILY — home">
            <CcnLogo size="md" theme="auto" />
          </Link>
          <nav className="flex w-full items-center justify-between border-t border-brand-border pt-4 text-sm font-semibold text-brand-text-secondary sm:w-auto sm:justify-start sm:gap-5 sm:border-t-0 sm:pt-0" style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)' }}>
            <Link to="/newsletter" className="hover:text-brand-text-primary">Newsletter</Link>
            <Link to="/podcasts" className="hover:text-brand-text-primary">Podcasts</Link>
            <Link to="/guided-journey" className="border border-brand-border px-4 py-2 hover:bg-brand-dark">
              Enter app
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <section className="grid gap-12 border-b border-brand-border pb-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <motion.p
              className="mb-5 flex items-center gap-2"
              style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--crimson, #8E1B1B)' }}
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, ease: EASE }}
            >
              <PenLine className="h-4 w-4" /> Blog
            </motion.p>
            <motion.h1
              className="max-w-3xl text-5xl leading-tight md:text-6xl"
              style={{ fontFamily: 'var(--serif-display, "Cormorant Garamond", Georgia, serif)', fontWeight: 600 }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.06, ease: EASE }}
            >
              Essays for faith, work, leadership, endurance, and the inner life.
            </motion.h1>
          </div>
          <div className="border-l border-brand-border pl-8 max-lg:border-l-0 max-lg:pl-0">
            <motion.p
              className="max-w-xl"
              style={{ fontFamily: 'var(--serif-body, "EB Garamond", Georgia, serif)', fontSize: '17px', lineHeight: 1.8, color: 'var(--fg-2, #5B4A3C)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Thoughtful devotional writing for believers carrying real responsibilities:
              work, family, leadership, grief, calling, habits, Scripture, and prayer.
            </motion.p>
            <motion.div
              className="mt-8 flex flex-wrap gap-3"
              variants={stagger} initial="hidden" animate="visible"
            >
              {categories.map((category) => (
                <motion.button
                  key={category}
                  type="button"
                  onClick={() => setQuery(category)}
                  className="border border-brand-border px-4 py-2 hover:border-brand-accent"
                  style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg-3, #8A7A6A)' }}
                  variants={fadeUp}
                  transition={{ duration: 0.35, ease: EASE }}
                  whileHover={{ y: -1 }}
                >
                  {category}
                </motion.button>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="mt-10 flex flex-col gap-4 border-b border-brand-border pb-10 md:flex-row md:items-center md:justify-between">
          <label className="relative block w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-secondary" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search essays, topics, or themes"
              className="h-12 w-full border border-brand-border pl-11 pr-4 outline-none focus:border-brand-accent"
              style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '13px', color: 'var(--fg-1, #2A1C15)', background: 'var(--bg-paper, #F6EFE1)' }}
            />
          </label>
          <button
            type="button"
            onClick={loadPosts}
            className="inline-flex h-12 items-center gap-2 border border-brand-border px-5 hover:border-brand-accent hover:text-brand-accent"
            style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-3, #8A7A6A)' }}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </section>

        {error && (
          <div className="mt-8 border border-status-warning/40 bg-status-warning/10 p-5 text-sm leading-6 text-brand-text-secondary">
            Live blog data is temporarily unavailable, so the public archive is showing the built-in editorial
            starter set. Technical detail: {error}
          </div>
        )}

        {leadPost ? (
          <section className="mt-14">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible"
              viewport={{ once: true }} transition={{ duration: 0.6, ease: EASE }}
            >
            <Link
              to={`/blog/${leadPost.slug}`}
              className="group grid gap-10 border-b border-brand-border pb-14 lg:grid-cols-[0.7fr_1fr]"
            >
              <div>
                <p style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--crimson, #8E1B1B)' }}>
                  Featured essay
                </p>
                <p className="mt-3" style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '11px', color: 'var(--fg-3, #8A7A6A)' }}>{formatDate(leadPost.publishedAt)}</p>
              </div>
              <div>
                <h2 className="text-4xl leading-tight group-hover:text-brand-accent md:text-5xl" style={{ fontFamily: 'var(--serif-display, "Cormorant Garamond", Georgia, serif)', fontWeight: 600, lineHeight: 1.25 }}>
                  {leadPost.title}
                </h2>
                <p className="mt-6 max-w-2xl" style={{ fontFamily: 'var(--serif-body, "EB Garamond", Georgia, serif)', fontSize: '18px', lineHeight: 1.75, color: 'var(--fg-2, #5B4A3C)' }}>
                  {leadPost.excerpt}
                </p>
                <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-accent" style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)' }}>
                  Read essay <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
            </motion.div>

            <motion.div
              className="divide-y divide-brand-border border-b border-brand-border"
              variants={stagger} initial="hidden" whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
            >
              {remainingPosts.map((post) => (
                <motion.div
                  key={post.id}
                  variants={fadeUp} transition={{ duration: 0.5, ease: EASE }}
                >
                <Link
                  to={`/blog/${post.slug}`}
                  className="group grid gap-8 py-10 md:grid-cols-[0.35fr_1fr]"
                >
                  <div>
                    <p style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--crimson, #8E1B1B)' }}>
                      {post.category}
                    </p>
                    <p className="mt-3" style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '11px', color: 'var(--fg-3, #8A7A6A)' }}>{formatDate(post.publishedAt)}</p>
                  </div>
                  <div>
                    <h2 className="text-3xl group-hover:text-brand-accent" style={{ fontFamily: 'var(--serif-display, "Cormorant Garamond", Georgia, serif)', fontWeight: 600, lineHeight: 1.25 }}>
                      {post.title}
                    </h2>
                    <p className="mt-5 max-w-2xl" style={{ fontFamily: 'var(--serif-body, "EB Garamond", Georgia, serif)', fontSize: '17px', lineHeight: 1.65, color: 'var(--fg-2, #5B4A3C)' }}>
                      {post.excerpt}
                    </p>
                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-accent" style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)' }}>
                      <BookOpen className="h-4 w-4" /> Read
                    </div>
                  </div>
                </Link>
                </motion.div>
              ))}
            </motion.div>
          </section>
        ) : (
          <section className="mt-16 border-y border-brand-border py-20 text-center">
            <p className="text-3xl" style={{ fontFamily: 'var(--serif-display, "Cormorant Garamond", Georgia, serif)', fontWeight: 600, color: 'var(--fg-1, #2A1C15)' }}>No essays match that search.</p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="mt-6 border border-brand-border px-5 py-3 hover:border-brand-accent hover:text-brand-accent"
              style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-3, #8A7A6A)' }}
            >
              Clear search
            </button>
          </section>
        )}
      </main>
    </div>
  );
};

export default BlogPage;
