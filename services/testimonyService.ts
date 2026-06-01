import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  type QueryConstraint,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Testimony {
  id: string;
  author: string;
  authorUid: string;
  title: string;
  text: string;
  status: 'published';
  createdAt: string; // ISO string (derived from Firestore Timestamp)
}

export interface NewTestimony {
  title: string;
  text: string;
}

interface AuthorLike {
  uid: string;
  displayName?: string | null;
}

const COLLECTION = 'testimonies';

const toIso = (value: unknown): string => {
  if (value && typeof value === 'object' && 'seconds' in (value as Record<string, unknown>)) {
    const seconds = (value as { seconds: number }).seconds;
    return new Date(seconds * 1000).toISOString();
  }
  return new Date().toISOString();
};

/**
 * Published testimonies, newest first. Public-readable (the Wall of Testimony and
 * the landing page both call this). `max` caps the landing-page preview.
 */
export const listTestimonies = async (max?: number): Promise<Testimony[]> => {
  const constraints: QueryConstraint[] = [
    where('status', '==', 'published'),
    orderBy('createdAt', 'desc'),
  ];
  if (max && max > 0) constraints.push(fsLimit(max));

  const snap = await getDocs(query(collection(db, COLLECTION), ...constraints));
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      author: String(data.author ?? 'Anonymous'),
      authorUid: String(data.authorUid ?? ''),
      title: String(data.title ?? ''),
      text: String(data.text ?? ''),
      status: 'published',
      createdAt: toIso(data.createdAt),
    };
  });
};

/**
 * Submit a testimony. Created as published (low-friction wall); admins can remove
 * via `deleteTestimony` (light, reactive moderation per the launch plan).
 */
export const submitTestimony = async (user: AuthorLike, input: NewTestimony): Promise<void> => {
  const title = input.title.trim();
  const text = input.text.trim();
  if (!title || !text) throw new Error('A title and your story are both required.');
  if (title.length > 160) throw new Error('Please keep the title under 160 characters.');
  if (text.length > 2000) throw new Error('Please keep your story under 2000 characters.');

  await addDoc(collection(db, COLLECTION), {
    author: (user.displayName || 'A member of the community').trim(),
    authorUid: user.uid,
    title,
    text,
    status: 'published',
    createdAt: serverTimestamp(),
  });
};

/** Admin-only: remove a testimony (reactive moderation). */
export const deleteTestimony = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, id));
};
