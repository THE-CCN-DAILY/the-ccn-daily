import {
  getAuth,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';

/**
 * Best-effort sync of a denormalized field onto the user's Firestore doc. The Auth
 * profile is the source of truth; the Firestore copy is only for admin/leaderboard
 * views. The users security rule whitelists specific fields (no updatedAt), so we keep
 * the payload minimal and never let a Firestore failure break the Auth-side update.
 */
async function syncUserDoc(uid: string, data: Record<string, unknown>): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid), data, { merge: true });
  } catch {
    // Non-fatal: the Auth profile already updated; the denormalized copy can lag.
  }
}

/** Max avatar upload size (2 MB) and accepted image types. */
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

/** True when the signed-in user has an email/password credential (so password change applies). */
export function hasPasswordProvider(): boolean {
  const user = getAuth().currentUser;
  return !!user?.providerData.some((p) => p.providerId === 'password');
}

/**
 * Upload a new profile photo to Firebase Storage, then point the user's Auth profile
 * and their Firestore user doc at the new URL. Returns the download URL.
 */
export async function uploadProfilePhoto(uid: string, file: File): Promise<string> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Please choose a JPG, PNG, WEBP, or GIF image.');
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error('Image is too large — please use one under 2 MB.');
  }

  const user = getAuth().currentUser;
  if (!user) throw new Error('You are not signed in.');

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const storageRef = ref(storage, `profile-photos/${uid}/avatar.${ext}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const photoURL = await getDownloadURL(storageRef);

  await updateProfile(user, { photoURL });
  await syncUserDoc(uid, { photoURL });

  return photoURL;
}

/** Update the user's display name on their Auth profile and Firestore user doc. */
export async function updateDisplayName(uid: string, displayName: string): Promise<void> {
  const trimmed = displayName.trim();
  if (!trimmed) throw new Error('Please enter a name.');
  if (trimmed.length > 60) throw new Error('Name must be 60 characters or fewer.');

  const user = getAuth().currentUser;
  if (!user) throw new Error('You are not signed in.');

  await updateProfile(user, { displayName: trimmed });
  await syncUserDoc(uid, { displayName: trimmed });
}

/**
 * Change the password for an email/password user. Firebase requires a recent login,
 * so we re-authenticate with the current password first, then set the new one.
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  if (newPassword.length < 6) throw new Error('New password must be at least 6 characters.');

  const user = getAuth().currentUser;
  if (!user?.email) throw new Error('You are not signed in.');

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  try {
    await reauthenticateWithCredential(user, credential);
  } catch {
    throw new Error('Your current password is incorrect.');
  }
  await updatePassword(user, newPassword);
}
