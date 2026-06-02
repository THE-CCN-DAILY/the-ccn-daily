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
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

export type TestimonyStatus = 'pending' | 'published' | 'rejected';

export interface Testimony {
  id: string;
  author: string;
  authorUid: string;
  title: string;
  text: string;
  status: TestimonyStatus;
  declineReason?: string;
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

const mapDoc = (id: string, data: Record<string, unknown>): Testimony => ({
  id,
  author: String(data.author ?? 'Anonymous'),
  authorUid: String(data.authorUid ?? ''),
  title: String(data.title ?? ''),
  text: String(data.text ?? ''),
  status: (data.status as TestimonyStatus) ?? 'pending',
  declineReason: data.declineReason ? String(data.declineReason) : undefined,
  createdAt: toIso(data.createdAt),
});

/**
 * Published testimonies, newest first. Public-readable (the Wall of Testimony and the
 * landing page both call this). `max` caps the landing-page preview.
 */
export const listTestimonies = async (max?: number): Promise<Testimony[]> => {
  const constraints: QueryConstraint[] = [
    where('status', '==', 'published'),
    orderBy('createdAt', 'desc'),
  ];
  if (max && max > 0) constraints.push(fsLimit(max));
  const snap = await getDocs(query(collection(db, COLLECTION), ...constraints));
  return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
};

/** Admin moderation queue: testimonies awaiting review, oldest first. */
export const listPendingTestimonies = async (): Promise<Testimony[]> => {
  const snap = await getDocs(
    query(collection(db, COLLECTION), where('status', '==', 'pending'), orderBy('createdAt', 'asc')),
  );
  return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
};

/** The signed-in user's own submissions (any status) so they can see approval/decline + reason. */
export const listMyTestimonies = async (uid: string): Promise<Testimony[]> => {
  const snap = await getDocs(
    query(collection(db, COLLECTION), where('authorUid', '==', uid), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
};

/**
 * Submit a testimony. Created as 'pending' — an admin must approve before it is public
 * (admin-approval moderation). The author can see its status afterward.
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
    status: 'pending',
    createdAt: serverTimestamp(),
  });
};

/** Admin: approve a pending testimony (makes it public). */
export const approveTestimony = async (id: string): Promise<void> => {
  await updateDoc(doc(db, COLLECTION, id), { status: 'published', declineReason: '' });
};

/** Admin: reject a testimony with a reason the author will see. */
export const rejectTestimony = async (id: string, reason: string): Promise<void> => {
  const declineReason = reason.trim();
  if (!declineReason) throw new Error('A reason is required so the author knows why.');
  await updateDoc(doc(db, COLLECTION, id), { status: 'rejected', declineReason });
};

/** Admin-only: remove a testimony entirely. */
export const deleteTestimony = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, id));
};
