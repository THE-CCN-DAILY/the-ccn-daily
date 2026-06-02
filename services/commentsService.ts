import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Public comments with admin-approval moderation.
 *
 * Mirrors the testimonies feature (services/testimonyService.ts): a comment is
 * created as 'pending', an admin approves it (-> 'published', goes public) or
 * rejects it (-> 'rejected' + declineReason the author will see). Unlike
 * private Library/journal notes, these are public once approved.
 */

export type CommentStatus = 'pending' | 'published' | 'rejected';

/** The kinds of content a public comment can be attached to. */
export type CommentContentType =
  | 'podcast'
  | 'book'
  | 'blog'
  | 'devotional'
  | 'audiobook';

export interface Comment {
  id: string;
  contentType: CommentContentType;
  contentId: string;
  author: string;
  authorUid: string;
  text: string;
  status: CommentStatus;
  declineReason?: string;
  createdAt: string; // ISO string (derived from Firestore Timestamp)
}

export interface NewComment {
  contentType: CommentContentType;
  contentId: string;
  text: string;
}

interface AuthorLike {
  uid: string;
  displayName?: string | null;
}

const COLLECTION = 'comments';

const MAX_TEXT = 2000;

const toIso = (value: unknown): string => {
  if (value && typeof value === 'object' && 'seconds' in (value as Record<string, unknown>)) {
    const seconds = (value as { seconds: number }).seconds;
    return new Date(seconds * 1000).toISOString();
  }
  return new Date().toISOString();
};

const mapDoc = (id: string, data: Record<string, unknown>): Comment => ({
  id,
  contentType: (data.contentType as CommentContentType) ?? 'blog',
  contentId: String(data.contentId ?? ''),
  author: String(data.author ?? 'A member of the community'),
  authorUid: String(data.authorUid ?? ''),
  text: String(data.text ?? ''),
  status: (data.status as CommentStatus) ?? 'pending',
  declineReason: data.declineReason ? String(data.declineReason) : undefined,
  createdAt: toIso(data.createdAt),
});

/**
 * Published comments for one piece of content, newest first. Public-readable —
 * the ProductComments component on each product surface calls this.
 */
export const listPublishedComments = async (
  contentType: CommentContentType,
  contentId: string,
): Promise<Comment[]> => {
  const snap = await getDocs(
    query(
      collection(db, COLLECTION),
      where('contentType', '==', contentType),
      where('contentId', '==', contentId),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
};

/** Admin moderation queue: comments awaiting review across all content, oldest first. */
export const listPendingComments = async (): Promise<Comment[]> => {
  const snap = await getDocs(
    query(collection(db, COLLECTION), where('status', '==', 'pending'), orderBy('createdAt', 'asc')),
  );
  return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
};

/** The signed-in user's own comments (any status) so they can see approval/decline + reason. */
export const listMyComments = async (uid: string): Promise<Comment[]> => {
  const snap = await getDocs(
    query(collection(db, COLLECTION), where('authorUid', '==', uid), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
};

/**
 * Submit a public comment. Created as 'pending' — an admin must approve before
 * it shows publicly (admin-approval moderation). The author can see its status
 * afterward.
 */
export const submitComment = async (user: AuthorLike, input: NewComment): Promise<void> => {
  const text = input.text.trim();
  const contentId = input.contentId.trim();
  if (!text) throw new Error('Please write a comment before submitting.');
  if (text.length > MAX_TEXT) throw new Error(`Please keep your comment under ${MAX_TEXT} characters.`);
  if (!contentId) throw new Error('Could not attach this comment — missing content reference.');

  await addDoc(collection(db, COLLECTION), {
    contentType: input.contentType,
    contentId,
    author: (user.displayName || 'A member of the community').trim(),
    authorUid: user.uid,
    text,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
};

/** Admin: approve a pending comment (makes it public). */
export const approveComment = async (id: string): Promise<void> => {
  await updateDoc(doc(db, COLLECTION, id), { status: 'published', declineReason: '' });
};

/** Admin: reject a comment with a reason the author will see. */
export const rejectComment = async (id: string, reason: string): Promise<void> => {
  const declineReason = reason.trim();
  if (!declineReason) throw new Error('A reason is required so the author knows why.');
  await updateDoc(doc(db, COLLECTION, id), { status: 'rejected', declineReason });
};

/** Admin-only: remove a comment entirely. */
export const deleteComment = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, id));
};
