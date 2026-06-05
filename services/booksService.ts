import { db } from '../firebase';
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, where,
} from 'firebase/firestore';
import type { Book, ReadingPlan } from '../types';
import {
  deleteCatalogContent,
  listCatalogContent,
  saveCatalogContent,
  type CatalogContentItem,
} from './contentService';

// ─── Books ──────────────────────────────────────────────────────────────────


type CatalogBook = {
  id: string;
  title: string;
  description?: string;
  author?: string;
  fileUrl?: string;
  coverUrl?: string;
  status?: 'draft' | 'published' | 'archived';
  isPremium?: boolean;
  price?: number;
  createdAt?: string;
  updatedAt?: string;
};

const primaryBookVariant = (book: Pick<Book, 'variants'>) =>
  book.variants.find((variant) => variant.type === 'ebook' && variant.fileUrl)
  || book.variants.find((variant) => variant.fileUrl);

const mapCatalogBook = (book: CatalogBook): Book => ({
  id: book.id,
  title: book.title,
  author: book.author || 'THE CCN DAILY',
  coverUrl: book.coverUrl,
  description: book.description || '',
  category: book.isPremium ? 'Premium Library' : 'Library',
  status: book.status === 'draft' ? 'draft' : 'published',
  variants: book.fileUrl ? [{
    id: `${book.id}-ebook`,
    type: 'ebook',
    format: book.fileUrl.toLowerCase().includes('.pdf') ? 'pdf' : 'epub',
    fileUrl: book.fileUrl,
    price: book.price || 0,
    currency: 'USD',
    isFree: !book.isPremium && !book.price,
  }] : [],
  purchaseLinks: [],
  createdAt: book.createdAt,
  updatedAt: book.updatedAt,
});

const mapContentItemToBook = (item: CatalogContentItem): Book =>
  mapCatalogBook({
    id: item.id,
    title: item.title,
    description: item.description,
    author: item.author,
    fileUrl: item.fileUrl,
    coverUrl: item.coverUrl,
    status: item.status === 'draft' ? 'draft' : 'published',
    isPremium: item.isPremium,
    price: item.price,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  });

const mapBookToCatalogItem = (
  book: Partial<Book> & Pick<Book, 'title'>,
  id?: string
): Partial<CatalogContentItem> & { title: string } => {
  const variant = book.variants ? primaryBookVariant({ variants: book.variants }) : undefined;
  const purchaseLink = book.purchaseLinks?.find((link) => link.url);
  const fileUrl = variant?.fileUrl || variant?.purchaseUrl || purchaseLink?.url || '';
  const price = Number(variant?.price ?? 0);

  return {
    id,
    title: book.title,
    description: book.description || '',
    author: book.author || 'THE CCN DAILY',
    fileUrl,
    coverUrl: book.coverUrl || undefined,
    status: book.status || 'draft',
    isPremium: Boolean(price > 0 || variant?.isFree === false),
    price,
  };
};

const listCatalogBooks = async (): Promise<Book[] | null> => {
  try {
    const response = await fetch('/api/books');
    if (!response.ok) return null;
    const data = await response.json() as { books?: CatalogBook[] };
    if (!Array.isArray(data.books)) return null;
    return data.books.map(mapCatalogBook);
  } catch {
    return null;
  }
};

const listAdminCatalogBooks = async (): Promise<Book[] | null> => {
  try {
    const items = await listCatalogContent('books', true);
    return items.map(mapContentItemToBook);
  } catch {
    return null;
  }
};

const listFirestoreBooks = async (publishedOnly = false): Promise<Book[]> => {
  try {
    const q = publishedOnly
      ? query(collection(db, 'books'), where('status', '==', 'published'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'books'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Book));
  } catch {
    return [];
  }
};

export const listBooks = async (publishedOnly = false): Promise<Book[]> => {
  if (publishedOnly) {
    const catalogBooks = await listCatalogBooks();
    if (catalogBooks && catalogBooks.length > 0) return catalogBooks;
  } else {
    const catalogBooks = await listAdminCatalogBooks();
    if (catalogBooks) return catalogBooks;
  }
  return listFirestoreBooks(publishedOnly);
};

export const getBook = async (id: string): Promise<Book | null> => {
  const catalogBooks = await listCatalogBooks();
  const catalogBook = catalogBooks?.find(book => book.id === id);
  if (catalogBook) return catalogBook;

  try {
    const snap = await getDoc(doc(db, 'books', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Book) : null;
  } catch {
    return null;
  }
};
export const saveBook = async (book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const item = await saveCatalogContent('books', mapBookToCatalogItem(book));
    if (item?.id) return item.id;
  } catch {
    // Fall through to Firestore compatibility path.
  }

  const ref = await addDoc(collection(db, 'books'), {
    ...book,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateBook = async (id: string, updates: Partial<Book>): Promise<void> => {
  try {
    if (updates.title) {
      await saveCatalogContent('books', mapBookToCatalogItem(updates as Partial<Book> & Pick<Book, 'title'>, id));
      await deleteDoc(doc(db, 'books', id)).catch(() => {});
      return;
    }
  } catch {
    // Fall through to Firestore compatibility path.
  }

  await updateDoc(doc(db, 'books', id), { ...updates, updatedAt: serverTimestamp() });
};

export const deleteBook = async (id: string): Promise<void> => {
  let deletedFromCatalog = false;
  try {
    await deleteCatalogContent('books', id);
    deletedFromCatalog = true;
  } catch {
    // Fall through to Firestore compatibility path below.
  }

  try {
    await deleteDoc(doc(db, 'books', id));
  } catch (error) {
    if (!deletedFromCatalog) throw error;
  }
};

/** Returns books that have at least one audiobook variant — used by AudiobookLibraryPage */
export const listAudiobookVariants = async (): Promise<Book[]> => {
  const books = await listBooks(true);
  return books.filter(b => b.variants.some(v => v.type === 'audiobook'));
};

// ─── Reading Plans ───────────────────────────────────────────────────────────

export const listReadingPlans = async (publishedOnly = false): Promise<ReadingPlan[]> => {
  try {
    const q = publishedOnly
      ? query(collection(db, 'readingPlans'), where('status', '==', 'published'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'readingPlans'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ReadingPlan));
  } catch {
    return [];
  }
};

export const getReadingPlan = async (id: string): Promise<ReadingPlan | null> => {
  try {
    const snap = await getDoc(doc(db, 'readingPlans', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as ReadingPlan) : null;
  } catch {
    return null;
  }
};

export const saveReadingPlan = async (plan: Omit<ReadingPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'readingPlans'), {
    ...plan,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateReadingPlan = async (id: string, updates: Partial<ReadingPlan>): Promise<void> => {
  await updateDoc(doc(db, 'readingPlans', id), { ...updates, updatedAt: serverTimestamp() });
};

export const deleteReadingPlan = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'readingPlans', id));
};
