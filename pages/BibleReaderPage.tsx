import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../components/Card';
import ContentDisplay from '../components/reader/ContentDisplay';
import { getBibleBooks, getChapterText, searchBible, type TranslationCode } from '../services/bibleService';
import type { BibleBook, BibleSearchResult } from '../types';
import { ChevronDownIcon, SpinnerIcon, SearchIcon, SparklesIcon, CloseIcon } from '../components/icons';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

const BibleReaderPage: React.FC = () => {
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [translation, setTranslation] = useState<TranslationCode>('web');
  const [chapterContent, setChapterContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'all' | 'OT' | 'NT' | string>('all');
  const [searchResults, setSearchResults] = useState<BibleSearchResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

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
    // On mobile collapse sidebar after navigation
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const chapterNumbers = selectedBook
    ? Array.from({ length: selectedBook.chapters }, (_, i) => i + 1)
    : [];

  const selectClass =
    'w-full appearance-none bg-brand-secondary border border-brand-border rounded-xl py-2.5 px-3 text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent transition-colors';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 mb-6">
        <motion.p
          className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          Scripture
        </motion.p>
        <div className="flex items-center justify-between">
          <motion.h1
            className="text-3xl md:text-4xl font-black text-brand-text-primary"
            style={{ fontFamily: 'var(--font-display)' }}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            Bible Reader
          </motion.h1>
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
        {selectedBook && (
          <motion.p
            className="mt-1 text-brand-text-secondary text-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {selectedBook.name} {selectedChapter} · {translation.toUpperCase()}
          </motion.p>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        {/* Sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div
              key="sidebar"
              className="lg:col-span-1"
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

        {/* Main content */}
        <motion.div
          className={sidebarOpen ? 'lg:col-span-3 min-h-[50rem]' : 'lg:col-span-4 min-h-[50rem]'}
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
                      <SparklesIcon className="w-5 h-5 text-brand-accent" />
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
                            dangerouslySetInnerHTML={{ __html: result.contextSnippet }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {!isSearching && !searchResults && (
              isLoading ? (
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
                >
                  <ContentDisplay
                    contentId={currentChapterKey}
                    initialContent={chapterContent}
                    title={`${selectedBook?.name} ${selectedChapter} (${translation.toUpperCase()})`}
                  />
                </motion.div>
              )
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default BibleReaderPage;
