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

// Single devotional source of truth: the latest PUBLISHED Blog Studio post (D1 `blog_posts`,
// served newest-first by /api/blog/posts). The same content powers the public Blog AND the
// guided journey's Daily Sanctuary, so "publish in Blog Studio" == "appears everywhere".
export const getTodayDevotional = async (_date: string): Promise<CatalogContentItem | null> => {
  try {
    const data = await requestJson<{
      posts: Array<{ id: string; title?: string; content?: string; publishedAt?: string; audioUrl?: string; authorName?: string }>;
    }>('/api/blog/posts');
    const post = data.posts?.[0];
    if (!post) return null;
    return {
      id: post.id,
      title: String(post.title ?? ''),
      content: String(post.content ?? ''),
      author: post.authorName,
      date: post.publishedAt,
      audioUrl: post.audioUrl,
      status: 'published',
    };
  } catch {
    return null;
  }
};
