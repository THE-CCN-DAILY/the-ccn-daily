import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase SDK
console.log('Initializing Firebase with config:', JSON.stringify({ ...firebaseConfig, apiKey: '***' }));
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Set persistence to local to help with token refresh issues in iframes
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.error("Could not set auth persistence:", err);
});

export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Connection test
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

export { signInWithPopup, firebaseSignOut, onAuthStateChanged };
export type { User };
