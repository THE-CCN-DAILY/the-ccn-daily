import { adminAuthHeaders } from './adminAuth';

export interface JournalEntry {
  id: string;
  userId?: string;
  text: string;
  color: 'blue' | 'green' | 'yellow' | 'pink';
  prompt?: string;
  createdAt: string;
  updatedAt?: string;
}

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

const journalUrl = (userId: string, suffix = '') =>
  `/api/users/${encodeURIComponent(userId)}/journal${suffix}`;

export const listJournalEntries = async (userId: string): Promise<JournalEntry[]> => {
  const data = await requestJson<{ entries: JournalEntry[] }>(journalUrl(userId), {
    headers: await adminAuthHeaders(),
  });
  return data.entries.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
};

export const saveJournalEntry = async (
  userId: string,
  entry: Pick<JournalEntry, 'id' | 'text' | 'color' | 'createdAt'> & Partial<Pick<JournalEntry, 'prompt'>>
): Promise<JournalEntry> => {
  const data = await requestJson<{ entry: JournalEntry | null }>(journalUrl(userId), {
    method: 'POST',
    headers: await adminAuthHeaders(),
    body: JSON.stringify(entry),
  });

  if (!data.entry) throw new Error('Journal entry was not returned by the API');
  return data.entry;
};

export const deleteJournalEntry = async (userId: string, entryId: string): Promise<void> => {
  await requestJson<{ ok: true }>(journalUrl(userId, `/${encodeURIComponent(entryId)}`), {
    method: 'DELETE',
    headers: await adminAuthHeaders(),
  });
};
