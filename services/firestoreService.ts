import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { Highlight } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

// The collection for user notes/highlights, as defined in DataArchitecture.tsx
const NOTES_COLLECTION = 'notes';

/**
 * Fetches all highlights/notes for a specific piece of content for a given user.
 * @param userId - The UID of the authenticated user.
 * @param contentId - The unique identifier for the content (e.g., 'epub-1').
 * @returns A promise that resolves to an array of Highlight objects.
 */
export const getHighlightsForContent = async (userId: string, contentId: string): Promise<Highlight[]> => {
  const notesRef = collection(db, 'users', userId, NOTES_COLLECTION);
  try {
    const q = query(notesRef, where('contentId', '==', contentId));
    const querySnapshot = await getDocs(q);
    
    const highlights: Highlight[] = [];
    querySnapshot.forEach((doc) => {
      highlights.push({ id: doc.id, ...doc.data() } as Highlight);
    });
    
    return highlights.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, notesRef.path);
    return []; // Should not reach here
  }
};

/**
 * Saves a new highlight to Firestore.
 * @param userId - The UID of the authenticated user.
 * @param highlight - The highlight object to save.
 */
export const saveHighlight = async (userId: string, highlight: Highlight): Promise<void> => {
  const noteRef = doc(db, 'users', userId, NOTES_COLLECTION, highlight.id);
  try {
    await setDoc(noteRef, { ...highlight, createdAt: serverTimestamp() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, noteRef.path);
  }
};

/**
 * Deletes a highlight from Firestore.
 * @param userId - The UID of the authenticated user.
 * @param highlightId - The ID of the highlight to delete.
 */
export const deleteHighlight = async (userId: string, highlightId: string): Promise<void> => {
  const noteRef = doc(db, 'users', userId, NOTES_COLLECTION, highlightId);
  try {
    await deleteDoc(noteRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, noteRef.path);
  }
};

/**
 * Updates an existing highlight, typically to add/edit a note.
 * @param userId - The UID of the authenticated user.
 * @param highlightId - The ID of the highlight to update.
 * @param data - The data to update (e.g., { note: 'new note text' }).
 */
export const updateHighlight = async (
    userId: string, 
    highlightId: string, 
    data: Partial<Pick<Highlight, 'note' | 'voiceNoteUrl' | 'tags'>>
): Promise<void> => {
  const noteRef = doc(db, 'users', userId, NOTES_COLLECTION, highlightId);
  try {
    await updateDoc(noteRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, noteRef.path);
  }
};
