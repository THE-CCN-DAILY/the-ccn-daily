import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { db } from '../firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { SpeakerWaveIcon, SparklesIcon, PlayIcon } from '../components/icons';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

interface Audiobook {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  audioUrl: string;
  createdAt: any;
}

const AudiobookLibraryPage: React.FC = () => {
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = useAudioPlayer();

  useEffect(() => {
    const fetchAudiobooks = async () => {
      try {
        const q = query(collection(db, 'audiobooks'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedBooks: Audiobook[] = [];
        querySnapshot.forEach((doc) => {
          fetchedBooks.push({ id: doc.id, ...doc.data() } as Audiobook);
        });
        setAudiobooks(fetchedBooks);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'audiobooks');
      } finally {
        setLoading(false);
      }
    };

    fetchAudiobooks();
  }, []);

  const handlePlay = (book: Audiobook) => {
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
        duration: 0, // We don't have duration in DB yet, player will calculate
        releaseDate: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-brand-text-primary mb-4">Audiobook Library</h1>
        <p className="text-xl text-brand-text-secondary">
          Listen to premium spiritual growth audiobooks on the go.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
        </div>
      ) : audiobooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {audiobooks.map((book) => {
            const isCurrentlyPlaying = currentTrack?.id === book.id && isPlaying;
            
            return (
              <Card key={book.id} className="flex flex-col border-brand-border bg-brand-dark/30 overflow-hidden p-0 group">
                <div className="relative aspect-square w-full bg-brand-secondary flex items-center justify-center overflow-hidden">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                  ) : (
                    <SpeakerWaveIcon className="w-16 h-16 text-brand-text-secondary/50" />
                  )}
                  
                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => handlePlay(book)}
                      className="w-16 h-16 rounded-full bg-brand-accent flex items-center justify-center text-white shadow-lg transform hover:scale-110 transition-transform"
                    >
                      {isCurrentlyPlaying ? (
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1.5 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1.5 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      ) : (
                        <PlayIcon className="w-8 h-8 ml-1" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-brand-text-primary mb-1 line-clamp-2">{book.title}</h3>
                  <p className="text-brand-text-secondary text-sm mb-4">{book.author}</p>
                  
                  <div className="mt-auto">
                    <button 
                      onClick={() => handlePlay(book)}
                      className="w-full py-2 bg-brand-dark border border-brand-border text-brand-text-primary rounded-lg text-sm font-bold hover:bg-brand-secondary transition-colors flex items-center justify-center"
                    >
                      {isCurrentlyPlaying ? 'Pause' : 'Listen Now'}
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-20 border-brand-border border-dashed bg-transparent">
          <SpeakerWaveIcon className="w-12 h-12 text-brand-text-secondary mx-auto mb-4" />
          <h3 className="text-xl font-bold text-brand-text-primary mb-2">Library is empty</h3>
          <p className="text-brand-text-secondary">
            No audiobooks have been uploaded yet. Check back later!
          </p>
        </Card>
      )}
    </div>
  );
};

export default AudiobookLibraryPage;
