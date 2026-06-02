import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Notification preference keys persisted to Firestore (users/{uid}.notificationPrefs)
// and mirrored in localStorage so toggles feel instant and survive offline.
export interface NotificationPrefs {
  productUpdates: boolean;
  dailyDevotional: boolean;
  communityReplies: boolean;
}

// Playback preferences are local-only for now (no backend dependency).
export interface PlaybackPrefs {
  autoplayAudio: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  productUpdates: true,
  dailyDevotional: true,
  communityReplies: true,
};

export const DEFAULT_PLAYBACK_PREFS: PlaybackPrefs = {
  autoplayAudio: false,
};

const NOTIFICATION_PREFS_KEY = 'phoenix_notification_prefs';
const PLAYBACK_PREFS_KEY = 'phoenix_playback_prefs';

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<T>;
    // Merge over defaults so new keys always have a value.
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable (private mode / quota) — ignore.
  }
}

// ── Notification preferences ────────────────────────────────────────────────

export function getLocalNotificationPrefs(): NotificationPrefs {
  return readLocal(NOTIFICATION_PREFS_KEY, DEFAULT_NOTIFICATION_PREFS);
}

/**
 * Load notification prefs for a user. Tries Firestore first, falls back to the
 * localStorage mirror so the UI always has something to show.
 */
export async function loadNotificationPrefs(uid: string): Promise<NotificationPrefs> {
  const local = getLocalNotificationPrefs();
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    const remote = snap.exists()
      ? (snap.data().notificationPrefs as Partial<NotificationPrefs> | undefined)
      : undefined;
    if (remote) {
      const merged = { ...DEFAULT_NOTIFICATION_PREFS, ...remote };
      writeLocal(NOTIFICATION_PREFS_KEY, merged);
      return merged;
    }
  } catch {
    // Firestore unavailable — local mirror is the source of truth.
  }
  return local;
}

/**
 * Persist notification prefs. Writes the localStorage mirror immediately, then
 * merges into Firestore. Returns true if the remote write succeeded.
 */
export async function saveNotificationPrefs(uid: string, prefs: NotificationPrefs): Promise<boolean> {
  writeLocal(NOTIFICATION_PREFS_KEY, prefs);
  try {
    await setDoc(doc(db, 'users', uid), { notificationPrefs: prefs }, { merge: true });
    return true;
  } catch {
    return false;
  }
}

// ── Playback preferences (local-only) ───────────────────────────────────────

export function getPlaybackPrefs(): PlaybackPrefs {
  return readLocal(PLAYBACK_PREFS_KEY, DEFAULT_PLAYBACK_PREFS);
}

export function savePlaybackPrefs(prefs: PlaybackPrefs): void {
  writeLocal(PLAYBACK_PREFS_KEY, prefs);
}
