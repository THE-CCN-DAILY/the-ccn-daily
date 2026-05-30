import { adminAuthHeaders } from './adminAuth';

export type ContentType = 'devotionals' | 'audiobooks' | 'books' | 'challenges' | 'courses';

export interface CatalogContentItem {
  id: string;
  title: string;
  description?: string;
  content?: string;
  author?: string;
  instructor?: string;
  date?: string;
  startDate?: string;
  createdAt?: string;
  updatedAt?: string;
  fileUrl?: string;
  coverUrl?: string;
  audioUrl?: string;
  status?: 'draft' | 'published' | 'archived';
  isPremium?: boolean;
  price?: number;
  participantsCount?: number;
  moduleCount?: number;
}

const ADMIN_EMAIL = 'pastor.eryeza@gmail.com';

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
};

// Admin requests authenticate with the signed-in user's Firebase ID token (see ./adminAuth).

export const listCatalogContent = async (type: ContentType, includeDrafts = true): Promise<CatalogContentItem[]> => {
  const query = includeDrafts ? '?includeDrafts=true' : '';
  const data = await requestJson<{ items: CatalogContentItem[] }>(
    `/api/admin/content/${encodeURIComponent(type)}${query}`,
    { headers: await adminAuthHeaders() }
  );
  return data.items;
};

export const saveCatalogContent = async (
  type: ContentType,
  item: Partial<CatalogContentItem> & { title: string }
): Promise<CatalogContentItem> => {
  const data = await requestJson<{ item: CatalogContentItem }>(
    `/api/admin/content/${encodeURIComponent(type)}`,
    {
      method: 'POST',
      headers: await adminAuthHeaders(),
      body: JSON.stringify(item),
    }
  );
  return data.item;
};

export const deleteCatalogContent = async (type: ContentType, id: string): Promise<void> => {
  await requestJson<{ ok: true }>(
    `/api/admin/content/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: await adminAuthHeaders(),
    }
  );
};

export const uploadCatalogMedia = async (
  type: ContentType,
  role: 'file' | 'cover' | 'audio',
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const form = new FormData();
  form.append('type', type);
  form.append('role', role);
  form.append('file', file);
  onProgress?.(15);

  const data = await requestJson<{ url: string }>(
    '/api/admin/content/media',
    {
      method: 'POST',
      headers: await adminAuthHeaders(),
      body: form,
    }
  );

  onProgress?.(100);
  return data.url;
};

export const listAudiobooks = async (): Promise<CatalogContentItem[]> => {
  const data = await requestJson<{ audiobooks: CatalogContentItem[] }>('/api/audiobooks');
  return data.audiobooks;
};

// Devotional source of truth = Firestore `devotionals` (Content Manager → Daily Devotionals tab).
// Devotionals are SEPARATE from public Blog essays (D1 `blog_posts`). Returns the latest PUBLISHED
// devotional dated on/before `date`. Filters in JS to avoid a composite Firestore index.
export const getTodayDevotional = async (date: string): Promise<CatalogContentItem | null> => {
  try {
    const { collection, getDocs, orderBy, query, limit } = await import('firebase/firestore');
    const { db } = await import('../firebase');
    const snap = await getDocs(query(collection(db, 'devotionals'), orderBy('date', 'desc'), limit(30)));
    const match = snap.docs
      .map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }))
      .find((d) => d.data.status === 'published' && typeof d.data.date === 'string' && (d.data.date as string) <= date);
    if (!match) return null;
    const doc = match.data;
    return {
      id: match.id,
      title: String(doc.title ?? ''),
      content: String(doc.body ?? doc.content ?? ''),
      author: typeof doc.author === 'string' ? doc.author : undefined,
      date: typeof doc.date === 'string' ? doc.date : undefined,
      audioUrl: typeof doc.audioUrl === 'string' ? doc.audioUrl : undefined,
      status: 'published',
    };
  } catch {
    return null;
  }
};
