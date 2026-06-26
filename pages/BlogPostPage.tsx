import React from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, CalendarDays, PenLine } from 'lucide-react';
import { getPublishedBlogPost, type BlogPost } from '../services/blogService';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { PlayIcon, PauseIcon } from '../components/icons';
import CcnLogo from '../components/CcnLogo';
import usePageMeta from '../hooks/usePageMeta';
import { useAuth } from '../contexts/AuthContext';

const formatDate = (value?: string) => {
  if (!value) return 'Unscheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unscheduled';
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const BlogPostPage: React.FC = () => {
  const { user } = useAuth();
  const { slug = '' } = useParams();
  const [post, setPost] = React.useState<BlogPost | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = useAudioPlayer();

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    getPublishedBlogPost(slug)
      .then((nextPost) => {
        if (active) setPost(nextPost);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load this essay.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  // Per-post title/description + Article structured data (read by Googlebot, which
  // renders client JS, and by answer engines parsing the page entity).
  const articleJsonLd = React.useMemo(() => {
    if (!post) return undefined;
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt,
      author: { '@type': 'Person', name: post.authorName },
      datePublished: post.publishedAt || undefined,
      articleSection: post.category,
      publisher: {
        '@type': 'Organization',
        name: 'THE CCN DAILY',
        logo: { '@type': 'ImageObject', url: 'https://theccndaily.com/logo-wordmark-white.webp' },
      },
      mainEntityOfPage: `https://theccndaily.com/blog/${slug}`,
    } as Record<string, unknown>;
  }, [post, slug]);

  usePageMeta({
    title: post ? post.title : 'Essay',
    description: post?.excerpt || 'Essays and devotionals on faith, work, leadership, and endurance from THE CCN DAILY.',
    jsonLd: articleJsonLd,
  });

  return (
    <div className="min-h-screen bg-brand-secondary text-brand-text-primary">
      <header className="border-b border-brand-border bg-brand-secondary/95">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link to={user ? "/dashboard" : "/"} aria-label="THE CCN DAILY — home">
            <CcnLogo size="sm" />
          </Link>
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-text-secondary hover:text-brand-accent">
            <ArrowLeft className="h-4 w-4" /> Blog archive
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16">
        {loading && (
          <div className="border-y border-brand-border py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-text-secondary">
              Loading essay
            </p>
            <div className="mt-8 h-10 w-2/3 bg-brand-border/40" />
            <div className="mt-6 h-4 w-full max-w-xl bg-brand-border/40" />
            <div className="mt-3 h-4 w-4/5 max-w-xl bg-brand-border/40" />
          </div>
        )}

        {!loading && error && (
          <section className="border-y border-brand-border py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-status-error">
              Essay unavailable
            </p>
            <h1 className="mt-5 font-display text-4xl font-bold">This essay could not be opened.</h1>
            <p className="mt-5 max-w-2xl text-[17px] leading-[1.8] text-brand-text-secondary">{error}</p>
            <Link
              to="/blog"
              className="mt-8 inline-flex items-center gap-2 border border-brand-border px-5 py-3 text-sm font-semibold text-brand-text-secondary hover:border-brand-accent hover:text-brand-accent"
            >
              <ArrowLeft className="h-4 w-4" /> Return to blog
            </Link>
          </section>
        )}

        {!loading && post && (
          <article>
            <div className="border-b border-brand-border pb-12">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-text-secondary">
                <PenLine className="h-4 w-4" /> {post.category}
              </p>
              <h1 className="mt-6 max-w-3xl font-display text-5xl font-bold leading-tight md:text-6xl">
                {post.title}
              </h1>
              <p className="mt-7 max-w-2xl text-[20px] leading-[1.75] text-brand-text-secondary">
                {post.excerpt}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-brand-text-secondary">
                <span>By {post.authorName}</span>
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" /> {formatDate(post.publishedAt)}
                </span>
                {post.audioUrl && (() => {
                  const trackId = `blog-${post.id}`;
                  const isThisTrack = currentTrack?.id === trackId;
                  const isThisPlaying = isThisTrack && isPlaying;
                  const handleAudio = () => {
                    if (isThisTrack) {
                      togglePlayPause();
                    } else {
                      playTrack({
                        id: trackId,
                        title: post.title,
                        description: post.excerpt || '',
                        author: post.authorName,
                        coverArt: '',
                        audioUrl: post.audioUrl!,
                        duration: 0,
                        releaseDate: post.publishedAt || '',
                      });
                    }
                  };
                  return (
                    <button
                      onClick={handleAudio}
                      className="inline-flex items-center gap-2 text-brand-accent hover:underline font-semibold"
                      aria-label={isThisPlaying ? 'Pause audio' : 'Listen to this essay'}
                    >
                      {isThisPlaying
                        ? <><PauseIcon className="h-4 w-4" /> Pause</>
                        : <><PlayIcon className="h-4 w-4" /> Listen</>}
                    </button>
                  );
                })()}
              </div>
            </div>

            <div className="prose prose-stone mt-12 max-w-[680px] text-[17px] leading-[1.8] prose-headings:font-display prose-headings:text-brand-text-primary prose-p:text-brand-text-primary prose-a:text-brand-accent">
              <ReactMarkdown>{post.content || post.excerpt}</ReactMarkdown>
            </div>
          </article>
        )}
      </main>
    </div>
  );
};

export default BlogPostPage;
