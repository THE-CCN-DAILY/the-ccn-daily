// Forcing a full application rebuild to clear the preview cache.
import React, { useState, useMemo } from 'react';
import type { PodcastEpisode, SearchResult } from '../types';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { PlayIcon, PauseIcon, DownloadIcon, ChevronLeftIcon, HeartIcon, SparklesIcon, SpinnerIcon } from '../components/icons';
import Card from '../components/Card';

const podcastData: PodcastEpisode[] = [
    {
        id: 1,
        title: 'Holy Ambition: Pursuing God-Given Desires',
        description: 'Do you struggle with knowing and pursuing what you truly want in life? In our latest Devotion In Season podcast, we explore how to discern and chase after holy ambition.',
        author: 'THE CCN DAILY',
        duration: 167, // duration in seconds
        coverArt: 'https://picsum.photos/seed/ambition/500/500',
        releaseDate: 'Feb 28, 2024',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        isFeatured: true,
        summary: 'This episode explores the concept of "holy ambition," differentiating it from worldly ambition. It provides a framework for listeners to discern whether their personal desires align with God\'s will, using biblical examples to illustrate how to pursue God-given dreams with faith and integrity, rather than striving for personal glory.',
        keyTakeaways: [
            'Holy ambition is rooted in a desire to glorify God, not oneself.',
            'Discernment through prayer and scripture is key to identifying God-given desires.',
            'Patience and faithfulness in small things are prerequisites for pursuing larger callings.',
            'True success is measured by obedience, not by worldly metrics of achievement.'
        ],
        transcript: [
            { time: 0, text: "Welcome to Devotion In Season. Today, we delve into a powerful concept: holy ambition." },
            { time: 5, text: "It's a term that might seem contradictory at first. 'Ambition' often carries worldly connotations of power and success." },
            { time: 12, text: "But what if ambition could be sanctified? What if our deepest desires could be aligned with God's purpose for our lives?" },
            { time: 20, text: "Let's first distinguish between worldly ambition and holy ambition. Worldly ambition seeks personal glory. It asks, 'What can I achieve for myself?'" },
            { time: 29, text: "Holy ambition, on the other hand, is rooted in a desire to glorify God. It asks, 'What can God achieve through me?'" },
            { time: 37, text: "Think of Nehemiah. He had a prestigious job as the king's cupbearer, yet his heart broke for the ruined walls of Jerusalem." },
            { time: 45, text: "His ambition was not for a higher position, but to see God's city restored. That is holy ambition." },
            { time: 53, text: "So, how do we cultivate this in our own lives? The first step is discernment through prayer and scripture." },
            { time: 60, text: "We must bring our desires before God, asking Him to purify our motives and align our will with His." },
            { time: 67, text: "The Bible is our guide. As we immerse ourselves in God's word, our desires begin to reflect His character and priorities." },
            { time: 75, text: "Secondly, holy ambition requires patience and faithfulness in the small things. God often tests our character in obscurity before entrusting us with greater responsibility." },
            { time: 85, text: "Before David faced Goliath, he was a faithful shepherd, protecting his flock from lions and bears." },
            { time: 92, text: "His faithfulness in the pasture prepared him for the throne. Your current season is a training ground for your future calling." },
            { time: 100, text: "Finally, remember that true success in God's kingdom is measured by obedience, not by worldly metrics." },
            { time: 108, text: "Some of the greatest heroes of faith never saw the full fruit of their labor in their lifetime. Their reward was in their faithfulness to God's call." },
            { time: 118, text: "So, what is the holy ambition God is stirring in your heart today? Is it to mentor a younger believer? To start a ministry in your community?" },
            { time: 127, text: "Is it to bring excellence and integrity to your workplace? Or to raise your children to love the Lord?" },
            { time: 135, text: "Whatever it is, pursue it with courage, knowing that if it is from God, He will equip you for the journey." },
            { time: 143, text: "Let's pray. Father, we surrender our ambitions to you. Purify our hearts, clarify our vision, and empower us to pursue the holy desires you have placed within us. For your glory alone. Amen." },
            { time: 155, text: "Thank you for joining us. May you walk in holy ambition this week." },
        ],
        chapters: [
            { time: 0, title: 'Introduction: Holy Ambition' },
            { time: 53, title: 'Discerning God\'s Will' },
            { time: 75, title: 'Faithfulness in Small Things' },
            { time: 143, title: 'Conclusion & Prayer' },
        ],
    },
    {
        id: 2,
        title: 'The Limits of Morality: Can good works save?',
        description: 'This episode of the Devotion In Season Podcast, delves into the question of whether being a good person is enough for salvation.',
        author: 'THE CCN DAILY',
        duration: 32 * 60,
        coverArt: 'https://picsum.photos/seed/morality/500/500',
        releaseDate: 'Oct 02, 2023',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    },
    {
        id: 3,
        title: 'Forgiveness First: Jesus\' Approach to Healing',
        description: 'In this episode of the Devotion In Season Podcast, the profound theme of healing through forgiveness is explored.',
        author: 'THE CCN DAILY',
        duration: 25 * 60,
        coverArt: 'https://picsum.photos/seed/forgiveness/500/500',
        releaseDate: 'Sep 25, 2023',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    },
    {
        id: 4,
        title: 'Finding Peace in a World of Chaos',
        description: 'Discover how to cultivate inner peace and tranquility amidst the storms of life. A message of hope and stillness.',
        author: 'THE CCN DAILY',
        duration: 35 * 60,
        coverArt: 'https://picsum.photos/seed/peace/500/500',
        releaseDate: 'Sep 18, 2023',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    },
];


const PodcastPage: React.FC = () => {
    const { playTrack, currentTrack, isPlaying, togglePlayPause } = useAudioPlayer();
    const [activeTab, setActiveTab] = useState('Recent');
    const [favorites, setFavorites] = useState<(string | number)[]>([1]);
    const [downloads] = useState<(string | number)[]>([3, 4]); // Mocked for prototype
    
    // State for Thematic Search
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);

    const featuredEpisode = podcastData.find(e => e.isFeatured);
    
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
        // --- Mock AI Search ---
        // In a real app, this would call a Gemini/Genkit flow.
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const results: SearchResult[] = [];
        const query = searchQuery.toLowerCase();

        podcastData.forEach(episode => {
            if (episode.transcript) {
                const foundLine = episode.transcript.find(line => line.text.toLowerCase().includes(query));
                if (foundLine) {
                    results.push({
                        ...episode,
                        contextSnippet: foundLine.text,
                    });
                }
            }
        });
        setSearchResults(results);
        setIsSearching(false);
    };

    const displayedEpisodes = useMemo(() => {
        if (searchResults !== null) return []; // Don't show tab content when search is active

        switch (activeTab) {
            case 'Favorites':
                return podcastData.filter(e => favorites.includes(e.id));
            case 'Downloaded':
                return podcastData.filter(e => downloads.includes(e.id));
            case 'Recent':
            default:
                return podcastData;
        }
    }, [activeTab, favorites, downloads, searchResults]);


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
                <h3 className="text-lg font-bold text-brand-text-primary">Episode {episode.id}: {episode.title}</h3>
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
            {isSearching && (
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
            {searchResults === null && !isSearching && (
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