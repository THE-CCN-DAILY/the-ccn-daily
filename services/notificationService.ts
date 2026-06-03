import type { AppNotification } from '../contexts/NotificationContext';
import { adminAuthHeaders } from './adminAuth';

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
};

export const listNotifications = async (userId: string): Promise<AppNotification[]> => {
  const data = await requestJson<{ notifications: AppNotification[] }>(
    `/api/users/${encodeURIComponent(userId)}/notifications`,
    { headers: await adminAuthHeaders() }
  );
  return data.notifications;
};

export const createNotification = async (
  userId: string,
  notification: Omit<AppNotification, 'id' | 'read'>
): Promise<AppNotification | null> => {
  const data = await requestJson<{ notification: AppNotification | null }>(
    `/api/users/${encodeURIComponent(userId)}/notifications`,
    {
      method: 'POST',
      headers: await adminAuthHeaders(),
      body: JSON.stringify(notification),
    }
  );
  return data.notification;
};

export const markNotificationRead = async (userId: string, notificationId: string): Promise<void> => {
  await requestJson<{ ok: true }>(
    `/api/users/${encodeURIComponent(userId)}/notifications/${encodeURIComponent(notificationId)}`,
    { method: 'PATCH', headers: await adminAuthHeaders() }
  );
};

export const markNotificationsRead = async (userId: string): Promise<void> => {
  await requestJson<{ ok: true }>(
    `/api/users/${encodeURIComponent(userId)}/notifications/mark-all-read`,
    { method: 'POST', headers: await adminAuthHeaders() }
  );
};
