import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

// Config is supplied at build time via VITE_ env vars.
// Never import firebase-applet-config.json — it contains a plaintext API key.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

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
