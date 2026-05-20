export interface AppEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  attendeeCount: number;
  type: 'online' | 'physical';
  streamingPlatform?: string;
  status?: 'draft' | 'published' | 'archived';
}

const ADMIN_EMAIL = 'pastor.eryeza@gmail.com';

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.error || `Request failed: ${response.status}`);
  }
  return response.json();
};

export const listEvents = async (): Promise<AppEvent[]> => {
  const data = await requestJson<{ events: AppEvent[] }>('/api/events');
  return data.events || [];
};

export const registerForEvent = async (eventId: string, userId: string): Promise<AppEvent | null> => {
  const data = await requestJson<{ event: AppEvent | null }>(
    `/api/events/${encodeURIComponent(eventId)}/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }
  );
  return data.event;
};

export const createAdminEvent = async (event: {
  title: string;
  date: string;
  description: string;
  type: 'online' | 'physical';
  streamingPlatform?: string;
}): Promise<AppEvent | null> => {
  const data = await requestJson<{ event: AppEvent | null }>('/api/admin/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-email': ADMIN_EMAIL,
    },
    body: JSON.stringify({
      ...event,
      status: 'published',
    }),
  });
  return data.event;
};
