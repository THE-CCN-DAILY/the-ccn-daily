import type { BibleBook, BibleChapter, BibleSearchResult } from '../types';

export type TranslationCode = 'web' | 'kjv' | 'asv';
const DEFAULT_TRANSLATION: TranslationCode = 'web';

const API_BIBLE_KEY = (import.meta as any).env.VITE_API_BIBLE_KEY as string | undefined;
const API_BIBLE_IDS: Record<TranslationCode, string | undefined> = {
  web: (import.meta as any).env.VITE_API_BIBLE_ID_WEB,
  kjv: (import.meta as any).env.VITE_API_BIBLE_ID_KJV,
  asv: (import.meta as any).env.VITE_API_BIBLE_ID_ASV,
};

const BOOKS: BibleBook[] = [
  { name: 'Genesis', chapters: 50, testament: 'OT' }, { name: 'Exodus', chapters: 40, testament: 'OT' },
  { name: 'Leviticus', chapters: 27, testament: 'OT' }, { name: 'Numbers', chapters: 36, testament: 'OT' },
  { name: 'Deuteronomy', chapters: 34, testament: 'OT' }, { name: 'Joshua', chapters: 24, testament: 'OT' },
  { name: 'Judges', chapters: 21, testament: 'OT' }, { name: 'Ruth', chapters: 4, testament: 'OT' },
  { name: '1 Samuel', chapters: 31, testament: 'OT' }, { name: '2 Samuel', chapters: 24, testament: 'OT' },
  { name: '1 Kings', chapters: 22, testament: 'OT' }, { name: '2 Kings', chapters: 25, testament: 'OT' },
  { name: '1 Chronicles', chapters: 29, testament: 'OT' }, { name: '2 Chronicles', chapters: 36, testament: 'OT' },
  { name: 'Ezra', chapters: 10, testament: 'OT' }, { name: 'Nehemiah', chapters: 13, testament: 'OT' },
  { name: 'Esther', chapters: 10, testament: 'OT' }, { name: 'Job', chapters: 42, testament: 'OT' },
  { name: 'Psalms', chapters: 150, testament: 'OT' }, { name: 'Proverbs', chapters: 31, testament: 'OT' },
  { name: 'Ecclesiastes', chapters: 12, testament: 'OT' }, { name: 'Song of Solomon', chapters: 8, testament: 'OT' },
  { name: 'Isaiah', chapters: 66, testament: 'OT' }, { name: 'Jeremiah', chapters: 52, testament: 'OT' },
  { name: 'Lamentations', chapters: 5, testament: 'OT' }, { name: 'Ezekiel', chapters: 48, testament: 'OT' },
  { name: 'Daniel', chapters: 12, testament: 'OT' }, { name: 'Hosea', chapters: 14, testament: 'OT' },
  { name: 'Joel', chapters: 3, testament: 'OT' }, { name: 'Amos', chapters: 9, testament: 'OT' },
  { name: 'Obadiah', chapters: 1, testament: 'OT' }, { name: 'Jonah', chapters: 4, testament: 'OT' },
  { name: 'Micah', chapters: 7, testament: 'OT' }, { name: 'Nahum', chapters: 3, testament: 'OT' },
  { name: 'Habakkuk', chapters: 3, testament: 'OT' }, { name: 'Zephaniah', chapters: 3, testament: 'OT' },
  { name: 'Haggai', chapters: 2, testament: 'OT' }, { name: 'Zechariah', chapters: 14, testament: 'OT' },
  { name: 'Malachi', chapters: 4, testament: 'OT' },

  { name: 'Matthew', chapters: 28, testament: 'NT' }, { name: 'Mark', chapters: 16, testament: 'NT' },
  { name: 'Luke', chapters: 24, testament: 'NT' }, { name: 'John', chapters: 21, testament: 'NT' },
  { name: 'Acts', chapters: 28, testament: 'NT' }, { name: 'Romans', chapters: 16, testament: 'NT' },
  { name: '1 Corinthians', chapters: 16, testament: 'NT' }, { name: '2 Corinthians', chapters: 13, testament: 'NT' },
  { name: 'Galatians', chapters: 6, testament: 'NT' }, { name: 'Ephesians', chapters: 6, testament: 'NT' },
  { name: 'Philippians', chapters: 4, testament: 'NT' }, { name: 'Colossians', chapters: 4, testament: 'NT' },
  { name: '1 Thessalonians', chapters: 5, testament: 'NT' }, { name: '2 Thessalonians', chapters: 3, testament: 'NT' },
  { name: '1 Timothy', chapters: 6, testament: 'NT' }, { name: '2 Timothy', chapters: 4, testament: 'NT' },
  { name: 'Titus', chapters: 3, testament: 'NT' }, { name: 'Philemon', chapters: 1, testament: 'NT' },
  { name: 'Hebrews', chapters: 13, testament: 'NT' }, { name: 'James', chapters: 5, testament: 'NT' },
  { name: '1 Peter', chapters: 5, testament: 'NT' }, { name: '2 Peter', chapters: 3, testament: 'NT' },
  { name: '1 John', chapters: 5, testament: 'NT' }, { name: '2 John', chapters: 1, testament: 'NT' },
  { name: '3 John', chapters: 1, testament: 'NT' }, { name: 'Jude', chapters: 1, testament: 'NT' },
  { name: 'Revelation', chapters: 22, testament: 'NT' },
];

