/* ─────────────────────────────────────────────────────────────────────────────
 * Push Notification Service (FCM)
 *
 * Flow:
 *   1. requestPermission()  — asks the browser for notification permission
 *   2. getToken()           — obtains the FCM registration token (VAPID key
 *                             must be set as VITE_FIREBASE_VAPID_KEY)
 *   3. saveTokenToFirestore — writes { fcmToken, updatedAt } to users/{uid}
 *
 * The service worker at /firebase-messaging-sw.js handles background messages.
 * When VITE_FIREBASE_VAPID_KEY is not set the service silently no-ops — the
 * feature degrades gracefully and no errors surface to the user.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getToken, type Messaging } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getMessagingInstance } from '../firebase';
import { db } from '../firebase';

const VAPID_KEY = (import.meta as any).env?.VITE_FIREBASE_VAPID_KEY as string | undefined;

// ── Service worker registration ────────────────────────────────────────────

let _swRegistration: ServiceWorkerRegistration | null = null;

const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (_swRegistration) return _swRegistration;
  if (!('serviceWorker' in navigator)) return null;

  try {
    // Pass the Firebase config to the SW so it can init the compat SDK
    const configParam = encodeURIComponent(JSON.stringify({
      apiKey:            (import.meta as any).env?.VITE_FIREBASE_API_KEY,
      authDomain:        (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN,
      projectId:         (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID,
      storageBucket:     (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId:             (import.meta as any).env?.VITE_FIREBASE_APP_ID,
    }));

    _swRegistration = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?firebaseConfig=${configParam}`,
      { scope: '/' }
    );
    return _swRegistration;
  } catch {
    return null;
  }
};

// ── Permission & token ─────────────────────────────────────────────────────

export type PushPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export const getPushPermissionStatus = (): PushPermissionStatus => {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission as PushPermissionStatus;
};

/**
 * Request notification permission from the browser.
 * Returns the resulting permission status.
 */
export const requestPushPermission = async (): Promise<PushPermissionStatus> => {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied')  return 'denied';

  const result = await Notification.requestPermission();
  return result as PushPermissionStatus;
};

/**
 * Get (or create) the FCM registration token for this browser.
 * Returns null if permission is not granted, VAPID key is missing,
 * or the browser does not support FCM.
 */
export const getFcmToken = async (): Promise<string | null> => {
  if (!VAPID_KEY) return null;

  const permission = getPushPermissionStatus();
  if (permission !== 'granted') return null;

  const messaging: Messaging | null = await getMessagingInstance();
  if (!messaging) return null;

  const swReg = await registerServiceWorker();

  try {
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      ...(swReg ? { serviceWorkerRegistration: swReg } : {}),
    });
    return token || null;
  } catch {
    return null;
  }
};

// ── Firestore persistence ──────────────────────────────────────────────────

/**
 * Write the FCM token to Firestore so the server can address this device.
 * Merges into users/{uid} — does not overwrite unrelated fields.
 */
export const saveFcmTokenToFirestore = async (uid: string, token: string): Promise<void> => {
  await setDoc(
    doc(db, 'users', uid),
    { fcmToken: token, fcmTokenUpdatedAt: serverTimestamp() },
    { merge: true }
  );
};

/**
 * Full onboarding flow:
 *   1. Request permission
 *   2. Get token
 *   3. Persist token for this user
 * Returns the token if successful, null otherwise.
 */
export const enablePushNotifications = async (uid: string): Promise<string | null> => {
  const permission = await requestPushPermission();
  if (permission !== 'granted') return null;

  const token = await getFcmToken();
  if (!token) return null;

  await saveFcmTokenToFirestore(uid, token);
  return token;
};
