
// Mock service to provide Bible text for the reader prototype.
import type { BibleBook, BibleChapter, BibleSearchResult } from '../types';

const bibleData: Record<string, string[]> = {
    "Joshua": [
        `<p><sup>9</sup> Have I not commanded you? Be strong and of good courage; do not be afraid, nor be dismayed, for the LORD your God is with you wherever you go.</p>`
    ],
    "Deuteronomy": [
        `<p><sup>6</sup> Be strong and of good courage, do not fear nor be afraid of them; for the LORD your God, He is the One who goes with you. He will not leave you nor forsake you.</p>`
    ],
    "2 Timothy": [
        `<p><sup>7</sup> For God has not given us a spirit of fear, but of power and of love and of a sound mind.</p>`
    ],
    "Genesis": [
        `<p><sup>1</sup> In the beginning God created the heavens and the earth. <sup>2</sup> The earth was without form, and void; and darkness was on the face of the deep. And the Spirit of God was hovering over the face of the waters.</p>`,
        `<p><sup>1</sup> Thus the heavens and the earth, and all the host of them, were finished.</p>`
    ],
    "John": [
        `<p><sup>1</sup> In the beginning was the Word, and the Word was with God, and the Word was God.</p>`,
        `<p><sup>1</sup> On the third day there was a wedding in Cana of Galilee...</p>`,
        `<p><sup>16</sup> For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.</p>`
    ]
};

const newTestamentBooks = ["John", "2 Timothy"];

const books: BibleBook[] = Object.keys(bibleData).map(name => ({
    name,
    chapters: bibleData[name].length,
    testament: newTestamentBooks.includes(name) ? 'NT' : 'OT'
}));

export const getBibleBooks = async (): Promise<BibleBook[]> => {
    return books;
}

export const getChapterText = async (book: string, chapter: number): Promise<BibleChapter> => {
    const content = bibleData[book]?.[chapter - 1];
    if (!content) throw new Error(`Could not find text for ${book} ${chapter}.`);
    return { book, chapter, content };
}

/**
 * Returns a quick snippet for inline journey study.
 */
export const getScriptureSnippet = async (reference: string): Promise<{ref: string, text: string, book: string, chapter: number}> => {
    // Simple mock parser: "John 3:16" -> book: John, chapter: 3
    const parts = reference.split(' ');
    let book = parts[0];
    let chapVerse = parts[1];
    if (parts.length === 3) { // Handles "2 Timothy"
        book = `${parts[0]} ${parts[1]}`;
        chapVerse = parts[2];
    }
    const chapter = parseInt(chapVerse.split(':')[0]);
    
    const data = await getChapterText(book, chapter);
    return {
        ref: reference,
        text: data.content,
        book: book,
        chapter: chapter
    };
}

export const searchBible = async (query: string, scope: 'all' | 'OT' | 'NT' | string): Promise<BibleSearchResult[]> => {
    if (!query.trim()) return [];
    const results: BibleSearchResult[] = [];
    for (const bookName in bibleData) {
        const chapters = bibleData[bookName];
        for (let i = 0; i < chapters.length; i++) {
            if (chapters[i].toLowerCase().includes(query.toLowerCase())) {
                results.push({ book: bookName, chapter: i + 1, contextSnippet: chapters[i] });
            }
        }
    }
    return results;
}