const chapterCache = new Map<string, string>();
const bookByName = new Map(BOOKS.map(b => [b.name, b]));

const key = (book: string, chapter: number, t: TranslationCode) => `${t}:${book}:${chapter}`;

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const renderVersesHtml = (verses: Array<{ verse?: number; text?: string }>) =>
  verses.map(v => `<p><sup>${v.verse ?? ''}</sup> ${escapeHtml((v.text || '').trim())}</p>`).join('');

export const getBibleBooks = async (): Promise<BibleBook[]> => BOOKS;

export const getChapterText = async (
  book: string,
  chapter: number,
  translation: TranslationCode = DEFAULT_TRANSLATION
): Promise<BibleChapter> => {
  const ck = key(book, chapter, translation);
  if (chapterCache.has(ck)) return { book, chapter, content: chapterCache.get(ck)! };

  const passage = encodeURIComponent(`${book} ${chapter}`);
  const res = await fetch(`https://bible-api.com/${passage}?translation=${translation}`);
  if (!res.ok) throw new Error(`Failed to load ${book} ${chapter} (${translation})`);

  const data = await res.json();
  const verses = Array.isArray(data.verses) ? data.verses : [];
  if (!verses.length) throw new Error(`No text for ${book} ${chapter} (${translation})`);

  const content = renderVersesHtml(verses);
  chapterCache.set(ck, content);
  return { book, chapter, content };
};

export const getScriptureSnippet = async (
  reference: string,
  translation: TranslationCode = DEFAULT_TRANSLATION
): Promise<{ ref: string; text: string; book: string; chapter: number }> => {
  const m = reference.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/i);
  if (!m) throw new Error('Use reference format like John 3:16');

  const book = m[1].trim();
  const chapter = Number(m[2]);
  const verseStart = Number(m[3]);
  const verseEnd = m[4] ? Number(m[4]) : verseStart;

  const passage = encodeURIComponent(`${book} ${chapter}:${verseStart}-${verseEnd}`);
  const res = await fetch(`https://bible-api.com/${passage}?translation=${translation}`);
  if (!res.ok) throw new Error(`Failed to load reference ${reference}`);

  const data = await res.json();
  const text = Array.isArray(data.verses)
    ? data.verses.map((v: any) => `${v.verse}. ${v.text}`).join(' ')
    : data.text || '';

  return { ref: reference, text: escapeHtml(text), book, chapter };
};

// Query modes:
// - Reference mode: "John 3:16", "Romans 8:28-30"
// - Keyword mode:
//   a) API.Bible full search if env configured
//   b) fallback cache search over loaded chapters only
export const searchBible = async (
  query: string,
  scope: 'all' | 'OT' | 'NT' | string,
  translation: TranslationCode = DEFAULT_TRANSLATION
): Promise<BibleSearchResult[]> => {
  const q = query.trim();
  if (!q) return [];

  const refRegex = /^(.+?)\s+\d+:\d+(?:-\d+)?$/i;
  if (refRegex.test(q)) {
    try {
      const s = await getScriptureSnippet(q, translation);
      return [{ book: s.book, chapter: s.chapter, contextSnippet: s.text }];
    } catch {
      return [];
    }
  }

  // Full keyword search via API.Bible (optional)
  const bibleId = API_BIBLE_IDS[translation];
  if (API_BIBLE_KEY && bibleId) {
    try {
      const url = `https://api.scripture.api.bible/v1/bibles/${bibleId}/search?query=${encodeURIComponent(q)}&limit=25`;
      const res = await fetch(url, { headers: { 'api-key': API_BIBLE_KEY } });
      if (res.ok) {
        const json = await res.json();
        const passages = json?.data?.passages || [];
        return passages.map((p: any) => {
          const ref = p.reference || '';
          const m = ref.match(/^(.+?)\s+(\d+):/);
          return {
            book: m?.[1] || ref,
            chapter: m ? Number(m[2]) : 1,
            contextSnippet: p.text || p.content || '',
          };
        });
      }
    } catch {
      // fallback below
    }
  }

  // Fallback keyword search: only loaded chapters
  const allowedBooks = (() => {
    if (scope === 'all') return new Set(BOOKS.map(b => b.name));
    if (scope === 'OT') return new Set(BOOKS.filter(b => b.testament === 'OT').map(b => b.name));
    if (scope === 'NT') return new Set(BOOKS.filter(b => b.testament === 'NT').map(b => b.name));
    return new Set([scope]);
  })();

  const needle = q.toLowerCase();
  const out: BibleSearchResult[] = [];

  chapterCache.forEach((html, cacheKey) => {
    const [, book, chapterStr] = cacheKey.split(':');
    if (!allowedBooks.has(book)) return;

    const plain = html.replace(/<[^>]+>/g, ' ');
    const i = plain.toLowerCase().indexOf(needle);
    if (i < 0) return;

    const start = Math.max(0, i - 90);
    const end = Math.min(plain.length, i + q.length + 120);
    const snippet = plain.slice(start, end).trim().replace(
      new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'),
      '<mark>$1</mark>'
    );

    out.push({ book, chapter: Number(chapterStr), contextSnippet: `...${snippet}...` });
  });

  return out.slice(0, 30);
};

// Phase A: audio starter (return null by default; plug in provider URLs later)
export const getBibleAudioUrl = (
  _book: string,
  _chapter: number,
  _translation: TranslationCode = DEFAULT_TRANSLATION
): string | null => {
  return null;
};
