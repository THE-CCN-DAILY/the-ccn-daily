export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  authorName: string;
  audioUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type BlogPostInput = Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };

export interface AdminBlogAuth {
  email?: string;
  token?: string;
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

const adminHeaders = (auth?: AdminBlogAuth): HeadersInit => {
  const headers: Record<string, string> = {};
  if (auth?.email) headers['x-admin-email'] = auth.email;
  if (auth?.token) headers['x-admin-token'] = auth.token;
  return headers;
};

export const listPublishedBlogPosts = async (): Promise<BlogPost[]> => {
  const data = await requestJson<{ posts: BlogPost[] }>('/api/blog/posts');
  return data.posts;
};

export const getPublishedBlogPost = async (slug: string): Promise<BlogPost> => {
  const data = await requestJson<{ post: BlogPost }>(`/api/blog/posts/${encodeURIComponent(slug)}`);
  return data.post;
};

export const listAllBlogPosts = async (auth?: AdminBlogAuth): Promise<BlogPost[]> => {
  const data = await requestJson<{ posts: BlogPost[] }>('/api/admin/blog/posts', {
    headers: adminHeaders(auth),
  });
  return data.posts;
};

export const saveBlogPost = async (post: BlogPostInput, auth?: AdminBlogAuth): Promise<BlogPost> => {
  const data = await requestJson<{ post: BlogPost }>('/api/admin/blog/posts', {
    method: 'POST',
    headers: adminHeaders(auth),
    body: JSON.stringify(post),
  });
  return data.post;
};

export const deleteBlogPost = async (id: string, auth?: AdminBlogAuth): Promise<void> => {
  await requestJson<{ ok: true }>(`/api/admin/blog/posts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: adminHeaders(auth),
  });
};
