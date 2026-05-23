import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../components/Card';
import CcnLogo from '../components/CcnLogo';
import { FeedItem, fetchRSSFeed } from '../services/rssService';
import { ReaderIcon, SparklesIcon, SpinnerIcon } from '../components/icons';
import { cleanFeedText, excerptFeedText } from '../utils/feedText';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };

const SUBSTACK_URL = 'https://theccndaily.substack.com/';
const SUBSTACK_FEED_URL = 'https://theccndaily.substack.com/feed';

const getPostText = (post: FeedItem) =>
  post.contentSnippet || post.content || post.itunes?.summary || '';

function getNewsletterThumbnail(item: FeedItem): string | null {
  if (item.itunes?.image) return item.itunes.image;
  if (item.content) {
    const match = item.content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match) return match[1];
  }
  return null;
}

const NewsletterPage: React.FC = () => {
  const [posts, setPosts] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPost, setExpandedPost] = useState<FeedItem | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      setError('');

      try {
        const feed = await fetchRSSFeed(SUBSTACK_FEED_URL);
        setPosts(feed.items);
      } catch {
        setError('The newsletter feed could not be loaded. Please try again shortly.');
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  // Lock body scroll while reader is open
  useEffect(() => {
    if (expandedPost) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [expandedPost]);

  const featuredPost = useMemo(() => posts[0], [posts]);
  const remainingPosts = useMemo(() => posts.slice(1), [posts]);

  const publicNav = (
    <nav className="mb-8 flex items-center justify-between border-b border-brand-border pb-5">
      <Link to="/" aria-label="THE CCN DAILY — home">
        <CcnLogo size="sm" />
      </Link>
      <div className="flex items-center gap-5 text-sm font-semibold text-brand-text-secondary">
        <Link to="/blog" className="hover:text-brand-accent transition-colors">Blog</Link>
        <Link to="/podcasts" className="hover:text-brand-accent transition-colors">Podcasts</Link>
      </div>
    </nav>
  );

  const PostCard: React.FC<{ post: FeedItem; featured?: boolean }> = ({ post, featured = false }) => {
    const thumb = getNewsletterThumbnail(post);
    return (
      <Card
        className="overflow-hidden p-0 group cursor-pointer ds-card ds-card-top"
        style={{ borderTop: '2px solid var(--crimson)' }}
        onClick={() => setExpandedPost(post)}
      >
        {thumb && (
          <img
            src={thumb}
            alt={post.title ?? ''}
            className="w-full h-40 object-cover rounded-t-md"
            loading="lazy"
          />
        )}
        <div className="p-6">
          <div className="mb-3 flex items-start justify-between gap-4">
            <span className="rounded bg-brand-accent/10 px-2 py-0.5 text-[12px] font-black uppercase tracking-widest text-brand-accent">
              Newsletter
            </span>
            <span className="shrink-0 text-xs text-brand-text-secondary">
              {post.pubDate ? new Date(post.pubDate).toLocaleDateString() : ''}
            </span>
          </div>
          <h2
            className={`${featured ? 'text-3xl' : 'text-2xl'} mb-3 font-bold leading-tight text-brand-text-primary transition-colors group-hover:text-brand-accent`}
            style={{ fontFamily: 'var(--serif-display)' }}
          >
            {post.title || 'Untitled newsletter'}
          </h2>
          <p className="mb-5 text-sm leading-6 text-brand-text-secondary">
            {excerptFeedText(getPostText(post), featured ? 360 : 220)}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); setExpandedPost(post); }}
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-accent hover:underline"
          >
            Read this issue
            <SparklesIcon className="h-4 w-4" />
          </button>
        </div>
      </Card>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20">
      <header className="mb-8">
        {publicNav}
        <motion.div
          className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <div>
            <p
              className="mb-1 text-[12px] font-black uppercase tracking-widest text-brand-accent"
              style={{ fontFamily: 'var(--sans-ui)' }}
            >
              Newsletter
            </p>
            <h1
              className="flex items-center gap-4 text-4xl font-black text-brand-text-primary"
              style={{ fontFamily: 'var(--serif-display)' }}
            >
              <ReaderIcon className="h-10 w-10 text-brand-accent" />
              Newsletter
            </h1>
          </div>
          <a
            href={SUBSTACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ds-subscribe-btn"
            style={{ fontFamily: 'var(--sans-ui)' }}
          >
            Subscribe on Substack ↗
          </a>
        </motion.div>
        <motion.p
          className="mt-2 text-brand-text-secondary"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.15 }}
        >
          Essays and devotionals for faith, work, and endurance — read every issue right here.
        </motion.p>
      </header>

      {loading && (
        <div className="flex flex-col items-center justify-center border-y border-brand-border py-24">
          <SpinnerIcon className="mb-4 h-10 w-10 animate-spin text-brand-accent" />
          <p className="animate-pulse text-brand-text-secondary">Loading latest issues…</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-status-warning/40 bg-status-warning/10 p-5 text-sm text-brand-text-secondary">
          {error}
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="border-y border-brand-border py-12 text-center">
          <p className="text-brand-text-secondary">No issues available yet — check back soon.</p>
        </div>
      )}

      <AnimatePresence>
        {!loading && !error && posts.length > 0 && (
          <motion.div
            className="space-y-6"
            variants={stagger} initial="hidden" animate="visible"
          >
            {featuredPost && (
              <motion.div variants={fadeUp} transition={{ duration: 0.55, ease: EASE }}>
                <PostCard
                  post={{ ...featuredPost, contentSnippet: cleanFeedText(getPostText(featuredPost)) }}
                  featured
                />
              </motion.div>
            )}
            {remainingPosts.map((post, index) => (
              <motion.div
                key={post.guid || post.link || index}
                variants={fadeUp}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <PostCard post={{ ...post, contentSnippet: cleanFeedText(getPostText(post)) }} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── In-app reader drawer ─────────────────────────────────────── */}
      <AnimatePresence>
        {expandedPost && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setExpandedPost(null)}
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-brand-dark rounded-t-3xl"
              style={{ maxHeight: '92vh' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 38 }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-brand-border" />
              </div>

              {/* Drawer header */}
              <div className="flex items-start justify-between px-6 pt-4 pb-3 border-b border-brand-border flex-shrink-0">
                <div className="flex-1 min-w-0 pr-4">
                  <span
                    className="text-xs font-bold uppercase tracking-widest text-brand-accent"
                    style={{ fontFamily: 'var(--sans-ui)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg-3)' }}
                  >
                    {expandedPost.pubDate ? new Date(expandedPost.pubDate).toLocaleDateString() : 'Newsletter'}
                  </span>
                  <h2
                    className="text-xl font-bold text-brand-text-primary mt-1 leading-snug line-clamp-2"
                    style={{ fontFamily: 'var(--serif-display)', fontWeight: 600 }}
                  >
                    {expandedPost.title}
                  </h2>
                </div>
                <button
                  onClick={() => setExpandedPost(null)}
                  aria-label="Close reader"
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-secondary flex items-center justify-center text-brand-text-secondary hover:text-brand-text-primary transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="max-w-2xl mx-auto">
                  {expandedPost.content ? (
                    <div
                      className="ds-reading-body prose-newsletter"
                      style={{ fontFamily: 'var(--serif-body)', color: 'var(--fg-1)' }}
                      dangerouslySetInnerHTML={{ __html: expandedPost.content }}
                    />
                  ) : (
                    <p className="text-brand-text-primary leading-8 text-[1.0625rem] whitespace-pre-line">
                      {cleanFeedText(getPostText(expandedPost))}
                    </p>
                  )}
                </div>
              </div>

              {/* Drawer footer — Substack as secondary action only */}
              <div className="flex-shrink-0 px-6 py-4 border-t border-brand-border">
                <div className="flex items-center justify-between gap-3">
                  <span style={{ fontFamily: 'var(--sans-ui)', fontSize: '12px', color: 'var(--fg-3)' }}>
                    Also available on Substack
                  </span>
                  <a
                    href={expandedPost.link ?? SUBSTACK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-brand-accent hover:underline flex-shrink-0"
                  >
                    Open on Substack ↗
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewsletterPage;
