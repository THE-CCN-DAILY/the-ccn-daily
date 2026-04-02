import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import ContentDisplay from '../components/reader/ContentDisplay';
import { getBibleBooks, getChapterText, searchBible, type TranslationCode } from '../services/bibleService';
import type { BibleBook, BibleSearchResult } from '../types';
import { ChevronDownIcon, SpinnerIcon, SearchIcon, SparklesIcon, CloseIcon } from '../components/icons';

const BibleReaderPage: React.FC = () => {
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [translation, setTranslation] = useState<TranslationCode>('web');
  const [chapterContent, setChapterContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

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
      } catch (error) {
        console.error(error);
        setChapterContent('<p>Error loading chapter content.</p>');
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
  };

  const chapterNumbers = selectedBook ? Array.from({ length: selectedBook.chapters }, (_, i) => i + 1) : [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0">
        <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Bible Reader</h1>
        <p className="text-lg text-brand-text-secondary mb-8">
          Read, study, and listen to scripture in your preferred translation.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <h2 className="text-xl font-bold text-brand-text-primary mb-4">Navigation</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-brand-text-secondary mb-1 block">Translation</label>
                <div className="relative">
                  <select
                    value={translation}
                    onChange={(e) => setTranslation(e.target.value as TranslationCode)}
                    className="w-full appearance-none bg-brand-secondary border border-brand-border rounded-lg py-2 px-3 text-brand-text-primary"
                  >
                    <option value="web">WEB</option>
                    <option value="kjv">KJV</option>
                    <option value="asv">ASV</option>
                  </select>
                  <ChevronDownIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-secondary pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-brand-text-secondary mb-1 block">Book</label>
                <div className="relative">
                  <select
                    value={selectedBook?.name || ''}
                    onChange={(e) => {
                      const book = books.find(b => b.name === e.target.value);
                      if (book) { setSelectedBook(book); setSelectedChapter(1); }
                    }}
                    className="w-full appearance-none bg-brand-secondary border border-brand-border rounded-lg py-2 px-3 text-brand-text-primary"
                  >
                    {books.map(book => <option key={book.name} value={book.name}>{book.name}</option>)}
                  </select>
                  <ChevronDownIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-secondary pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-brand-text-secondary mb-1 block">Chapter</label>
                <div className="relative">
                  <select
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(Number(e.target.value))}
                    className="w-full appearance-none bg-brand-secondary border border-brand-border rounded-lg py-2 px-3 text-brand-text-primary"
                  >
                    {chapterNumbers.map(num => <option key={num} value={num}>{num}</option>)}
                  </select>
                  <ChevronDownIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-secondary pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-brand-border">
              <h2 className="text-xl font-bold text-brand-text-primary mb-4">Search Scripture</h2>
              <form onSubmit={handleSearch} className="space-y-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Try: John 3:16 or keyword"
                  className="w-full bg-brand-secondary border border-brand-border rounded-lg py-2 px-3 text-brand-text-primary"
                />
                <div className="relative">
                  <select
                    value={searchScope}
                    onChange={(e) => setSearchScope(e.target.value)}
                    className="w-full appearance-none bg-brand-secondary border border-brand-border rounded-lg py-2 px-3 text-brand-text-primary"
                  >
                    <option value="all">All Scripture</option>
                    <option value="OT">Old Testament</option>
                    <option value="NT">New Testament</option>
                    <optgroup label="Books">
                      {books.map(book => <option key={book.name} value={book.name}>{book.name}</option>)}
                    </optgroup>
                  </select>
                  <ChevronDownIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-secondary pointer-events-none" />
                </div>
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg bg-brand-accent text-white font-semibold disabled:bg-opacity-50"
                >
                  <SearchIcon className="w-4 h-4" />
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </form>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3 min-h-[50rem]">
          {isSearching && (
            <Card className="h-full flex flex-col items-center justify-center text-center">
              <SpinnerIcon className="w-12 h-12 text-brand-accent mb-4" />
              <p className="text-brand-text-secondary">Searching Scripture...</p>
            </Card>
          )}

          {!isSearching && searchResults && (
            <Card className="h-full overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-brand-text-primary flex items-center">
                  <SparklesIcon className="w-6 h-6 mr-3 text-brand-accent" />
                  {searchResults.length} Results for "{searchQuery}"
                </h2>
                <button onClick={() => setSearchResults(null)} className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary">
                  <CloseIcon className="w-4 h-4" /> Clear
                </button>
              </div>
              {searchResults.length === 0 ? (
                <p className="text-center py-8 text-brand-text-secondary">No results found.</p>
              ) : (
                searchResults.map((result, index) => (
                  <Card key={index} onClick={() => handleResultClick(result)} className="cursor-pointer hover:border-brand-accent transition-colors mb-4">
                    <h4 className="font-bold text-brand-text-primary">{result.book} {result.chapter}</h4>
                    <p className="text-sm italic text-brand-text-secondary mt-2" dangerouslySetInnerHTML={{ __html: result.contextSnippet }} />
                  </Card>
                ))
              )}
            </Card>
          )}

          {!isSearching && !searchResults && (
            isLoading ? (
              <Card className="h-full flex flex-col items-center justify-center text-center">
                <SpinnerIcon className="w-12 h-12 text-brand-accent mb-4" />
                <p className="text-brand-text-secondary">Loading Scripture...</p>
              </Card>
            ) : (
              <ContentDisplay
                key={currentChapterKey}
                contentId={currentChapterKey}
                initialContent={chapterContent}
                title={`${selectedBook?.name} ${selectedChapter} (${translation.toUpperCase()})`}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default BibleReaderPage;
