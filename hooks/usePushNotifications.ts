/* ─────────────────────────────────────────────────────────────────────────────
 * usePushNotifications hook
 *
 * Exposes:
 *   status    — current Notification permission state
 *   token     — FCM token once granted (null if not yet enabled)
 *   enable()  — requests permission + fetches + persists token
 *   loading   — true while the enable() call is in flight
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback, useEffect } from 'react';
import {
  enablePushNotifications,
  getFcmToken,
  getPushPermissionStatus,
  type PushPermissionStatus,
} from '../services/pushNotificationService';

interface UsePushNotificationsOptions {
  /** Firebase UID of the signed-in user. Hook is a no-op when null. */
  uid: string | null;
  /** If true, attempt to re-register token on mount (when permission is already granted). */
  autoRefresh?: boolean;
}

interface UsePushNotificationsResult {
  status: PushPermissionStatus;
  token: string | null;
  loading: boolean;
  enable: () => Promise<void>;
}

export const usePushNotifications = ({
  uid,
  autoRefresh = true,
}: UsePushNotificationsOptions): UsePushNotificationsResult => {
  const [status, setStatus] = useState<PushPermissionStatus>(() =>
    getPushPermissionStatus()
  );
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // On mount: if permission is already granted, silently refresh the token
  useEffect(() => {
    if (!autoRefresh || !uid || status !== 'granted') return;
    let cancelled = false;

    getFcmToken().then((t) => {
      if (!cancelled && t) setToken(t);
    });

    return () => { cancelled = true; };
  }, [autoRefresh, uid, status]);

  const enable = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const t = await enablePushNotifications(uid);
      setToken(t);
      setStatus(getPushPermissionStatus());
    } finally {
      setLoading(false);
    }
  }, [uid]);

  return { status, token, loading, enable };
};
