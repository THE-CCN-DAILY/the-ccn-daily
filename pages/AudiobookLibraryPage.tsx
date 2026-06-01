import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';
import Card from '../components/Card';
import { SpeakerWaveIcon, PlayIcon, PauseIcon } from '../components/icons';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { usePremiumGate } from '../hooks/usePremiumGate';
import { listAudiobooks } from '../services/contentService';

interface Audiobook {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  audioUrl: string;
  isPremium?: boolean;
  price?: number;
  createdAt: unknown;
}

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };

const AudiobookLibraryPage: React.FC = () => {
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = useAudioPlayer();
  const { requireAccess, canAccess } = usePremiumGate();

  useEffect(() => {
    const fetchAudiobooks = async () => {
      try {
        const fetchedBooks = await listAudiobooks();
        setAudiobooks(fetchedBooks as Audiobook[]);
      } catch {
        // Library may be empty on first load — silent fail is appropriate
      } finally {
        setLoading(false);
      }
    };

    fetchAudiobooks();
  }, []);

  const handlePlay = (book: Audiobook) => {
    // Premium gate: blocks playback of premium titles for non-admins until the
    // purchase flow is live (opens the upgrade modal instead).
    if (!requireAccess(book.isPremium, book.title)) return;
    if (currentTrack?.id === book.id) {
      togglePlayPause();
    } else {
      playTrack({
        id: book.id,
        title: book.title,
        description: `By ${book.author}`,
        author: book.author,
        coverArt: book.coverUrl || '',
        audioUrl: book.audioUrl,
        duration: 0,
        releaseDate: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      {/* Header */}
      <div className="mb-10">
        <motion.p
          className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-3"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          Audio Library
        </motion.p>
        <motion.h1
          className="text-4xl md:text-5xl font-black text-brand-text-primary mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          Listen &amp; Grow
        </motion.h1>
        <motion.p
          className="text-lg text-brand-text-secondary max-w-xl"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
        >
          Carry wisdom wherever you go. Press play and let the words work on you.
        </motion.p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent" />
        </div>
      ) : audiobooks.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          variants={stagger} initial="hidden" animate="visible"
        >
          {audiobooks.map((book) => {
            const isCurrentlyPlaying = currentTrack?.id === book.id && isPlaying;
            const isActive = currentTrack?.id === book.id;
            const locked = !canAccess(book.isPremium);

            return (
              <motion.div key={book.id} variants={fadeUp} transition={{ duration: 0.45, ease: EASE }}>
                <Card className={`flex flex-col border-brand-border bg-brand-dark/30 overflow-hidden p-0 group transition-all duration-300 ${
                  isActive ? 'ring-2 ring-brand-accent/40' : ''
                }`}>
                  {/* Cover */}
                  <div className="relative aspect-square w-full bg-brand-secondary flex items-center justify-center overflow-hidden">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-blue/30 to-secondary-purple/30">
                        <SpeakerWaveIcon className="w-16 h-16 text-brand-text-secondary/50" />
                      </div>
                    )}

                    {/* Premium lock badge */}
                    {book.isPremium && (
                      <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-brand-deep/80 text-brand-paper text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full backdrop-blur-sm">
                        <Lock className="w-3 h-3" />
                        {locked ? 'Premium' : 'Unlocked'}
                      </div>
                    )}

                    {/* Play / lock overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => handlePlay(book)}
                        aria-label={locked ? `Unlock ${book.title}` : isCurrentlyPlaying ? `Pause ${book.title}` : `Play ${book.title}`}
                        className="w-16 h-16 rounded-full bg-brand-accent flex items-center justify-center text-white shadow-lg transform hover:scale-110 transition-transform"
                      >
                        {locked
                          ? <Lock className="w-6 h-6" />
                          : isCurrentlyPlaying
                            ? <PauseIcon className="w-7 h-7" />
                            : <PlayIcon className="w-8 h-8 ml-1" />}
                      </button>
                    </div>

                    {/* Now playing chip */}
                    {isCurrentlyPlaying && (
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-brand-accent/90 text-white text-[12px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
                        <span className="flex gap-0.5">
                          <span className="w-0.5 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-0.5 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-0.5 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                        Playing
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-base font-bold text-brand-text-primary mb-1 line-clamp-2">{book.title}</h3>
                    <p className="text-brand-text-secondary text-sm mb-4">{book.author}</p>

                    <div className="mt-auto">
                      <button
                        onClick={() => handlePlay(book)}
                        className={`w-full py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                          isCurrentlyPlaying
                            ? 'bg-brand-accent text-white'
                            : 'bg-brand-dark border border-brand-border text-brand-text-primary hover:bg-brand-secondary'
                        }`}
                      >
                        {locked ? (
                          <><Lock className="w-4 h-4" /> Premium{book.price ? ` · $${book.price}` : ''}</>
                        ) : isCurrentlyPlaying ? (
                          <><PauseIcon className="w-4 h-4" /> Pause</>
                        ) : (
                          <><PlayIcon className="w-4 h-4" /> Listen</>
                        )}
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible"
          transition={{ duration: 0.5, ease: EASE }}
        >
          <Card className="text-center py-24 border-dashed border-brand-border bg-transparent">
            <SpeakerWaveIcon className="w-14 h-14 text-brand-text-secondary/40 mx-auto mb-5" />
            <h3 className="text-2xl font-bold text-brand-text-primary mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Coming Soon
            </h3>
            <p className="text-brand-text-secondary max-w-sm mx-auto">
              We're adding titles every week. Follow along — your next listen is almost here.
            </p>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default AudiobookLibraryPage;
