import { db } from './firebase';
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

// The collection for user notes/highlights, as defined in DataArchitecture.tsx
const NOTES_COLLECTION = 'notes';

/**
 * Fetches all highlights/notes for a specific piece of content for a given user.
 * @param userId - The UID of the authenticated user.
 * @param contentId - The unique identifier for the content (e.g., 'epub-1').
 * @returns A promise that resolves to an array of Highlight objects.
 */
export const getHighlightsForContent = async (userId: string, contentId: string): Promise<Highlight[]> => {
  try {
    const notesRef = collection(db, 'users', userId, NOTES_COLLECTION);
    const q = query(notesRef, where('contentId', '==', contentId));
    const querySnapshot = await getDocs(q);
    
    const highlights: Highlight[] = [];
    querySnapshot.forEach((doc) => {
      highlights.push({ id: doc.id, ...doc.data() } as Highlight);
    });
    
    return highlights.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
  } catch (error) {
    console.error("Error fetching highlights:", error);
    throw new Error("Could not fetch user highlights.");
  }
};

/**
 * Saves a new highlight to Firestore.
 * @param userId - The UID of the authenticated user.
 * @param highlight - The highlight object to save.
 */
export const saveHighlight = async (userId: string, highlight: Highlight): Promise<void> => {
  try {
    const noteRef = doc(db, 'users', userId, NOTES_COLLECTION, highlight.id);
    await setDoc(noteRef, { ...highlight, createdAt: serverTimestamp() });
  } catch (error) {
    console.error("Error saving highlight:", error);
    throw new Error("Could not save highlight.");
  }
};

/**
 * Deletes a highlight from Firestore.
 * @param userId - The UID of the authenticated user.
 * @param highlightId - The ID of the highlight to delete.
 */
export const deleteHighlight = async (userId: string, highlightId: string): Promise<void> => {
  try {
    const noteRef = doc(db, 'users', userId, NOTES_COLLECTION, highlightId);
    await deleteDoc(noteRef);
  } catch (error) {
    console.error("Error deleting highlight:", error);
    throw new Error("Could not delete highlight.");
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
  try {
    const noteRef = doc(db, 'users', userId, NOTES_COLLECTION, highlightId);
    await updateDoc(noteRef, data);
  } catch (error) {
    console.error("Error updating highlight:", error);
    throw new Error("Could not update highlight note.");
  }
};
