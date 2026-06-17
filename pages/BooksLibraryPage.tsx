import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpen, ChevronRight } from 'lucide-react';
import Card from '../components/Card';
import { listBooks } from '../services/booksService';
import type { Book } from '../types';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } } };

const variantBadge = (type: string) => {
  const styles: Record<string, string> = {
    ebook: 'bg-crimson/10 text-crimson border-crimson/20',
    audiobook: 'bg-ember/10 text-ember border-ember/20',
    print: 'bg-gold-ds/10 text-gold-ds border-gold-ds/20',
    translation: 'bg-amber-ds/10 text-amber-ds border-amber-ds/20',
  };
  return styles[type] ?? 'bg-brand-secondary text-brand-text-secondary border-brand-border';
};

type FilterType = 'all' | 'ebook' | 'audiobook' | 'print';

const BooksLibraryPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    listBooks(true).then(setBooks).finally(() => setLoading(false));
  }, []);

  const displayed = filter === 'all'
    ? books
    : books.filter(b => b.variants.some(v => v.type === filter));

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <p
          className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{ fontFamily: 'var(--sans-ui)', color: 'var(--ember, #C23B1E)' }}
        >
          Read
        </p>
        <h1
          className="text-4xl font-black text-brand-text-primary mb-2"
          style={{ fontFamily: 'var(--serif-display)' }}
        >
          Books &amp; Library
        </h1>
        <p className="text-brand-text-secondary">
          Ebooks, audiobooks, and print editions — all from one place.
        </p>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-brand-border">
        {(['all', 'ebook', 'audiobook', 'print'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-semibold capitalize transition-colors ${
              filter === f
                ? 'border-b-2 border-brand-accent text-brand-accent -mb-px'
                : 'text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            {f === 'all' ? 'All Books' : f === 'ebook' ? 'Ebooks' : f === 'audiobook' ? 'Audiobooks' : 'Print'}
          </button>
        ))}
      </div>

      {loading && (
        <div className="py-24 text-center text-brand-text-secondary animate-pulse">
          Loading library…
        </div>
      )}

      {!loading && displayed.length === 0 && (
        <div className="py-16 text-center">
          <BookOpen className="w-12 h-12 text-brand-text-secondary mx-auto mb-3 opacity-40" />
          <p className="text-brand-text-secondary">No books in this category yet.</p>
        </div>
      )}

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {displayed.map(book => (
          <motion.div key={book.id} variants={fadeUp} transition={{ duration: 0.4, ease: EASE }}>
            <Card
              className="group overflow-hidden p-0 flex flex-col border-t-2 h-full"
              style={{ borderTopColor: 'var(--ember, #C23B1E)' }}
            >
              {/* Cover */}
              <div className="relative bg-brand-secondary aspect-[3/4] overflow-hidden">
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-brand-text-secondary opacity-30" />
                  </div>
                )}
                {/* Variant badges overlay */}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  {[...new Set(book.variants.map(v => v.type))].map(type => (
                    <span
                      key={type}
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${variantBadge(type)}`}
                    >
                      {type === 'ebook' ? 'eBook' : type === 'audiobook' ? 'Audio' : type === 'print' ? 'Print' : 'Trans.'}
                    </span>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="flex flex-col flex-1 p-4">
                <h3
                  className="font-bold text-brand-text-primary leading-snug mb-0.5"
                  style={{ fontFamily: 'var(--serif-display)' }}
                >
                  {book.title}
                </h3>
                {book.subtitle && (
                  <p className="text-xs text-brand-text-secondary mb-1 italic">{book.subtitle}</p>
                )}
                <p className="text-xs text-brand-text-secondary mb-3">by {book.author}</p>
                <p className="text-xs text-brand-text-secondary line-clamp-2 mb-4 flex-1">
                  {book.description}
                </p>
                {/* CTA */}
                <Link
                  to={`/book/${book.id}`}
                  className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: 'var(--ember, #C23B1E)18',
                    color: 'var(--ember, #C23B1E)',
                    border: '1px solid var(--ember, #C23B1E)33',
                  }}
                >
                  <span>Open Book</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default BooksLibraryPage;
