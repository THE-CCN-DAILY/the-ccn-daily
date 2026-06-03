import type { Highlight } from '../types';
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

const userHighlightsUrl = (userId: string, suffix = '') =>
  `/api/users/${encodeURIComponent(userId)}/highlights${suffix}`;

export const getHighlightsForContent = async (userId: string, contentId: string): Promise<Highlight[]> => {
  const data = await requestJson<{ highlights: Highlight[] }>(
    `${userHighlightsUrl(userId)}?contentId=${encodeURIComponent(contentId)}`,
    { headers: await adminAuthHeaders() }
  );

  return data.highlights.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
};

export const saveHighlight = async (userId: string, highlight: Highlight): Promise<void> => {
  await requestJson<{ highlight: Highlight }>(userHighlightsUrl(userId), {
    method: 'POST',
    headers: await adminAuthHeaders(),
    body: JSON.stringify(highlight),
  });
};

export const deleteHighlight = async (userId: string, highlightId: string): Promise<void> => {
  await requestJson<{ ok: true }>(userHighlightsUrl(userId, `/${encodeURIComponent(highlightId)}`), {
    method: 'DELETE',
    headers: await adminAuthHeaders(),
  });
};

export const updateHighlight = async (
  userId: string,
  highlightId: string,
  data: Partial<Pick<Highlight, 'note' | 'voiceNoteUrl' | 'tags'>>
): Promise<void> => {
  await requestJson<{ highlight: Highlight }>(userHighlightsUrl(userId, `/${encodeURIComponent(highlightId)}`), {
    method: 'PATCH',
    headers: await adminAuthHeaders(),
    body: JSON.stringify(data),
  });
};
