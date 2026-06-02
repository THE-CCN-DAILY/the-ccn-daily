import { adminAuthHeaders } from './adminAuth';

export interface LiveStreamStatus {
  status: 'offline' | 'live';
  isLive: boolean;
  playbackId?: string;
  streamId?: string;
  title: string;
  viewerCount: number;
  updatedAt?: string;
}

export interface LiveStreamMessage {
  id: string;
  user: string;
  userId: string;
  text: string;
  createdAt?: string;
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

export const getLiveStreamStatus = async (): Promise<LiveStreamStatus> => {
  const data = await requestJson<{ stream: LiveStreamStatus }>('/api/live/status');
  return data.stream;
};

export const updateAdminLiveStreamStatus = async (stream: {
  status: 'offline' | 'live';
  playbackId?: string;
  streamId?: string;
  title?: string;
  viewerCount?: number;
}): Promise<LiveStreamStatus> => {
  const data = await requestJson<{ stream: LiveStreamStatus }>('/api/admin/live/status', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(await adminAuthHeaders()),
    },
    body: JSON.stringify(stream),
  });
  return data.stream;
};

export const createStreamLiveInput = async (): Promise<{
  streamKey: string;
  playbackId: string;
  streamId: string;
  ingestUrl: string;
  customerSubdomain: string;
}> => {
  return requestJson('/api/stream/live', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await adminAuthHeaders()),
    },
  });
};

export const listLiveStreamMessages = async (limit = 100): Promise<LiveStreamMessage[]> => {
  const data = await requestJson<{ messages: LiveStreamMessage[] }>(
    `/api/live/chat/messages?limit=${encodeURIComponent(String(limit))}`
  );
  return data.messages || [];
};

export const sendLiveStreamMessage = async (message: {
  text: string;
  user: string;
  userId: string;
}): Promise<LiveStreamMessage | null> => {
  const data = await requestJson<{ message: LiveStreamMessage | null }>('/api/live/chat/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
  return data.message;
};
