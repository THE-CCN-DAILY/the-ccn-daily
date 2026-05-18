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

const adminHeaders = () => ({ 'x-admin-email': ADMIN_EMAIL });

export const listCatalogContent = async (type: ContentType, includeDrafts = true): Promise<CatalogContentItem[]> => {
  const query = includeDrafts ? '?includeDrafts=true' : '';
  const data = await requestJson<{ items: CatalogContentItem[] }>(
    `/api/admin/content/${encodeURIComponent(type)}${query}`,
    { headers: adminHeaders() }
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
      headers: adminHeaders(),
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
      headers: adminHeaders(),
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
      headers: adminHeaders(),
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

export const getTodayDevotional = async (date: string): Promise<CatalogContentItem | null> => {
  const data = await requestJson<{ devotional: CatalogContentItem | null }>(
    `/api/devotionals/today?date=${encodeURIComponent(date)}`
  );
  return data.devotional;
};
