import { db } from '../firebase';
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, where,
} from 'firebase/firestore';
import type { Book, ReadingPlan } from '../types';

// ─── Books ──────────────────────────────────────────────────────────────────

export const listBooks = async (publishedOnly = false): Promise<Book[]> => {
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

export const getBook = async (id: string): Promise<Book | null> => {
  try {
    const snap = await getDoc(doc(db, 'books', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Book) : null;
  } catch {
    return null;
  }
};

export const saveBook = async (book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'books'), {
    ...book,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateBook = async (id: string, updates: Partial<Book>): Promise<void> => {
  await updateDoc(doc(db, 'books', id), { ...updates, updatedAt: serverTimestamp() });
};

export const deleteBook = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'books', id));
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
