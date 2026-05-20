export interface CommunityPrayerRequest {
  id: string;
  text: string;
  author: string;
  authorUid?: string;
  prayerCount: number;
  testimony?: string;
  isAnonymous: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommunityMessage {
  id: string;
  user: string;
  userId: string;
  text: string;
  createdAt?: string;
}

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.error || `Request failed: ${response.status}`);
  }
  return response.json();
};

export const listPrayerRequests = async (): Promise<CommunityPrayerRequest[]> => {
  const data = await requestJson<{ requests: CommunityPrayerRequest[] }>('/api/community/prayer-requests');
  return data.requests || [];
};

export const createPrayerRequest = async (request: {
  text: string;
  author: string;
  authorUid?: string;
  isAnonymous: boolean;
  prayerCount?: number;
}): Promise<CommunityPrayerRequest | null> => {
  const data = await requestJson<{ request: CommunityPrayerRequest | null }>('/api/community/prayer-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return data.request;
};

export const prayForRequest = async (
  requestId: string,
  userId: string
): Promise<CommunityPrayerRequest | null> => {
  const data = await requestJson<{ request: CommunityPrayerRequest | null }>(
    `/api/community/prayer-requests/${encodeURIComponent(requestId)}/pray`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }
  );
  return data.request;
};

export const listCommunityMessages = async (limit = 50): Promise<CommunityMessage[]> => {
  const data = await requestJson<{ messages: CommunityMessage[] }>(
    `/api/community/rooms/messages?limit=${encodeURIComponent(String(limit))}`
  );
  return data.messages || [];
};

export const sendCommunityMessage = async (message: {
  text: string;
  user: string;
  userId: string;
}): Promise<CommunityMessage | null> => {
  const data = await requestJson<{ message: CommunityMessage | null }>('/api/community/rooms/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
  return data.message;
};
