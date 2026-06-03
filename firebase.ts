import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';

// Resolve the Firebase Auth domain.
//
// On any DEPLOYED host we use the app's own origin as the authDomain, because the
// /__/auth/* and /__/firebase/* reverse-proxy (Cloudflare Pages Functions) serves
// Firebase's auth handler from that same origin. This (a) brands the Google consent
// screen as theccndaily.com instead of ccn-daily.firebaseapp.com and (b) keeps the
// signInWithRedirect result cookie same-origin so redirect sign-in works (popups are
// unreliable on mobile). On localhost there is no proxy, so we fall back to the
// Firebase-hosted authDomain from env.
const resolveAuthDomain = (): string | undefined => {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') return host;
  }
  return import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
};

// Config is supplied at build time via VITE_ env vars.
// Never import firebase-applet-config.json — it contains a plaintext API key.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: resolveAuthDomain(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

// VITE_ vars are inlined at build time. If the build environment is missing them,
// Firebase initializes with undefined credentials and auth silently hangs forever.
// Expose this so the auth layer can fail loudly instead of spinning indefinitely.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId,
);

if (!isFirebaseConfigured) {
  console.error(
    'Firebase configuration is missing. Set the VITE_FIREBASE_* environment variables in the build environment and redeploy.',
  );
}

// Non-default Firestore database created in Firebase AI Studio.
// This is a database identifier, not a secret.
const FIRESTORE_DATABASE_ID = 'ai-studio-99552f04-30cb-4061-a5c7-62e531885ebf';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, FIRESTORE_DATABASE_ID);
export const storage = getStorage(app);

/** FCM messaging instance — null if the browser does not support it */
export const getMessagingInstance = async () => {
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
};

// Email/password auth: enable this provider in Firebase Console → Authentication → Sign-in method
export const signUpWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(getAuth(), email, password);

export const signInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(getAuth(), email, password);

export const resetPassword = (email: string) =>
  sendPasswordResetEmail(getAuth(), email);

export const testFirestoreConnection = async () => {
  try {
    await getDocFromServer(doc(db, '_system_health', 'check'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
    return false;
  }
};
