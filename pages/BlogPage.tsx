import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, PenLine, RefreshCw, Search } from 'lucide-react';
import { listPublishedBlogPosts, type BlogPost } from '../services/blogService';

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
    title: 'A better rhythm for Christian professionals',
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
    <div className="min-h-screen bg-brand-secondary text-brand-text-primary">
      <header className="border-b border-brand-border bg-brand-secondary/95">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <Link to="/" className="whitespace-nowrap font-display text-xl font-bold">
            THE CCN DAILY
          </Link>
          <nav className="flex w-full items-center justify-between border-t border-brand-border pt-4 text-sm font-semibold text-brand-text-secondary sm:w-auto sm:justify-start sm:gap-5 sm:border-t-0 sm:pt-0">
            <Link to="/newsletter" className="hover:text-brand-text-primary">Newsletter</Link>
            <Link to="/podcasts" className="hover:text-brand-text-primary">Podcasts</Link>
            <Link to="/app/guided-journey" className="border border-brand-border px-4 py-2 hover:bg-brand-dark">
              Enter app
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <section className="grid gap-12 border-b border-brand-border pb-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-text-secondary">
              <PenLine className="h-4 w-4" /> Blog
            </p>
            <h1 className="max-w-3xl font-display text-5xl font-bold leading-tight md:text-6xl">
              Essays for faith, work, leadership, endurance, and the inner life.
            </h1>
          </div>
          <div className="border-l border-brand-border pl-8 max-lg:border-l-0 max-lg:pl-0">
            <p className="max-w-xl text-[17px] leading-[1.8] text-brand-text-secondary">
              Thoughtful devotional writing for believers carrying real responsibilities:
              work, family, leadership, grief, calling, habits, Scripture, and prayer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setQuery(category)}
                  className="border border-brand-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-text-secondary hover:border-brand-accent hover:text-brand-accent"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 flex flex-col gap-4 border-b border-brand-border pb-10 md:flex-row md:items-center md:justify-between">
          <label className="relative block w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-secondary" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search essays, topics, or themes"
              className="h-12 w-full border border-brand-border bg-brand-secondary pl-11 pr-4 text-sm text-brand-text-primary outline-none focus:border-brand-accent"
            />
          </label>
          <button
            type="button"
            onClick={loadPosts}
            className="inline-flex h-12 items-center gap-2 border border-brand-border px-5 text-sm font-semibold text-brand-text-secondary hover:border-brand-accent hover:text-brand-accent"
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
            <Link
              to={`/blog/${leadPost.slug}`}
              className="group grid gap-10 border-b border-brand-border pb-14 lg:grid-cols-[0.7fr_1fr]"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-text-secondary">
                  Featured essay
                </p>
                <p className="mt-3 text-sm text-brand-text-secondary">{formatDate(leadPost.publishedAt)}</p>
              </div>
              <div>
                <h2 className="font-display text-4xl font-bold leading-tight group-hover:text-brand-accent md:text-5xl">
                  {leadPost.title}
                </h2>
                <p className="mt-6 max-w-2xl text-[18px] leading-[1.8] text-brand-text-secondary">
                  {leadPost.excerpt}
                </p>
                <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-accent">
                  Read essay <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>

            <div className="divide-y divide-brand-border border-b border-brand-border">
              {remainingPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group grid gap-8 py-10 md:grid-cols-[0.35fr_1fr]"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-text-secondary">
                      {post.category}
                    </p>
                    <p className="mt-3 text-sm text-brand-text-secondary">{formatDate(post.publishedAt)}</p>
                  </div>
                  <div>
                    <h2 className="font-display text-3xl font-bold leading-tight group-hover:text-brand-accent">
                      {post.title}
                    </h2>
                    <p className="mt-5 max-w-2xl text-[17px] leading-[1.8] text-brand-text-secondary">
                      {post.excerpt}
                    </p>
                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-accent">
                      <BookOpen className="h-4 w-4" /> Read
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-16 border-y border-brand-border py-20 text-center">
            <p className="font-display text-3xl font-bold">No essays match that search.</p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="mt-6 border border-brand-border px-5 py-3 text-sm font-semibold text-brand-text-secondary hover:border-brand-accent hover:text-brand-accent"
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
