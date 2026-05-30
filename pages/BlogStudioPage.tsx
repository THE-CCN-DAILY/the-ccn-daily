import React from 'react';
import { Eye, FilePenLine, Plus, RefreshCw, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  deleteBlogPost,
  listAllBlogPosts,
  saveBlogPost,
  type AdminBlogAuth,
  type BlogPost,
  type BlogPostInput,
} from '../services/blogService';

const emptyPost: BlogPostInput = {
  slug: '',
  title: '',
  excerpt: '',
  content: '',
  category: 'Devotional life',
  status: 'draft',
  authorName: 'THE CCN DAILY',
  audioUrl: '',
  seoTitle: '',
  seoDescription: '',
  publishedAt: '',
};

const statuses: BlogPostInput['status'][] = ['draft', 'published', 'archived'];

const BlogStudioPage: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = React.useState<BlogPost[]>([]);
  const [selected, setSelected] = React.useState<BlogPostInput>(emptyPost);
  const [adminEmail, setAdminEmail] = React.useState('');
  const [adminToken, setAdminToken] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  const auth = React.useMemo<AdminBlogAuth>(() => ({
    email: adminEmail.trim(),
    token: adminToken.trim(),
  }), [adminEmail, adminToken]);

  React.useEffect(() => {
    const storedEmail = localStorage.getItem('ccn_blog_admin_email') || '';
    const storedToken = localStorage.getItem('ccn_blog_admin_token') || '';
    setAdminEmail(storedEmail || user?.email || '');
    setAdminToken(storedToken);
  }, [user?.email]);

  React.useEffect(() => {
    if (adminEmail) localStorage.setItem('ccn_blog_admin_email', adminEmail);
    if (adminToken) localStorage.setItem('ccn_blog_admin_token', adminToken);
  }, [adminEmail, adminToken]);

  const loadPosts = React.useCallback(async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const nextPosts = await listAllBlogPosts(auth);
      setPosts(nextPosts);
      if (!selected.id && nextPosts[0]) setSelected(nextPosts[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load blog studio posts.');
    } finally {
      setLoading(false);
    }
  }, [auth, selected.id]);

  React.useEffect(() => {
    if (auth.email || auth.token) void loadPosts();
  }, [auth.email, auth.token, loadPosts]);

  const updateSelected = <K extends keyof BlogPostInput>(key: K, value: BlogPostInput[K]) => {
    setSelected((current) => ({ ...current, [key]: value }));
  };

  const handleNew = () => {
    setSelected({ ...emptyPost, authorName: user?.displayName || 'THE CCN DAILY' });
    setMessage('');
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const saved = await saveBlogPost(selected, auth);
      setSelected(saved);
      setPosts((current) => {
        const withoutSaved = current.filter((post) => post.id !== saved.id);
        return [saved, ...withoutSaved];
      });
      setMessage(saved.status === 'published' ? 'Published post saved to D1.' : 'Draft saved to D1.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this post.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post: BlogPost) => {
    const confirmed = window.confirm(`Delete "${post.title}" from the blog database?`);
    if (!confirmed) return;
    setError('');
    setMessage('');
    try {
      await deleteBlogPost(post.id, auth);
      setPosts((current) => current.filter((item) => item.id !== post.id));
      if (selected.id === post.id) setSelected(emptyPost);
      setMessage('Post deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this post.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-secondary px-6 py-8 text-brand-text-primary">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-brand-border pb-8">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-text-secondary">
            <FilePenLine className="h-4 w-4" /> Founder publishing
          </p>
          <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="font-display text-5xl font-bold leading-tight">Blog Studio</h1>
              <p className="mt-4 max-w-2xl text-[17px] leading-[1.8] text-brand-text-secondary">
                Draft, publish, archive, and review devotional essays from the Cloudflare D1 publishing table.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleNew}
                className="inline-flex items-center gap-2 border border-brand-border px-5 py-3 text-sm font-semibold hover:border-brand-accent hover:text-brand-accent"
              >
                <Plus className="h-4 w-4" /> New post
              </button>
              <button
                type="button"
                onClick={loadPosts}
                className="inline-flex items-center gap-2 border border-brand-border px-5 py-3 text-sm font-semibold hover:border-brand-accent hover:text-brand-accent"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
          </div>
        </header>

        <section className="mt-8 border-b border-brand-border pb-8">
          <p className="flex items-center gap-2 text-sm text-brand-text-secondary">
            <ShieldCheck className="h-4 w-4 text-brand-accent" />
            Publishing uses your signed-in admin session automatically — no email or token needed.
          </p>
        </section>

        {(message || error) && (
          <div className={`mt-6 border p-4 text-sm ${error ? 'border-status-error/40 bg-status-error/10' : 'border-status-success/40 bg-status-success/10'}`}>
            {error || message}
          </div>
        )}

        <main className="mt-8 grid gap-10 lg:grid-cols-[0.55fr_1fr]">
          <aside className="border-y border-brand-border">
            {posts.length === 0 && (
              <div className="py-12 text-sm text-brand-text-secondary">
                {loading ? 'Loading D1 posts...' : 'No posts loaded yet. Check the admin gate above, then refresh.'}
              </div>
            )}
            {posts.map((post) => (
              <div key={post.id} className="border-b border-brand-border py-5">
                <button
                  type="button"
                  onClick={() => setSelected(post)}
                  className="block w-full text-left"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-text-secondary">
                    {post.status} / {post.category}
                  </span>
                  <span className="mt-2 block font-display text-2xl font-bold leading-tight hover:text-brand-accent">
                    {post.title}
                  </span>
                </button>
                <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-brand-text-secondary">
                  {post.status === 'published' && (
                    <Link to={`/blog/${post.slug}`} className="inline-flex items-center gap-1 hover:text-brand-accent">
                      <Eye className="h-3.5 w-3.5" /> View
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleDelete(post)}
                    className="inline-flex items-center gap-1 hover:text-status-error"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </aside>

          <section className="space-y-6">
            <div className="grid gap-6 md:grid-cols-[1fr_0.35fr]">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-brand-text-secondary">
                  Title
                </span>
                <input
                  value={selected.title}
                  onChange={(event) => updateSelected('title', event.target.value)}
                  className="h-14 w-full border border-brand-border bg-brand-secondary px-4 font-display text-2xl font-bold outline-none focus:border-brand-accent"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-brand-text-secondary">
                  Status
                </span>
                <select
                  value={selected.status}
                  onChange={(event) => updateSelected('status', event.target.value as BlogPostInput['status'])}
                  className="h-14 w-full border border-brand-border bg-brand-secondary px-4 text-sm font-semibold outline-none focus:border-brand-accent"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-brand-text-secondary">
                  Slug
                </span>
                <input
                  value={selected.slug}
                  onChange={(event) => updateSelected('slug', event.target.value)}
                  placeholder="generated from title if left empty"
                  className="h-12 w-full border border-brand-border bg-brand-secondary px-4 text-sm outline-none focus:border-brand-accent"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-brand-text-secondary">
                  Category
                </span>
                <input
                  value={selected.category}
                  onChange={(event) => updateSelected('category', event.target.value)}
                  className="h-12 w-full border border-brand-border bg-brand-secondary px-4 text-sm outline-none focus:border-brand-accent"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-brand-text-secondary">
                Excerpt
              </span>
              <textarea
                value={selected.excerpt}
                onChange={(event) => updateSelected('excerpt', event.target.value)}
                rows={3}
                className="w-full border border-brand-border bg-brand-secondary p-4 text-[15px] leading-7 outline-none focus:border-brand-accent"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-brand-text-secondary">
                Essay body
              </span>
              <textarea
                value={selected.content}
                onChange={(event) => updateSelected('content', event.target.value)}
                rows={15}
                className="w-full border border-brand-border bg-brand-secondary p-4 font-mono text-sm leading-7 outline-none focus:border-brand-accent"
              />
            </label>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-brand-text-secondary">
                  Audio URL
                </span>
                <input
                  value={selected.audioUrl || ''}
                  onChange={(event) => updateSelected('audioUrl', event.target.value)}
                  className="h-12 w-full border border-brand-border bg-brand-secondary px-4 text-sm outline-none focus:border-brand-accent"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-brand-text-secondary">
                  SEO title
                </span>
                <input
                  value={selected.seoTitle || ''}
                  onChange={(event) => updateSelected('seoTitle', event.target.value)}
                  className="h-12 w-full border border-brand-border bg-brand-secondary px-4 text-sm outline-none focus:border-brand-accent"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-brand-text-secondary">
                SEO description
              </span>
              <textarea
                value={selected.seoDescription || ''}
                onChange={(event) => updateSelected('seoDescription', event.target.value)}
                rows={3}
                className="w-full border border-brand-border bg-brand-secondary p-4 text-sm leading-7 outline-none focus:border-brand-accent"
              />
            </label>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !selected.title.trim()}
              className="inline-flex items-center gap-2 border border-brand-accent bg-brand-accent px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save post'}
            </button>
          </section>
        </main>
      </div>
    </div>
  );
};

export default BlogStudioPage;
