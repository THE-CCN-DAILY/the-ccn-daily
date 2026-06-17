import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollText, ArrowLeft } from 'lucide-react';
import DOMPurify from 'dompurify';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Card from '../components/Card';
import ContentDisplay from '../components/reader/ContentDisplay';
import BibleStudyGuide from '../components/BibleStudyGuide';
import ScriptureStudyCompanion from '../components/ScriptureStudyCompanion';
import { getBibleBooks, getChapterText, searchBible, type TranslationCode } from '../services/bibleService';
import type { BibleBook, BibleSearchResult } from '../types';
import { ChevronDownIcon, SpinnerIcon, SearchIcon, CloseIcon } from '../components/icons';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

type FontSize = 'small' | 'medium' | 'large';
const FONT_SIZE_CLASSES: Record<FontSize, string> = {
  small: 'text-sm',
  medium: 'text-base',
  large: 'text-lg',
};
const FONT_SIZE_STORAGE_KEY = 'bibleFontSize';

const BibleReaderPage: React.FC = () => {
  const { user } = useAuth();

  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [translation, setTranslation] = useState<TranslationCode>('web');
  const [chapterContent, setChapterContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [studyGuideOpen, setStudyGuideOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'all' | 'OT' | 'NT' | string>('all');
  const [searchResults, setSearchResults] = useState<BibleSearchResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Verse selection → quick study
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
  const [studyOpen, setStudyOpen] = useState(false);

  // Reading progress
  const [readProgress, setReadProgress] = useState(0);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  // Font size
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const stored = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    if (stored === 'small' || stored === 'medium' || stored === 'large') return stored;
    return 'medium';
  });

  const currentPassageString = selectedBook
    ? `${selectedBook.name} ${selectedChapter}`
    : '';

  const currentChapterKey = selectedBook ? `${translation}-${selectedBook.name}-${selectedChapter}` : '';

  useEffect(() => {
    (async () => {
      const bookList = await getBibleBooks();
      setBooks(bookList);
      const john = bookList.find(b => b.name === 'John') || bookList[0];
      setSelectedBook(john);
      setSelectedChapter(1);
    })();
  }, []);

  useEffect(() => {
    if (!selectedBook) return;
    (async () => {
      setIsLoading(true);
      setReadProgress(0);
      try {
        const chapterData = await getChapterText(selectedBook.name, selectedChapter, translation);
        setChapterContent(chapterData.content);
      } catch {
        setChapterContent('<p class="text-brand-text-secondary italic">Chapter could not be loaded. Please check your connection and try again.</p>');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [selectedBook, selectedChapter, translation]);

  // Reading progress handler
  const handleScroll = useCallback(() => {
    const el = contentScrollRef.current;
    if (!el) return;
    const scrolled = el.scrollTop;
    const total = el.scrollHeight - el.clientHeight;
    setReadProgress(total > 0 ? Math.round((scrolled / total) * 100) : 0);
  }, []);

  useEffect(() => {
    const el = contentScrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll, currentChapterKey]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults(null);
    try {
      const results = await searchBible(searchQuery, searchScope, translation);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: BibleSearchResult) => {
    const book = books.find(b => b.name === result.book);
    if (!book) return;
    setSelectedBook(book);
    setSelectedChapter(result.chapter);
    setSearchResults(null);
    setSearchQuery('');
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleHighlight = async () => {
    if (!selectedVerse || !user) return;
    const verseRef = `${currentPassageString}`;
    try {
      await addDoc(collection(db, 'users', user.uid, 'highlights'), {
        verseRef,
        text: selectedVerse,
        color: 'amber',
        timestamp: serverTimestamp(),
      });
    } catch {
      // Silently fail if offline — highlight is a nice-to-have
    }
    setSelectedVerse(null);
  };

  const handleFontSize = (size: FontSize) => {
    setFontSize(size);
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, size);
  };

  const chapterNumbers = selectedBook
    ? Array.from({ length: selectedBook.chapters }, (_, i) => i + 1)
    : [];

  const selectClass =
    'w-full appearance-none bg-brand-secondary border border-brand-border rounded-xl py-2.5 px-3 text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent transition-colors';

  const fontSizeButtonClass = (size: FontSize) =>
    `px-2 py-1 rounded font-bold transition-colors ${
      fontSize === size
        ? 'bg-brand-accent text-white'
        : 'bg-brand-secondary text-brand-text-secondary hover:text-brand-text-primary border border-brand-border'
    }`;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 mb-6">
        <div className="mb-2">
          <Link
            to="/guided-journey"
            className="inline-flex items-center gap-1.5 text-sm text-brand-text-secondary hover:text-brand-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Daily Journey
          </Link>
        </div>
        <motion.p
          className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          Scripture
        </motion.p>
        <div className="flex items-center justify-between gap-3">
          <motion.h1
            className="text-3xl md:text-4xl font-black text-brand-text-primary"
            style={{ fontFamily: 'var(--font-display)' }}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            Bible Reader
          </motion.h1>
          <div className="flex items-center gap-2">
            {/* Font size toggle */}
            <div className="hidden sm:flex items-center gap-1" aria-label="Font size">
              <button
                onClick={() => handleFontSize('small')}
                className={`${fontSizeButtonClass('small')} text-xs`}
                aria-pressed={fontSize === 'small'}
                title="Small text"
              >
                A
              </button>
              <button
                onClick={() => handleFontSize('medium')}
                className={`${fontSizeButtonClass('medium')} text-sm`}
                aria-pressed={fontSize === 'medium'}
                title="Medium text"
              >
                A
              </button>
              <button
                onClick={() => handleFontSize('large')}
                className={`${fontSizeButtonClass('large')} text-base`}
                aria-pressed={fontSize === 'large'}
                title="Large text"
              >
                A
              </button>
            </div>

            {/* Study with a Guide toggle */}
            <button
              onClick={() => setStudyGuideOpen(o => !o)}
              className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full transition-colors ${
                studyGuideOpen
                  ? 'bg-brand-accent text-white'
                  : 'bg-brand-secondary border border-brand-border text-brand-text-secondary hover:text-brand-accent'
              }`}
            >
              <ScrollText className="w-4 h-4" />
              <span className="hidden sm:inline">{studyGuideOpen ? 'Close Guide' : 'Study with a Guide'}</span>
            </button>
            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="lg:hidden flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-secondary text-sm font-semibold text-brand-text-secondary hover:text-brand-text-primary transition-colors"
              aria-expanded={sidebarOpen}
            >
              <SearchIcon className="w-4 h-4" />
              {sidebarOpen ? 'Hide nav' : 'Navigate'}
            </button>
          </div>
        </div>
        {selectedBook && (
          <motion.p
            className="mt-1 text-brand-text-secondary text-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {selectedBook.name} {selectedChapter} · {translation.toUpperCase()}
          </motion.p>
        )}

        {/* Reading progress bar */}
        <div className="mt-3 h-0.5 w-full bg-brand-border rounded-full overflow-hidden">
          <div
            className="h-0.5 bg-brand-accent transition-all duration-150 rounded-full"
            style={{ width: `${readProgress}%` }}
            aria-valuenow={readProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
            aria-label="Reading progress"
          />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        {/* Sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div
              key="sidebar"
              className="lg:col-span-1 lg:self-start"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <Card className="lg:sticky lg:top-8 space-y-5">
                <h2 className="text-sm font-bold uppercase tracking-widest text-brand-text-secondary">Navigate</h2>

                {/* Translation */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Translation</label>
                  <div className="relative">
                    <select
                      value={translation}
                      onChange={(e) => setTranslation(e.target.value as TranslationCode)}
                      className={selectClass}
                    >
                      <option value="web">World English Bible (WEB)</option>
                      <option value="kjv">King James Version (KJV)</option>
                      <option value="asv">American Standard (ASV)</option>
                    </select>
                    <ChevronDownIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-secondary pointer-events-none" />
                  </div>
                </div>

                {/* Book */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Book</label>
                  <div className="relative">
                    <select
                      value={selectedBook?.name || ''}
                      onChange={(e) => {
                        const book = books.find(b => b.name === e.target.value);
                        if (book) { setSelectedBook(book); setSelectedChapter(1); }
                      }}
                      className={selectClass}
                    >
                      {books.map(book => (
                        <option key={book.name} value={book.name}>{book.name}</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-secondary pointer-events-none" />
                  </div>
                </div>

                {/* Chapter */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Chapter</label>
                  <div className="relative">
                    <select
                      value={selectedChapter}
                      onChange={(e) => setSelectedChapter(Number(e.target.value))}
                      className={selectClass}
                    >
                      {chapterNumbers.map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-secondary pointer-events-none" />
                  </div>
                </div>

                {/* Search */}
                <div className="pt-4 border-t border-brand-border space-y-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary">Search Scripture</h2>
                  <form onSubmit={handleSearch} className="space-y-3">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="John 3:16 or keyword…"
                      className="w-full bg-brand-secondary border border-brand-border rounded-xl py-2.5 px-3 text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                    <div className="relative">
                      <select
                        value={searchScope}
                        onChange={(e) => setSearchScope(e.target.value)}
                        className={selectClass}
                      >
                        <option value="all">All Scripture</option>
                        <option value="OT">Old Testament</option>
                        <option value="NT">New Testament</option>
                        <optgroup label="Books">
                          {books.map(book => (
                            <option key={book.name} value={book.name}>{book.name}</option>
                          ))}
                        </optgroup>
                      </select>
                      <ChevronDownIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-secondary pointer-events-none" />
                    </div>
                    <button
                      type="submit"
                      disabled={isSearching || !searchQuery.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-xl bg-brand-accent text-white font-semibold disabled:opacity-50 hover:bg-opacity-90 transition-opacity"
                    >
                      <SearchIcon className="w-4 h-4" />
                      {isSearching ? 'Searching…' : 'Search'}
                    </button>
                  </form>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content + Study Guide */}
        <div
          className={`${sidebarOpen ? 'lg:col-span-3' : 'lg:col-span-4'} flex flex-col lg:flex-row gap-4 min-h-[50rem]`}
        >
          {/* Bible text column */}
          <motion.div
            className={`${studyGuideOpen ? 'lg:w-3/5' : 'w-full'} w-full min-w-0`}
            variants={fadeUp} initial="hidden" animate="visible"
            transition={{ duration: 0.4, ease: EASE, delay: 0.1 }}
          >
            <AnimatePresence mode="wait">
              {isSearching && (
                <motion.div
                  key="search-loading"
                  className="h-full flex flex-col items-center justify-center text-center"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                  <Card className="w-full flex flex-col items-center justify-center py-16">
                    <SpinnerIcon className="w-10 h-10 text-brand-accent mb-4 animate-spin" />
                    <p className="text-brand-text-secondary">Searching Scripture…</p>
                  </Card>
                </motion.div>
              )}

              {!isSearching && searchResults && (
                <motion.div
                  key="search-results"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  <Card className="overflow-y-auto max-h-[80vh]">
                    <div className="flex justify-between items-center mb-5">
                      <h2 className="text-lg font-bold text-brand-text-primary flex items-center gap-2">
                        <SearchIcon className="w-5 h-5 text-brand-accent" />
                        {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
                      </h2>
                      <button
                        onClick={() => { setSearchResults(null); setSearchQuery(''); }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-brand-text-secondary hover:text-brand-text-primary transition-colors"
                      >
                        <CloseIcon className="w-3.5 h-3.5" /> Clear
                      </button>
                    </div>
                    {searchResults.length === 0 ? (
                      <p className="text-center py-10 text-brand-text-secondary">
                        No results found. Try a different word or phrase.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {searchResults.map((result, index) => (
                          <div
                            key={index}
                            onClick={() => handleResultClick(result)}
                            className="cursor-pointer rounded-xl border border-brand-border p-4 hover:border-brand-accent hover:bg-brand-accent/5 transition-all"
                          >
                            <h4 className="font-bold text-brand-text-primary text-sm mb-1">
                              {result.book} {result.chapter}
                            </h4>
                            <p
                              className="text-sm italic text-brand-text-secondary leading-6"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(result.contextSnippet) }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </motion.div>
              )}

              {!isSearching && !searchResults && (
                !selectedBook ? (
                  <motion.div
                    key="reader-empty"
                    className="h-full"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <Card className="flex flex-col items-center justify-center py-24 text-center">
                      <ScrollText className="w-10 h-10 text-brand-accent mb-4" />
                      <p className="text-lg font-semibold text-brand-text-primary mb-1">Open the Word</p>
                      <p className="max-w-sm text-brand-text-secondary">
                        Choose a book and chapter above, or search a reference like “John 3:16” to begin reading.
                      </p>
                    </Card>
                  </motion.div>
                ) : isLoading ? (
                  <motion.div
                    key="chapter-loading"
                    className="h-full"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <Card className="flex flex-col items-center justify-center py-24">
                      <SpinnerIcon className="w-10 h-10 text-brand-accent mb-4 animate-spin" />
                      <p className="text-brand-text-secondary">Loading Scripture…</p>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    key={currentChapterKey}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="h-full"
                  >
                    {/* Scrollable chapter content wrapper for reading progress */}
                    <div
                      ref={contentScrollRef}
                      className="overflow-y-auto h-full"
                      onScroll={handleScroll}
                    >
                      {/* Font-size wrapper — user can click a verse to get the quick-study popover */}
                      <div
                        className={FONT_SIZE_CLASSES[fontSize]}
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          // Only trigger on verse-like text nodes (p, span, li containing text)
                          const verseEl = target.closest('p, span, li');
                          if (verseEl && verseEl.textContent?.trim()) {
                            const text = verseEl.textContent.trim().slice(0, 300);
                            setSelectedVerse(text);
                          }
                        }}
                      >
                        <ContentDisplay
                          contentId={currentChapterKey}
                          initialContent={chapterContent}
                          title={`${selectedBook?.name} ${selectedChapter} (${translation.toUpperCase()})`}
                        />
                      </div>
                    </div>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </motion.div>

          {/* Study Guide panel */}
          <AnimatePresence>
            {studyGuideOpen && (
              <motion.div
                className="lg:w-2/5 w-full lg:sticky lg:top-8 lg:self-start lg:h-[calc(100vh-4rem)]"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ type: 'spring', stiffness: 320, damping: 38 }}
              >
                <BibleStudyGuide
                  currentPassage={currentPassageString}
                  isOpen={studyGuideOpen}
                  onClose={() => setStudyGuideOpen(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Verse quick-action bar */}
      <AnimatePresence>
        {selectedVerse && (
          <motion.div
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex gap-2 bg-brand-dark border border-brand-border rounded-full px-4 py-2 shadow-xl"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            <button
              onClick={handleHighlight}
              className="text-sm text-brand-accent font-semibold hover:opacity-80 transition-opacity"
            >
              ✦ Highlight
            </button>
            <span className="text-brand-border select-none">|</span>
            <button
              onClick={() => setStudyOpen(true)}
              className="text-sm text-brand-text-primary font-semibold hover:text-brand-accent transition-colors"
            >
              Study this →
            </button>
            <button
              onClick={() => setSelectedVerse(null)}
              className="text-sm text-brand-text-secondary ml-2 hover:text-brand-text-primary transition-colors"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scripture Study Companion */}
      <ScriptureStudyCompanion
        passage={currentPassageString}
        passageText={selectedVerse ?? ''}
        isOpen={studyOpen}
        onClose={() => { setStudyOpen(false); setSelectedVerse(null); }}
      />
    </div>
  );
};

export default BibleReaderPage;
