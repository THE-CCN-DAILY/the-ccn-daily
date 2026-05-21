import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import type { PodcastEpisode, SearchResult } from '../types';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { HeartIcon, PauseIcon, PlayIcon, SparklesIcon, SpinnerIcon } from '../components/icons';
import Card from '../components/Card';
import { fetchRSSFeed } from '../services/rssService';
import { cleanFeedText, excerptFeedText } from '../utils/feedText';

const PODCAST_FEED_URL = 'https://anchor.fm/s/f7311ecc/podcast/rss';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } } };

const parseDuration = (value?: string) => {
  if (!value) return 0;
  if (/^\d+$/.test(value)) return Number(value);
  const parts = value.split(':').map(Number);
  if (parts.some(Number.isNaN)) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
};

const formatMinutes = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  return minutes > 0 ? `${minutes} min` : 'Listen';
};

const PodcastPage: React.FC = () => {
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = useAudioPlayer();
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Recent');
  const [favorites, setFavorites] = useState<(string | number)[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);

  useEffect(() => {
    const loadEpisodes = async () => {
      setLoading(true);
      setError('');

      try {
        const feed = await fetchRSSFeed(PODCAST_FEED_URL);
        const podcastItems = feed.items
          .filter((item) => item.enclosure && item.enclosure.type.startsWith('audio'))
          .map((item, index) => ({
            id: item.guid || String(index),
            title: item.title || 'Untitled Episode',
            description: cleanFeedText(item.itunes?.summary || item.contentSnippet || item.content || ''),
            author: feed.title || 'THE CCN DAILY',
            duration: parseDuration(item.itunes?.duration),
            coverArt: item.itunes?.image || 'https://picsum.photos/seed/podcast/800/800',
            releaseDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString() : 'Unknown Date',
            audioUrl: item.enclosure?.url || '',
            isFeatured: index === 0,
            summary: cleanFeedText(item.itunes?.summary || item.contentSnippet || item.content || ''),
          }));

        setEpisodes(podcastItems as PodcastEpisode[]);
      } catch {
        setError('The podcast feed could not be loaded. Please try again shortly.');
      } finally {
        setLoading(false);
      }
    };

    loadEpisodes();
  }, []);

  const featuredEpisode = useMemo(() => episodes.find((ep) => ep.isFeatured), [episodes]);

  const toggleFavorite = (episodeId: string | number) => {
    setFavorites((prev) =>
      prev.includes(episodeId) ? prev.filter((id) => id !== episodeId) : [...prev, episodeId]
    );
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    await new Promise((resolve) => setTimeout(resolve, 400));

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = episodes
      .filter(
        (ep) =>
          ep.title.toLowerCase().includes(query) ||
          ep.description.toLowerCase().includes(query) ||
          (ep.summary && ep.summary.toLowerCase().includes(query))
      )
      .map((ep) => ({ ...ep, contextSnippet: excerptFeedText(ep.description, 160) }));

    setSearchResults(results);
    setIsSearching(false);
  };

  const displayedEpisodes = useMemo(() => {
    if (searchResults !== null) return [];
    return activeTab === 'Favorites'
      ? episodes.filter((ep) => favorites.includes(ep.id))
      : episodes;
  }, [activeTab, favorites, searchResults, episodes]);

  const playEpisode = (episode: PodcastEpisode) => {
    if (currentTrack?.id === episode.id) {
      togglePlayPause();
    } else {
      playTrack(episode);
    }
  };

  /* ─── Compact episode row (Spotify-style) ─────────────────────────── */
  const EpisodeRow: React.FC<{ episode: PodcastEpisode }> = ({ episode }) => {
    const isCurrentlyPlaying = currentTrack?.id === episode.id && isPlaying;
    const isActive = currentTrack?.id === episode.id;
    const isFavorited = favorites.includes(episode.id);

    return (
      <div
        className={`group flex items-center gap-4 px-3 py-2.5 rounded-xl transition-colors ${
          isActive ? 'bg-brand-accent/10' : 'hover:bg-brand-secondary'
        }`}
      >
        {/* Thumbnail */}
        <div className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-brand-secondary">
          <img src={episode.coverArt} alt="" className="w-full h-full object-cover" />
          <button
            onClick={() => playEpisode(episode)}
            aria-label={isCurrentlyPlaying ? 'Pause' : `Play ${episode.title}`}
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isCurrentlyPlaying
              ? <PauseIcon className="w-5 h-5 text-white" />
              : <PlayIcon className="w-5 h-5 text-white" />}
          </button>
        </div>

        {/* Meta */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${isActive ? 'text-brand-accent' : 'text-brand-text-primary'}`}>
            {episode.title}
          </p>
          <p className="text-xs text-brand-text-secondary mt-0.5 truncate">
            {episode.releaseDate} · {formatMinutes(episode.duration)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => toggleFavorite(episode.id)}
            aria-label={isFavorited ? 'Remove from saved' : 'Save episode'}
            className="p-2 rounded-full text-brand-text-secondary hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          >
            <HeartIcon className={`w-4 h-4 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
          </button>
          <button
            onClick={() => playEpisode(episode)}
            aria-label={isCurrentlyPlaying ? 'Pause' : `Play ${episode.title}`}
            className={`p-2 rounded-full transition-colors ${
              isCurrentlyPlaying
                ? 'text-brand-accent'
                : 'text-brand-text-secondary hover:text-brand-text-primary opacity-0 group-hover:opacity-100'
            }`}
          >
            {isCurrentlyPlaying
              ? <PauseIcon className="w-5 h-5" />
              : <PlayIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    );
  };

  /* ─── Search result row ───────────────────────────────────────────── */
  const SearchResultRow: React.FC<{
    item: SearchResult;
    isFavorited: boolean;
    onToggleFavorite: () => void;
  }> = ({ item, isFavorited, onToggleFavorite }) => (
    <div className="group flex items-start gap-4 px-3 py-3 rounded-xl hover:bg-brand-secondary transition-colors">
      <div className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-brand-secondary">
        <img src={item.coverArt} alt="" className="w-full h-full object-cover" />
        <button
          onClick={() => playTrack(item)}
          aria-label={`Play ${item.title}`}
          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <PlayIcon className="w-5 h-5 text-white" />
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-text-primary truncate">{item.title}</p>
        <p className="text-xs text-brand-text-secondary mt-0.5">{item.releaseDate}</p>
        <p className="text-xs text-brand-text-secondary mt-1 line-clamp-2 italic">"{item.contextSnippet}"</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onToggleFavorite}
          aria-label={isFavorited ? 'Remove from saved' : 'Save episode'}
          className="p-2 rounded-full text-brand-text-secondary hover:text-red-400 transition-colors"
        >
          <HeartIcon className={`w-4 h-4 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
        </button>
        <button
          onClick={() => playTrack(item)}
          className="p-2 rounded-full text-brand-text-secondary hover:text-brand-text-primary transition-colors"
          aria-label={`Play ${item.title}`}
        >
          <PlayIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div className="py-16 text-center">
      <p className="text-brand-text-secondary">{message}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20">

      {/* Header */}
      <header className="mb-8 border-b border-brand-border pb-6">
        <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-brand-text-secondary">
          <Link to="/" className="hover:text-brand-accent transition-colors">THE CCN DAILY</Link>
          <Link to="/newsletter" className="hover:text-brand-accent transition-colors">Newsletter</Link>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2">Listen</p>
        <motion.h1
          className="text-3xl font-black text-brand-text-primary"
          style={{ fontFamily: 'var(--font-display)' }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          Podcast Library
        </motion.h1>
        <motion.p
          className="mt-2 text-brand-text-secondary"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
        >
          Formation for commutes, walks, and quiet moments.
        </motion.p>
      </header>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative mb-8">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!e.target.value.trim()) setSearchResults(null);
          }}
          placeholder="Search episodes..."
          className="w-full rounded-full border border-brand-border bg-brand-secondary py-2.5 pl-10 pr-4 text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
        <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      </form>

      {/* Loading */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loading"
            className="flex flex-col items-center justify-center py-24"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <SpinnerIcon className="mb-4 h-9 w-9 animate-spin text-brand-accent" />
            <p className="animate-pulse text-sm text-brand-text-secondary">Loading episodes…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-status-warning/40 bg-status-warning/10 p-5 text-sm text-brand-text-secondary">
          {error}
        </div>
      )}

      {/* Searching */}
      {!loading && !error && isSearching && (
        <div className="flex items-center justify-center py-12">
          <SpinnerIcon className="h-7 w-7 animate-spin text-brand-accent" />
          <p className="ml-3 text-sm text-brand-text-secondary">Searching…</p>
        </div>
      )}

      {/* Search Results */}
      {!loading && !error && searchResults !== null && !isSearching && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ duration: 0.4, ease: EASE }}>
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-brand-text-primary">
            <SparklesIcon className="h-4 w-4 text-brand-accent" />
            Results for &ldquo;{searchQuery}&rdquo;
          </h2>
          {searchResults.length > 0 ? (
            <div className="divide-y divide-brand-border/50">
              {searchResults.map((item) => (
                <SearchResultRow
                  key={item.id}
                  item={item}
                  isFavorited={favorites.includes(item.id)}
                  onToggleFavorite={() => toggleFavorite(item.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState message={`No results for "${searchQuery}". Try another topic.`} />
          )}
        </motion.div>
      )}

      {/* Main list */}
      {!loading && !error && searchResults === null && !isSearching && (
        <>
          {/* Featured episode */}
          {activeTab === 'Recent' && featuredEpisode && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="mb-8"
            >
              <Card className="overflow-hidden p-0">
                <div className="md:flex">
                  <div className="relative md:w-2/5 flex-shrink-0">
                    <img
                      src={featuredEpisode.coverArt}
                      alt={featuredEpisode.title}
                      className="h-52 w-full object-cover md:h-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <button
                        onClick={() => playEpisode(featuredEpisode)}
                        aria-label="Play latest episode"
                        className="w-14 h-14 rounded-full bg-brand-accent flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform"
                      >
                        {currentTrack?.id === featuredEpisode.id && isPlaying
                          ? <PauseIcon className="w-6 h-6" />
                          : <PlayIcon className="w-6 h-6 ml-0.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center p-6">
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2">Latest Episode</span>
                    <h2 className="mb-2 text-xl font-bold text-brand-text-primary leading-snug">{featuredEpisode.title}</h2>
                    <p className="mb-3 text-xs text-brand-text-secondary">
                      {featuredEpisode.author} · {featuredEpisode.releaseDate} · {formatMinutes(featuredEpisode.duration)}
                    </p>
                    <p className="text-sm text-brand-text-secondary line-clamp-3">
                      {excerptFeedText(featuredEpisode.description, 220)}
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={() => playEpisode(featuredEpisode)}
                        className="flex items-center gap-2 rounded-full bg-brand-accent px-5 py-2 text-sm font-semibold text-white"
                      >
                        <PlayIcon className="h-4 w-4" /> Listen
                      </button>
                      <button
                        onClick={() => toggleFavorite(featuredEpisode.id)}
                        aria-label={favorites.includes(featuredEpisode.id) ? 'Remove from saved' : 'Save episode'}
                        className="rounded-full p-2 text-brand-text-secondary hover:bg-brand-secondary hover:text-brand-text-primary transition-colors"
                      >
                        <HeartIcon className={`h-5 w-5 ${favorites.includes(featuredEpisode.id) ? 'fill-current text-red-500' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Tabs */}
          <div className="mb-4 flex items-center gap-1 border-b border-brand-border">
            {['Recent', 'Favorites'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-sm font-semibold transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-brand-accent text-brand-accent -mb-px'
                    : 'text-brand-text-secondary hover:text-brand-text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Episode list */}
          {displayedEpisodes.length > 0 ? (
            <motion.div
              key={activeTab}
              variants={stagger} initial="hidden" animate="visible"
              className="space-y-0.5"
            >
              {displayedEpisodes.map((episode) => (
                <motion.div key={episode.id} variants={fadeUp} transition={{ duration: 0.35, ease: EASE }}>
                  <EpisodeRow episode={episode} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <EmptyState
              message={
                activeTab === 'Favorites'
                  ? "Nothing saved yet. Tap the heart on any episode to save it."
                  : 'No episodes available yet.'
              }
            />
          )}
        </>
      )}
    </div>
  );
};

export default PodcastPage;
