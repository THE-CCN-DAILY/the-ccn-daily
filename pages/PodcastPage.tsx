import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import type { PodcastEpisode, SearchResult } from '../types';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { HeartIcon, PauseIcon, PlayIcon, SparklesIcon, SpinnerIcon } from '../components/icons';
import Card from '../components/Card';
import { fetchRSSFeed } from '../services/rssService';
import { cleanFeedText, excerptFeedText } from '../utils/feedText';

const PODCAST_FEED_URL = 'https://anchor.fm/s/f7311ecc/podcast/rss';

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
      } catch (error) {
        console.error('Failed to load podcast episodes:', error);
        setError('The podcast feed could not be loaded. Please try again shortly.');
      } finally {
        setLoading(false);
      }
    };

    loadEpisodes();
  }, []);

  const featuredEpisode = useMemo(() => episodes.find((episode) => episode.isFeatured), [episodes]);

  const toggleFavorite = (episodeId: string | number) => {
    setFavorites((prev) =>
      prev.includes(episodeId)
        ? prev.filter((id) => id !== episodeId)
        : [...prev, episodeId]
    );
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = episodes
      .filter((episode) =>
        episode.title.toLowerCase().includes(query) ||
        episode.description.toLowerCase().includes(query) ||
        (episode.summary && episode.summary.toLowerCase().includes(query))
      )
      .map((episode) => ({
        ...episode,
        contextSnippet: excerptFeedText(episode.description, 160),
      }));

    setSearchResults(results);
    setIsSearching(false);
  };

  const displayedEpisodes = useMemo(() => {
    if (searchResults !== null) return [];
    return activeTab === 'Favorites'
      ? episodes.filter((episode) => favorites.includes(episode.id))
      : episodes;
  }, [activeTab, favorites, searchResults, episodes]);

  const playEpisode = (episode: PodcastEpisode) => {
    if (currentTrack?.id === episode.id) {
      togglePlayPause();
    } else {
      playTrack(episode);
    }
  };

  const EpisodeListItem: React.FC<{ episode: PodcastEpisode }> = ({ episode }) => {
    const isCurrentlyPlaying = currentTrack?.id === episode.id && isPlaying;
    const isFavorited = favorites.includes(episode.id);

    return (
      <Card className="flex flex-col">
        {isCurrentlyPlaying && (
          <span className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-gold">Now Playing</span>
        )}
        <h3 className="text-lg font-bold text-brand-text-primary">{episode.title}</h3>
        <p className="mb-2 text-xs text-brand-text-secondary">
          {episode.releaseDate} &middot; {formatMinutes(episode.duration)}
        </p>
        <p className="mb-4 flex-grow text-sm text-brand-text-secondary">
          {excerptFeedText(episode.description)}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <button
            onClick={() => playEpisode(episode)}
            className="flex items-center gap-2 rounded-full bg-brand-gold px-4 py-2 text-sm font-semibold text-brand-dark"
          >
            {isCurrentlyPlaying ? (
              <>
                <PauseIcon className="h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4" /> Play
              </>
            )}
          </button>
          <button
            onClick={() => toggleFavorite(episode.id)}
            className="rounded-full p-2 text-brand-text-secondary hover:bg-brand-secondary hover:text-brand-text-primary"
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <HeartIcon className={`h-5 w-5 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
          </button>
        </div>
      </Card>
    );
  };

  const SearchResultItem: React.FC<{ item: SearchResult; isFavorited: boolean; onToggleFavorite: () => void }> = ({
    item,
    isFavorited,
    onToggleFavorite,
  }) => (
    <Card className="flex flex-col">
      <h3 className="text-lg font-bold text-brand-text-primary">{item.title}</h3>
      <p className="mb-3 text-xs text-brand-text-secondary">{item.releaseDate}</p>
      <div className="mb-4 border-l-4 border-brand-accent pl-3">
        <p className="text-sm italic text-brand-text-secondary">"{item.contextSnippet}"</p>
      </div>
      <div className="mt-auto flex items-center justify-between">
        <button
          onClick={() => playTrack(item)}
          className="flex items-center gap-2 rounded-full bg-brand-gold px-4 py-2 text-sm font-semibold text-brand-dark"
        >
          <PlayIcon className="h-4 w-4" /> Play
        </button>
        <button
          onClick={onToggleFavorite}
          className="rounded-full p-2 text-brand-text-secondary hover:bg-brand-secondary hover:text-brand-text-primary"
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <HeartIcon className={`h-5 w-5 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
        </button>
      </div>
    </Card>
  );

  const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div className="border-y border-brand-border py-12 text-center">
      <p className="text-brand-text-secondary">{message}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20">
      <header className="mb-6 border-b border-brand-border pb-5">
        <div className="mb-3 flex items-center justify-between text-sm font-semibold text-brand-text-secondary">
          <Link to="/" className="hover:text-brand-accent">THE CCN DAILY</Link>
          <Link to="/newsletter" className="hover:text-brand-accent">Newsletter</Link>
        </div>
        <motion.h1
          className="font-display text-3xl font-bold leading-tight text-brand-text-primary"
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >Podcasts</motion.h1>
      </header>

      <form onSubmit={handleSearch} className="relative mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for topics inside episodes..."
          className="w-full rounded-full border border-brand-border bg-brand-dark py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
        <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      </form>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <SpinnerIcon className="mb-4 h-10 w-10 animate-spin text-brand-accent" />
          <p className="animate-pulse text-brand-text-secondary">Syncing with THE CCN DAILY feed...</p>
        </div>
      )}

      {!loading && error && (
        <div className="border border-status-warning/40 bg-status-warning/10 p-5 text-sm text-brand-text-secondary">
          {error}
        </div>
      )}

      {!loading && !error && isSearching && (
        <div className="flex items-center justify-center py-12">
          <SpinnerIcon className="h-8 w-8 text-brand-accent" />
          <p className="ml-4 text-brand-text-secondary">Searching episodes...</p>
        </div>
      )}

      {!loading && !error && searchResults !== null && !isSearching && (
        <div>
          <h2 className="mb-4 flex items-center text-xl font-bold text-brand-text-primary">
            <SparklesIcon className="mr-2 h-5 w-5 text-brand-accent" />
            Thematic Search Results for "{searchQuery}"
          </h2>
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {searchResults.map((item) => (
                <SearchResultItem
                  key={item.id}
                  item={item}
                  isFavorited={favorites.includes(item.id)}
                  onToggleFavorite={() => toggleFavorite(item.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState message={`No results found for "${searchQuery}". Try another topic.`} />
          )}
        </div>
      )}

      {!loading && !error && searchResults === null && !isSearching && (
        <>
          <div className="mb-6 flex items-center space-x-4 border-b border-brand-border">
            {['Recent', 'Favorites'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-1 py-2 text-sm font-semibold transition-colors ${activeTab === tab ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Recent' && featuredEpisode && (
            <Card className="mb-8 overflow-hidden p-0">
              <div className="md:flex">
                <img src={featuredEpisode.coverArt} alt={featuredEpisode.title} className="h-48 w-full object-cover md:h-auto md:w-1/3" />
                <div className="flex flex-col justify-center p-6">
                  <h2 className="mb-1 text-2xl font-bold text-brand-gold">{featuredEpisode.title}</h2>
                  <p className="mb-2 text-sm text-brand-text-secondary">
                    {featuredEpisode.author} &middot; {featuredEpisode.releaseDate}
                  </p>
                  <p className="mb-4 text-brand-text-secondary">{excerptFeedText(featuredEpisode.description, 320)}</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => playEpisode(featuredEpisode)}
                      className="flex items-center justify-center gap-2 self-start rounded-full bg-brand-gold px-6 py-2 font-semibold text-brand-dark"
                    >
                      <PlayIcon className="h-5 w-5" />
                      Listen
                    </button>
                    <button
                      onClick={() => toggleFavorite(featuredEpisode.id)}
                      className="rounded-full p-2 text-brand-text-secondary hover:bg-brand-secondary hover:text-brand-text-primary"
                      aria-label={favorites.includes(featuredEpisode.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <HeartIcon className={`h-5 w-5 ${favorites.includes(featuredEpisode.id) ? 'fill-current text-red-500' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <h2 className="mb-4 text-xl font-bold text-brand-text-primary">{activeTab} Episodes</h2>
          {displayedEpisodes.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 gap-6 md:grid-cols-2"
              variants={stagger} initial="hidden" animate="visible"
            >
              {displayedEpisodes.map((episode) => (
                <motion.div key={episode.id} variants={fadeUp} transition={{ duration: 0.45, ease: EASE }}>
                  <EpisodeListItem episode={episode} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <EmptyState
              message={
                activeTab === 'Favorites'
                  ? "You haven't favorited any episodes yet. Tap the heart icon to add one."
                  : 'No podcast episodes are available from the feed yet.'
              }
            />
          )}
        </>
      )}
    </div>
  );
};

export default PodcastPage;
