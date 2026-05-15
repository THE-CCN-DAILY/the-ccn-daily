// Forcing a full application rebuild to clear the preview cache.
import React, { useState, useMemo, useEffect } from 'react';
import type { PodcastEpisode, SearchResult } from '../types';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { PlayIcon, PauseIcon, DownloadIcon, ChevronLeftIcon, HeartIcon, SparklesIcon, SpinnerIcon, MicrophoneIcon } from '../components/icons';
import Card from '../components/Card';
import { fetchRSSFeed } from '../services/rssService';

const PODCAST_FEED_URL = 'https://anchor.fm/s/f7311ecc/podcast/rss';

const parseDuration = (value?: string) => {
    if (!value) return 0;
    if (/^\d+$/.test(value)) return Number(value);
    const parts = value.split(':').map(Number);
    if (parts.some(Number.isNaN)) return 0;
    return parts.reduce((total, part) => total * 60 + part, 0);
};

const PodcastPage: React.FC = () => {
    const { playTrack, currentTrack, isPlaying, togglePlayPause } = useAudioPlayer();
    const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Recent');
    const [favorites, setFavorites] = useState<(string | number)[]>([]);
    const [downloads] = useState<(string | number)[]>([]);
    
    // State for Thematic Search
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);

    useEffect(() => {
        const loadEpisodes = async () => {
            try {
                const feed = await fetchRSSFeed(PODCAST_FEED_URL);
                
                const podcastItems = feed.items
                    .filter(item => item.enclosure && item.enclosure.type.startsWith('audio'))
                    .map((item, index) => ({
                        id: item.guid || String(index),
                        title: item.title || 'Untitled Episode',
                        description: item.contentSnippet || item.content || '',
                        author: 'THE CCN DAILY',
                        duration: parseDuration(item.itunes?.duration),
                        coverArt: item.itunes?.image || 'https://picsum.photos/seed/podcast/800/800',
                        releaseDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString() : 'Unknown Date',
                        audioUrl: item.enclosure?.url || '',
                        isFeatured: index === 0,
                        summary: item.itunes?.summary || item.contentSnippet,
                    }));

                setEpisodes(podcastItems as PodcastEpisode[]);
            } catch (error) {
                console.error("Failed to load podcast episodes:", error);
            } finally {
                setLoading(false);
            }
        };

        loadEpisodes();
    }, []);

    const featuredEpisode = useMemo(() => episodes.find(e => e.isFeatured), [episodes]);

    
    const toggleFavorite = (episodeId: string | number) => {
        setFavorites(prev => 
            prev.includes(episodeId) 
                ? prev.filter(id => id !== episodeId)
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
        // Simulate AI search processing time
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const query = searchQuery.toLowerCase();
        const results: SearchResult[] = episodes
            .filter(episode => 
                episode.title.toLowerCase().includes(query) || 
                episode.description.toLowerCase().includes(query) ||
                (episode.summary && episode.summary.toLowerCase().includes(query))
            )
            .map(episode => ({
                ...episode,
                contextSnippet: episode.description.substring(0, 160) + '...'
            }));

        setSearchResults(results);
        setIsSearching(false);
    };

    const displayedEpisodes = useMemo(() => {
        if (searchResults !== null) return []; // Don't show tab content when search is active

        switch (activeTab) {
            case 'Favorites':
                return episodes.filter(e => favorites.includes(e.id));
            case 'Downloaded':
                return episodes.filter(e => downloads.includes(e.id));
            case 'Recent':
            default:
                return episodes;
        }
    }, [activeTab, favorites, downloads, searchResults, episodes]);


    const EpisodeListItem: React.FC<{ episode: PodcastEpisode }> = ({ episode }) => {
        const isCurrentlyPlaying = currentTrack?.id === episode.id && isPlaying;
        const isFavorited = favorites.includes(episode.id);

        const handlePlayClick = () => {
            if(currentTrack?.id === episode.id) {
                togglePlayPause();
            } else {
                playTrack(episode);
            }
        }
        
        return (
            <Card className="flex flex-col">
                {isCurrentlyPlaying && <span className="text-xs font-bold text-brand-gold uppercase tracking-wider mb-2">Now Playing</span>}
                <h3 className="text-lg font-bold text-brand-text-primary">{episode.title}</h3>
                <p className="text-xs text-brand-text-secondary mb-2">{episode.releaseDate} &middot; {Math.floor(episode.duration / 60)} min</p>
                <p className="text-sm text-brand-text-secondary flex-grow mb-4">{episode.description}</p>
                <div className="flex items-center justify-between mt-auto">
                    <button onClick={handlePlayClick} className="flex items-center gap-2 px-4 py-2 text-sm rounded-full bg-brand-gold text-brand-dark font-semibold">
                        {isCurrentlyPlaying ? <><PauseIcon className="w-4 h-4" /> Pause</> : <><PlayIcon className="w-4 h-4" /> Play</>}
                    </button>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => toggleFavorite(episode.id)} className="p-2 text-brand-text-secondary hover:text-brand-text-primary rounded-full hover:bg-brand-secondary">
                           <HeartIcon className={`w-5 h-5 ${isFavorited ? 'text-red-500 fill-current' : ''}`}/>
                        </button>
                        <button className="p-2 text-brand-text-secondary hover:text-brand-text-primary rounded-full hover:bg-brand-secondary"><DownloadIcon className="w-5 h-5"/></button>
                    </div>
                </div>
            </Card>
        );
    }
    
    const SearchResultItem: React.FC<{ item: SearchResult; isFavorited: boolean; onToggleFavorite: () => void; }> = ({ item, isFavorited, onToggleFavorite }) => (
        <Card className="flex flex-col">
            <h3 className="text-lg font-bold text-brand-text-primary">{item.title}</h3>
            <p className="text-xs text-brand-text-secondary mb-3">{item.releaseDate}</p>
            <div className="border-l-4 border-brand-accent pl-3 mb-4">
                <p className="text-sm italic text-brand-text-secondary">"...{item.contextSnippet}..."</p>
            </div>
            <div className="flex items-center justify-between mt-auto">
                <button onClick={() => playTrack(item)} className="flex items-center gap-2 px-4 py-2 text-sm rounded-full bg-brand-gold text-brand-dark font-semibold">
                    <PlayIcon className="w-4 h-4" /> Play
                </button>
                <div className="flex items-center space-x-2">
                    <button onClick={onToggleFavorite} className="p-2 text-brand-text-secondary hover:text-brand-text-primary rounded-full hover:bg-brand-secondary">
                        <HeartIcon className={`w-5 h-5 ${isFavorited ? 'text-red-500 fill-current' : ''}`}/>
                    </button>
                    <button className="p-2 text-brand-text-secondary hover:text-brand-text-primary rounded-full hover:bg-brand-secondary"><DownloadIcon className="w-5 h-5"/></button>
                </div>
            </div>
        </Card>
    );

    const EmptyState: React.FC<{ message: string }> = ({ message }) => (
        <div className="text-center py-12">
            <p className="text-brand-text-secondary">{message}</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <header className="flex items-center mb-6">
                <ChevronLeftIcon className="w-6 h-6 mr-4"/>
                <h1 className="text-2xl font-bold text-brand-text-primary">THE CCN DAILY</h1>
            </header>

            <form onSubmit={handleSearch} className="relative mb-6">
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for topics inside episodes..." 
                    className="w-full bg-brand-dark border border-brand-border rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            </form>
            
            {/* Search Results View */}
            {loading && (
                <div className="flex flex-col justify-center items-center py-24">
                    <SpinnerIcon className="w-10 h-10 text-brand-accent animate-spin mb-4"/>
                    <p className="text-brand-text-secondary animate-pulse">Syncing with THE CCN DAILY Feed...</p>
                </div>
            )}

            {!loading && isSearching && (
                <div className="flex justify-center items-center py-12">
                    <SpinnerIcon className="w-8 h-8 text-brand-accent"/>
                    <p className="ml-4 text-brand-text-secondary">Searching transcripts...</p>
                </div>
            )}
            {searchResults !== null && !isSearching && (
                 <div>
                    <h2 className="text-xl font-bold text-brand-text-primary mb-4 flex items-center">
                        <SparklesIcon className="w-5 h-5 mr-2 text-brand-accent"/>
                        Thematic Search Results for "{searchQuery}"
                    </h2>
                    {searchResults.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {searchResults.map(item => <SearchResultItem 
                                key={item.id} 
                                item={item} 
                                isFavorited={favorites.includes(item.id)}
                                onToggleFavorite={() => toggleFavorite(item.id)}
                            />)}
                        </div>
                    ) : (
                        <EmptyState message={`No results found for "${searchQuery}". Try another topic.`} />
                    )}
                </div>
            )}

            {/* Default Tabbed View */}
            {!loading && searchResults === null && !isSearching && (
            <>
                <div className="flex items-center space-x-4 border-b border-brand-border mb-6">
                    {['Recent', 'Favorites', 'Downloaded'].map(tab => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab)}
                            className={`py-2 px-1 text-sm font-semibold transition-colors ${activeTab === tab ? 'text-brand-gold border-b-2 border-brand-gold' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                
                {activeTab === 'Recent' && featuredEpisode && (
                     <Card className="mb-8 p-0 overflow-hidden">
                        <div className="md:flex">
                            <img src={featuredEpisode.coverArt} alt={featuredEpisode.title} className="w-full md:w-1/3 h-48 md:h-auto object-cover"/>
                            <div className="p-6 flex flex-col justify-center">
                                <h2 className="text-2xl font-bold text-brand-gold mb-1">{featuredEpisode.title}</h2>
                                <p className="text-sm text-brand-text-secondary mb-2">{featuredEpisode.author} &middot; {featuredEpisode.releaseDate}</p>
                                <p className="text-brand-text-secondary mb-4">{featuredEpisode.description}</p>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => playTrack(featuredEpisode)} className="flex items-center justify-center gap-2 self-start px-6 py-2 rounded-full bg-brand-gold text-brand-dark font-semibold">
                                       <PlayIcon className="w-5 h-5"/>
                                       Listen
                                    </button>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => toggleFavorite(featuredEpisode.id)} className="p-2 text-brand-text-secondary hover:text-brand-text-primary rounded-full hover:bg-brand-secondary">
                                           <HeartIcon className={`w-5 h-5 ${favorites.includes(featuredEpisode.id) ? 'text-red-500 fill-current' : ''}`}/>
                                        </button>
                                        <button className="p-2 text-brand-text-secondary hover:text-brand-text-primary rounded-full hover:bg-brand-secondary"><DownloadIcon className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                <h2 className="text-xl font-bold text-brand-text-primary mb-4">{activeTab} Episodes</h2>
                {displayedEpisodes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {displayedEpisodes.map(episode => <EpisodeListItem key={episode.id} episode={episode} />)}
                    </div>
                ) : (
                     <EmptyState message={
                         activeTab === 'Favorites' 
                         ? "You haven't favorited any episodes yet. Tap the heart icon to add one."
                         : "You have no downloaded episodes."
                     } />
                )}
            </>
            )}
        </div>
    );
};

export default PodcastPage;
