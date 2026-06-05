import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, Download, Headphones, ShoppingBag, ExternalLink } from 'lucide-react';
import Card from '../components/Card';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { getBook } from '../services/booksService';
import type { Book, BookVariant } from '../types';

// POD platform display config
const POD_PLATFORMS: Record<string, { name: string; color: string }> = {
  amazon_kdp:    { name: 'Amazon',          color: '#FF9900' },
  apple_books:   { name: 'Apple Books',     color: '#FC3C44' },
  google_play:   { name: 'Google Play',     color: '#4285F4' },
  kobo:          { name: 'Kobo',            color: '#D32F2F' },
  barnes_noble:  { name: 'Barnes & Noble',  color: '#007240' },
  draft2digital: { name: 'Draft2Digital',   color: '#2196F3' },
  smashwords:    { name: 'Smashwords',      color: '#E91E63' },
  lulu:          { name: 'Lulu',            color: '#0097A7' },
  ingramspark:   { name: 'IngramSpark',     color: '#D4AF37' },
  bookbaby:      { name: 'BookBaby',        color: '#6B3FA0' },
  custom:        { name: 'Other',           color: '#666' },
};

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

type Mode = 'info' | 'reading' | 'listening';

const BookReaderPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeVariant, setActiveVariant] = useState<BookVariant | null>(null);
  const [mode, setMode] = useState<Mode>('info');
  const { playTrack } = useAudioPlayer();

  useEffect(() => {
    if (!bookId) return;
    getBook(bookId).then(b => {
      setBook(b);
      if (b) {
        const firstDigital = b.variants.find(v => v.type === 'ebook' || v.type === 'audiobook');
        setActiveVariant(firstDigital ?? null);
      }
    }).finally(() => setLoading(false));
  }, [bookId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-pulse text-brand-text-secondary">Loading book…</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-brand-text-secondary">Book not found.</p>
        <Link to="/app/books" className="mt-4 inline-block text-brand-accent hover:underline">
          Back to Library
        </Link>
      </div>
    );
  }

  const ebookVariants = book.variants.filter(v => v.type === 'ebook' || v.type === 'translation');
  const audiobookVariants = book.variants.filter(v => v.type === 'audiobook');
  const printVariants = book.variants.filter(v => v.type === 'print');

  const handleStartReading = (variant: BookVariant) => {
    setActiveVariant(variant);
    setMode('reading');
  };

  const handleStartListening = (variant: BookVariant) => {
    setActiveVariant(variant);
    if (variant.fileUrl) {
      playTrack({
        id: `${book.id}-${variant.id}`,
        title: book.title + (variant.language ? ` (${variant.languageName})` : ''),
        description: `By ${book.author}`,
        author: book.author,
        coverArt: book.coverUrl ?? '',
        audioUrl: variant.fileUrl,
        duration: 0,
        releaseDate: book.createdAt ?? '',
      });
      setMode('listening');
    }
  };
  if (mode === 'reading' && activeVariant?.fileUrl) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <Card className="text-center">
          <button
            onClick={() => setMode('info')}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-brand-text-secondary transition-colors hover:text-brand-accent"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Book
          </button>
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-brand-accent" />
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-accent">Reader</p>
          <h1 className="mb-3 text-3xl font-semibold text-brand-text-primary" style={{ fontFamily: 'var(--serif-display)' }}>{book.title}</h1>
          <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-brand-text-secondary">
            This edition is hosted as a file. Open it in your browser or download it for quiet reading on your preferred device.
          </p>
          <a
            href={activeVariant.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-accent px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            Open Edition
          </a>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4">
      {/* Back nav */}
      <div className="mb-6">
        <Link
          to="/app/books"
          className="flex items-center gap-1.5 text-sm text-brand-text-secondary hover:text-brand-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> All Books
        </Link>
      </div>

      {/* Book header */}
      <motion.div
        className="flex gap-6 mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        {/* Cover */}
        <div className="flex-shrink-0 w-36 rounded-xl overflow-hidden shadow-lg bg-brand-secondary">
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} className="w-full object-cover" />
          ) : (
            <div className="aspect-[3/4] flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-brand-text-secondary opacity-30" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{ fontFamily: 'var(--sans-ui)', color: 'var(--ember, #C23B1E)' }}
          >
            {book.category}
          </p>
          <h1
            className="text-3xl font-black text-brand-text-primary mb-1"
            style={{ fontFamily: 'var(--serif-display)' }}
          >
            {book.title}
          </h1>
          {book.subtitle && (
            <p className="text-base text-brand-text-secondary italic mb-1">{book.subtitle}</p>
          )}
          <p className="text-sm text-brand-text-secondary mb-3">by {book.author}</p>
          <p className="text-sm text-brand-text-secondary leading-relaxed">{book.description}</p>
        </div>
      </motion.div>

      <div className="space-y-6">
        {/* Ebook / Translation variants */}
        {ebookVariants.length > 0 && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5" style={{ color: 'var(--ember, #C23B1E)' }} />
              <h2
                className="font-bold text-brand-text-primary"
                style={{ fontFamily: 'var(--serif-display)' }}
              >
                Read this Book
              </h2>
            </div>
            <div className="space-y-3">
              {ebookVariants.map(v => (
                <div
                  key={v.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-xl bg-brand-secondary"
                >
                  <div>
                    <p className="font-semibold text-sm text-brand-text-primary">
                      {v.type === 'translation' && v.languageName
                        ? `${v.languageName} Translation`
                        : 'English'}
                      {v.format && (
                        <span className="ml-2 text-xs text-brand-text-secondary uppercase">
                          {v.format}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-brand-text-secondary">
                      {v.isFree
                        ? 'Free'
                        : v.price
                        ? `$${v.price} ${v.currency ?? 'USD'}`
                        : 'Included with subscription'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartReading(v)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                    style={{ background: 'var(--ember, #C23B1E)' }}
                  >
                    Read
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Audiobook variants */}
        {audiobookVariants.length > 0 && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Headphones className="w-5 h-5" style={{ color: 'var(--crimson, #8E1B1B)' }} />
              <h2
                className="font-bold text-brand-text-primary"
                style={{ fontFamily: 'var(--serif-display)' }}
              >
                Listen (Audiobook)
              </h2>
            </div>
            <div className="space-y-3">
              {audiobookVariants.map(v => (
                <div
                  key={v.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-xl bg-brand-secondary"
                >
                  <div>
                    <p className="font-semibold text-sm text-brand-text-primary">
                      {v.languageName ? `${v.languageName} Audio` : 'English Audiobook'}
                    </p>
                    <p className="text-xs text-brand-text-secondary">
                      {v.isFree
                        ? 'Free'
                        : v.price
                        ? `$${v.price} ${v.currency ?? 'USD'}`
                        : 'Included with subscription'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartListening(v)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                    style={{ background: 'var(--crimson, #8E1B1B)' }}
                  >
                    Listen
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Print variants + purchase links */}
        {(printVariants.length > 0 || book.purchaseLinks.length > 0) && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5" style={{ color: 'var(--gold-ds, #B7892E)' }} />
              <h2
                className="font-bold text-brand-text-primary"
                style={{ fontFamily: 'var(--serif-display)' }}
              >
                Buy a Physical Copy
              </h2>
            </div>

            {printVariants.length > 0 && (
              <div className="space-y-2 mb-4">
                {printVariants.map(v => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-brand-secondary"
                  >
                    <div>
                      <p className="font-semibold text-sm text-brand-text-primary capitalize">
                        {v.printFormat ?? 'Print'} {v.region ? `(${v.region})` : ''}
                      </p>
                      <p className="text-xs text-brand-text-secondary">
                        {v.price ? `$${v.price} ${v.currency ?? 'USD'}` : 'See purchase link'}
                      </p>
                    </div>
                    {v.purchaseUrl && (
                      <a
                        href={v.purchaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0"
                        style={{
                          background: 'var(--gold-ds, #B7892E)20',
                          color: 'var(--gold-ds, #B7892E)',
                          border: '1px solid var(--gold-ds, #B7892E)40',
                        }}
                      >
                        Buy <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {book.purchaseLinks.length > 0 && (
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-3"
                  style={{ fontFamily: 'var(--sans-ui)' }}
                >
                  Available On
                </p>
                <div className="flex flex-wrap gap-2">
                  {book.purchaseLinks.map(link => {
                    const platform = POD_PLATFORMS[link.platform] ?? POD_PLATFORMS.custom;
                    return (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border border-brand-border hover:border-brand-accent transition-colors"
                      >
                        <span style={{ color: platform.color }}>●</span>
                        {link.name || platform.name}
                        {link.region && (
                          <span className="text-xs text-brand-text-secondary">({link.region})</span>
                        )}
                        <ExternalLink className="w-3 h-3 text-brand-text-secondary" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default BookReaderPage;
