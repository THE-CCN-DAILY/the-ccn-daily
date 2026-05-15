import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import { fetchRSSFeed, FeedItem } from '../services/rssService';
import { SparklesIcon, SpinnerIcon, ReaderIcon } from '../components/icons';

const SUBSTACK_FEED_URL = 'https://theccndaily.substack.com/feed';

const NewsletterPage: React.FC = () => {
  const [posts, setPosts] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const feed = await fetchRSSFeed(SUBSTACK_FEED_URL);
        // Substack feed items without enclosures are usually regular posts
        setPosts(feed.items);
      } catch (error) {
        console.error("Failed to load newsletter posts:", error);
        setError('The newsletter feed could not be loaded. Please try again shortly.');
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

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

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20">
      <header className="mb-8">
        {publicNav}
        <h1 className="text-4xl font-black text-brand-text-primary mb-2 flex items-center gap-4">
          <ReaderIcon className="w-10 h-10 text-brand-accent" />
          The CCN Daily
        </h1>
        <p className="text-brand-text-secondary">Explore the latest insight, devotionals, and community updates.</p>
      </header>

      {loading && (
        <div className="flex flex-col justify-center items-center border-y border-brand-border py-24">
          <SpinnerIcon className="w-10 h-10 text-brand-accent animate-spin mb-4" />
          <p className="text-brand-text-secondary animate-pulse">Fetching latest updates from THE CCN DAILY...</p>
        </div>
      )}

      {!loading && error && (
        <div className="border border-status-warning/40 bg-status-warning/10 p-5 text-sm text-brand-text-secondary">
          {error}
        </div>
      )}

      {!loading && !error && (
      <div className="space-y-6">
        {posts.map((post, index) => (
          <Card key={post.guid || index} className="overflow-hidden p-0 group">
            <div className="md:flex">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest bg-brand-accent/10 px-2 py-0.5 rounded">
                    Newsletter
                  </span>
                  <span className="text-xs text-brand-text-secondary">
                    {post.pubDate ? new Date(post.pubDate).toLocaleDateString() : ''}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-brand-text-primary mb-3 group-hover:text-brand-accent transition-colors">
                  {post.title}
                </h2>
                <div 
                  className="text-brand-text-secondary text-sm line-clamp-3 mb-4"
                  dangerouslySetInnerHTML={{ __html: post.contentSnippet || post.content || '' }}
                />
                <a 
                  href={post.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-brand-accent hover:underline"
                >
                  Read Full Story on Substack
                  <SparklesIcon className="w-4 h-4" />
                </a>
              </div>
            </div>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
};

export default NewsletterPage;
