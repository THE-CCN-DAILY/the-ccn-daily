import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import { FeedItem, fetchRSSFeed } from '../services/rssService';
import { ReaderIcon, SparklesIcon, SpinnerIcon } from '../components/icons';
import { cleanFeedText, excerptFeedText } from '../utils/feedText';

const SUBSTACK_FEED_URL = 'https://theccndaily.substack.com/feed';

const getPostText = (post: FeedItem) =>
  post.contentSnippet || post.content || post.itunes?.summary || '';

const NewsletterPage: React.FC = () => {
  const [posts, setPosts] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      setError('');

      try {
        const feed = await fetchRSSFeed(SUBSTACK_FEED_URL);
        setPosts(feed.items);
      } catch (error) {
        console.error('Failed to load newsletter posts:', error);
        setError('The newsletter feed could not be loaded. Please try again shortly.');
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const featuredPost = useMemo(() => posts[0], [posts]);
  const remainingPosts = useMemo(() => posts.slice(1), [posts]);

  const publicNav = (
    <nav className="mb-8 flex items-center justify-between border-b border-brand-border pb-5">
      <Link to="/" className="font-display text-xl font-bold text-brand-text-primary">
        THE CCN DAILY
      </Link>
      <div className="flex items-center gap-5 text-sm font-semibold text-brand-text-secondary">
        <Link to="/blog" className="hover:text-brand-accent">Blog</Link>
        <Link to="/podcasts" className="hover:text-brand-accent">Podcasts</Link>
      </div>
    </nav>
  );

  const PostCard: React.FC<{ post: FeedItem; featured?: boolean }> = ({ post, featured = false }) => (
    <Card className="overflow-hidden p-0 group">
      <div className="p-6">
        <div className="mb-3 flex items-start justify-between gap-4">
          <span className="rounded bg-brand-accent/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-brand-accent">
            Newsletter
          </span>
          <span className="shrink-0 text-xs text-brand-text-secondary">
            {post.pubDate ? new Date(post.pubDate).toLocaleDateString() : ''}
          </span>
        </div>
        <h2 className={`${featured ? 'text-3xl' : 'text-2xl'} mb-3 font-bold leading-tight text-brand-text-primary transition-colors group-hover:text-brand-accent`}>
          {post.title || 'Untitled newsletter'}
        </h2>
        <p className="mb-5 text-sm leading-6 text-brand-text-secondary">
          {excerptFeedText(getPostText(post), featured ? 360 : 220)}
        </p>
        {post.link && (
          <a
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-accent hover:underline"
          >
            Read Full Story on Substack
            <SparklesIcon className="h-4 w-4" />
          </a>
        )}
      </div>
    </Card>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20">
      <header className="mb-8">
        {publicNav}
        <h1 className="mb-2 flex items-center gap-4 text-4xl font-black text-brand-text-primary">
          <ReaderIcon className="h-10 w-10 text-brand-accent" />
          The CCN Daily
        </h1>
        <p className="text-brand-text-secondary">
          Explore the latest insight, devotionals, and community updates.
        </p>
      </header>

      {loading && (
        <div className="flex flex-col items-center justify-center border-y border-brand-border py-24">
          <SpinnerIcon className="mb-4 h-10 w-10 animate-spin text-brand-accent" />
          <p className="animate-pulse text-brand-text-secondary">Fetching latest updates from THE CCN DAILY...</p>
        </div>
      )}

      {!loading && error && (
        <div className="border border-status-warning/40 bg-status-warning/10 p-5 text-sm text-brand-text-secondary">
          {error}
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="border-y border-brand-border py-12 text-center">
          <p className="text-brand-text-secondary">No newsletter posts are available from the feed yet.</p>
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <div className="space-y-6">
          {featuredPost && <PostCard post={{ ...featuredPost, contentSnippet: cleanFeedText(getPostText(featuredPost)) }} featured />}
          {remainingPosts.map((post, index) => (
            <PostCard key={post.guid || post.link || index} post={{ ...post, contentSnippet: cleanFeedText(getPostText(post)) }} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsletterPage;
