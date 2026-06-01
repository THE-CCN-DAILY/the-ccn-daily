import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, BookMarked, Calendar, Pencil, Plus, Trash2, Mic, Mail, Layers } from 'lucide-react';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import MediaUpload from '../components/MediaUpload';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import {
  CatalogContentItem,
  ContentType,
  deleteCatalogContent,
  listCatalogContent,
  saveCatalogContent,
  uploadCatalogMedia,
} from '../services/contentService';
import {
  listBooks,
  saveBook,
  updateBook,
  deleteBook,
  listReadingPlans,
  saveReadingPlan,
  updateReadingPlan,
  deleteReadingPlan,
} from '../services/booksService';
import { CloseIcon, GamificationIcon, ReaderIcon, SparklesIcon, SpeakerWaveIcon } from '../components/icons';
import type {
  Book,
  BookVariant,
  BookVariantType,
  BookPurchaseLink,
  PodPlatformId,
  ReadingPlan,
  ReadingPlanItem,
} from '../types';

type UploadRole = 'file' | 'cover' | 'audio';

type TabId = ContentType | 'written-devotionals' | 'books-library' | 'reading-plans' | 'podcasts' | 'newsletters';

const TABS: Array<{ id: TabId; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }> = [
  { id: 'written-devotionals', label: 'Devotionals', icon: (props) => <BookOpen {...props} /> },
  { id: 'devotionals', label: 'Daily Devotionals', icon: SparklesIcon },
  { id: 'audiobooks', label: 'Audiobooks', icon: SpeakerWaveIcon },
  { id: 'books', label: 'Books (EPUB/PDF)', icon: ReaderIcon },
  { id: 'challenges', label: 'Challenges', icon: GamificationIcon },
  { id: 'courses', label: 'Courses', icon: SparklesIcon },
  { id: 'podcasts', label: 'Podcasts', icon: (props) => <Mic {...props} /> },
  { id: 'newsletters', label: 'Newsletters', icon: (props) => <Mail {...props} /> },
  { id: 'books-library', label: 'Books Library', icon: (props) => <BookMarked {...props} /> },
  { id: 'reading-plans', label: 'Reading Plans', icon: (props) => <Calendar {...props} /> },
];

// ─── Devotionals Tab ────────────────────────────────────────────────────────

interface DevotionalDoc {
  id: string;
  title: string;
  scriptureRef: string;
  scriptureText: string;
  body: string;
  author: string;
  status: 'draft' | 'published';
  date: string;
  authorName?: string;
  authorPhotoUrl?: string;
  authorBio?: string;
  authorWebsiteUrl?: string;
  authorTwitterHandle?: string;
}

const emptyForm = () => ({
  title: '',
  scriptureRef: '',
  scriptureText: '',
  body: '',
  author: 'Eryeza Kalalu',
  status: 'draft' as 'draft' | 'published',
  date: new Date().toISOString().split('T')[0],
  authorName: 'Eryeza Kalalu',
  authorPhotoUrl: '',
  authorBio: '',
  authorWebsiteUrl: '',
  authorTwitterHandle: '',
});

const DevotionalsTab: React.FC = () => {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [devotionals, setDevotionals] = useState<DevotionalDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const loadDevotionals = async () => {
    setLoading(true);
    try {
      const { collection, getDocs, orderBy, query } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      const q = query(collection(db, 'devotionals'), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      setDevotionals(snap.docs.map(d => ({ id: d.id, ...d.data() } as DevotionalDoc)));
    } catch {
      // Firestore may not be set up yet — show empty state
    }
    setLoading(false);
  };

  useEffect(() => { loadDevotionals(); }, []);

  const handleSave = async () => {
    if (!user) {
      notify('You must be signed in as an admin to save.', 'error');
      return;
    }
    setSaving(true);
    try {
      const { collection, addDoc, doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      if (editingId) {
        await updateDoc(doc(db, 'devotionals', editingId), {
          ...form,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'devotionals'), {
          ...form,
          authorUid: user.uid, // required by Firestore rules for ownership
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm());
      await loadDevotionals();
      notify(editingId ? 'Devotional updated.' : 'Devotional published.', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save the devotional. Please try again.', 'error');
    }
    setSaving(false);
  };

  const handleEdit = (dev: DevotionalDoc) => {
    setForm({
      title: dev.title,
      scriptureRef: dev.scriptureRef,
      scriptureText: dev.scriptureText,
      body: dev.body,
      author: dev.author,
      status: dev.status,
      date: dev.date,
      authorName: dev.authorName ?? '',
      authorPhotoUrl: dev.authorPhotoUrl ?? '',
      authorBio: dev.authorBio ?? '',
      authorWebsiteUrl: dev.authorWebsiteUrl ?? '',
      authorTwitterHandle: dev.authorTwitterHandle ?? '',
    });
    setEditingId(dev.id);
    setShowForm(true);
  };

  const handleDelete = async (dev: DevotionalDoc) => {
    if (!window.confirm(`Delete "${dev.title}"?`)) return;
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      await deleteDoc(doc(db, 'devotionals', dev.id));
      await loadDevotionals();
    } catch {
      // Delete error
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const field = (label: string, el: React.ReactNode) => (
    <div>
      <label className="block text-sm font-bold text-brand-text-primary mb-2">{label}</label>
      {el}
    </div>
  );

  const inputCls = "w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: form */}
      <div className="lg:col-span-1">
        <Card className="border-brand-border bg-brand-dark/30 sticky top-24">
          {showForm ? (
            <>
              <h2 className="text-xl font-bold text-brand-text-primary mb-6 border-b border-brand-border pb-4">
                {editingId ? 'Edit Devotional' : 'New Devotional'}
              </h2>
              <div className="space-y-5">
                {field('Title', <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} placeholder="Devotional title..." />)}
                {field('Scripture Reference', <input type="text" value={form.scriptureRef} onChange={e => setForm(f => ({ ...f, scriptureRef: e.target.value }))} className={inputCls} placeholder="e.g. John 3:16" />)}
                {field('Scripture Text', <textarea value={form.scriptureText} onChange={e => setForm(f => ({ ...f, scriptureText: e.target.value }))} rows={3} className={`${inputCls} resize-none`} placeholder="The scripture passage..." />)}
                {field('Body', <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={6} className={`${inputCls} resize-none`} placeholder="The devotional content..." />)}
                {field('Author', <input type="text" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} className={inputCls} />)}
                {field('Date', <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />)}
                {field('Status', (
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'draft' | 'published' }))} className={inputCls}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                ))}

                {/* Author Information */}
                <div className="border-t border-brand-border pt-5">
                  <h3 className="text-sm font-bold text-brand-text-secondary uppercase tracking-wider mb-4">Author Information</h3>
                  <div className="space-y-4">
                    {field('Author Name', <input type="text" value={form.authorName} onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))} className={inputCls} placeholder="Full name of the author" />)}
                    <MediaUpload
                      label="Author Photo"
                      kind="image"
                      value={form.authorPhotoUrl}
                      alt={form.authorName}
                      onChange={(url) => setForm(f => ({ ...f, authorPhotoUrl: url }))}
                      upload={(file, onProgress) => uploadCatalogMedia('devotionals', 'cover', file, onProgress)}
                    />
                    {field('Author Bio', <textarea value={form.authorBio} onChange={e => setForm(f => ({ ...f, authorBio: e.target.value }))} rows={3} className={`${inputCls} resize-none`} placeholder="Pastor at [church]. Author of [book]. Passionate about..." />)}
                    <p className="text-xs text-brand-text-secondary -mt-3">Max 3 sentences.</p>
                    {field('Author Website', <input type="url" value={form.authorWebsiteUrl} onChange={e => setForm(f => ({ ...f, authorWebsiteUrl: e.target.value }))} className={inputCls} placeholder="https://… (optional)" />)}
                    {field('Twitter/X Handle', <input type="text" value={form.authorTwitterHandle} onChange={e => setForm(f => ({ ...f, authorTwitterHandle: e.target.value }))} className={inputCls} placeholder="@handle (optional)" />)}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={handleSave} disabled={saving || !form.title} className="flex-1 py-3 rounded-xl font-bold bg-brand-accent text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-wait transition-colors">
                    {saving ? 'Saving…' : editingId ? 'Update' : 'Save'}
                  </button>
                  <button onClick={handleCancel} className="px-5 py-3 rounded-xl font-bold bg-brand-dark border border-brand-border text-brand-text-secondary hover:text-brand-text-primary transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-10 h-10 mx-auto mb-4 text-brand-text-secondary/40" />
              <p className="text-brand-text-secondary mb-6 text-sm">Create human-written devotionals for the community.</p>
              <button onClick={() => setShowForm(true)} className="px-6 py-3 rounded-xl font-bold bg-brand-accent text-white hover:bg-opacity-90 transition-colors">
                + New Devotional
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* Right: list */}
      <div className="lg:col-span-2">
        <Card className="border-brand-border bg-brand-dark/30 min-h-[600px]">
          <h2 className="text-xl font-bold text-brand-text-primary mb-6 border-b border-brand-border pb-4 flex justify-between items-center">
            <span>Devotionals</span>
            <span className="text-sm font-normal text-brand-text-secondary bg-brand-secondary px-3 py-1 rounded-full">
              {devotionals.length} items
            </span>
          </h2>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent" />
            </div>
          ) : devotionals.length > 0 ? (
            <div className="space-y-3">
              {devotionals.map(dev => (
                <div key={dev.id} className="flex items-center justify-between p-4 rounded-xl border border-brand-border bg-brand-dark/50 hover:border-brand-accent/50 transition-colors">
                  <div className="flex items-center gap-4 overflow-hidden min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-brand-secondary flex-shrink-0 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-brand-text-secondary/50" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-brand-text-primary font-bold truncate">{dev.title}</h4>
                      <p className="text-xs text-brand-text-secondary truncate">{dev.scriptureRef} · {dev.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full whitespace-nowrap ${dev.status === 'published' ? 'bg-green-500/15 text-green-400' : 'bg-brand-secondary text-brand-text-secondary'}`}>
                      {dev.status}
                    </span>
                    <button onClick={() => handleEdit(dev)} className="p-2 text-brand-text-secondary hover:text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(dev)} className="p-2 text-brand-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen className="w-8 h-8" />}
              heading="No devotionals yet"
              subtext="Use the form to create the first one."
            />
          )}
        </Card>
      </div>
    </div>
  );
};

const singular = (type: ContentType) => type === 'audiobooks' ? 'audiobook' : type.slice(0, -1);

// ─── POD Platforms ───────────────────────────────────────────────────────────

const POD_PLATFORM_OPTIONS: Array<{ value: PodPlatformId; label: string }> = [
  { value: 'amazon_kdp',    label: 'Amazon KDP' },
  { value: 'apple_books',   label: 'Apple Books' },
  { value: 'google_play',   label: 'Google Play' },
  { value: 'kobo',          label: 'Kobo' },
  { value: 'barnes_noble',  label: 'Barnes & Noble' },
  { value: 'draft2digital', label: 'Draft2Digital' },
  { value: 'smashwords',    label: 'Smashwords' },
  { value: 'lulu',          label: 'Lulu' },
  { value: 'ingramspark',   label: 'IngramSpark' },
  { value: 'bookbaby',      label: 'BookBaby' },
  { value: 'custom',        label: 'Other / Custom' },
];

const INPUT_CLS = "w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent";

const emptyVariant = (): BookVariant => ({
  id: Date.now().toString(),
  type: 'ebook',
  isFree: true,
});

const emptyLink = (): BookPurchaseLink => ({
  id: Date.now().toString(),
  platform: 'amazon_kdp',
  name: '',
  url: '',
});

const emptyBook = (): Omit<Book, 'id' | 'createdAt' | 'updatedAt'> => ({
  title: '',
  subtitle: '',
  author: 'Pastor Eryeza Kalalu',
  description: '',
  isbn: '',
  category: '',
  coverUrl: '',
  status: 'draft',
  variants: [],
  purchaseLinks: [],
});

// ─── Books Manager Tab ───────────────────────────────────────────────────────

const BooksManagerTab: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyBook());

  const load = async () => {
    setLoading(true);
    listBooks(false).then(setBooks).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await updateBook(editingId, form);
      } else {
        await saveBook(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyBook());
      await load();
    } catch {
      // save error — form stays open
    }
    setSaving(false);
  };

  const handleEdit = (book: Book) => {
    setForm({
      title: book.title,
      subtitle: book.subtitle ?? '',
      author: book.author,
      description: book.description,
      isbn: book.isbn ?? '',
      category: book.category,
      coverUrl: book.coverUrl ?? '',
      status: book.status,
      variants: book.variants,
      purchaseLinks: book.purchaseLinks,
    });
    setEditingId(book.id);
    setShowForm(true);
  };

  const handleDelete = async (book: Book) => {
    if (!window.confirm(`Delete "${book.title}"?`)) return;
    await deleteBook(book.id);
    await load();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyBook());
  };

  // Variant helpers
  const addVariant = () => setForm(f => ({ ...f, variants: [...f.variants, emptyVariant()] }));
  const updateVariant = (idx: number, patch: Partial<BookVariant>) =>
    setForm(f => ({ ...f, variants: f.variants.map((v, i) => i === idx ? { ...v, ...patch } : v) }));
  const removeVariant = (idx: number) =>
    setForm(f => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }));

  // Purchase link helpers
  const addLink = () => setForm(f => ({ ...f, purchaseLinks: [...f.purchaseLinks, emptyLink()] }));
  const updateLink = (idx: number, patch: Partial<BookPurchaseLink>) =>
    setForm(f => ({ ...f, purchaseLinks: f.purchaseLinks.map((l, i) => i === idx ? { ...l, ...patch } : l) }));
  const removeLink = (idx: number) =>
    setForm(f => ({ ...f, purchaseLinks: f.purchaseLinks.filter((_, i) => i !== idx) }));

  const field = (label: string, el: React.ReactNode) => (
    <div>
      <label className="block text-sm font-bold text-brand-text-primary mb-2">{label}</label>
      {el}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form */}
      <div className="lg:col-span-1">
        <Card className="border-brand-border bg-brand-dark/30 sticky top-24">
          {showForm ? (
            <>
              <h2 className="text-xl font-bold text-brand-text-primary mb-6 border-b border-brand-border pb-4">
                {editingId ? 'Edit Book' : 'New Book'}
              </h2>
              <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">
                {field('Title *', <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={INPUT_CLS} placeholder="Book title…" />)}
                {field('Subtitle', <input type="text" value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} className={INPUT_CLS} placeholder="Optional subtitle…" />)}
                {field('Author *', <input type="text" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} className={INPUT_CLS} />)}
                {field('Category *', <input type="text" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={INPUT_CLS} placeholder="e.g. Devotional, Leadership…" />)}
                {field('Description *', <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className={`${INPUT_CLS} resize-none`} placeholder="Short description…" />)}
                <MediaUpload
                  label="Cover"
                  kind="image"
                  value={form.coverUrl}
                  onChange={(url) => setForm(f => ({ ...f, coverUrl: url }))}
                  upload={(file, onProgress) => uploadCatalogMedia('books', 'cover', file, onProgress)}
                />
                {field('ISBN', <input type="text" value={form.isbn} onChange={e => setForm(f => ({ ...f, isbn: e.target.value }))} className={INPUT_CLS} placeholder="978-…" />)}
                {field('Status', (
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'draft' | 'published' }))} className={INPUT_CLS}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                ))}

                {/* Variants */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-brand-text-primary">Variants</label>
                    <button onClick={addVariant} type="button" className="flex items-center gap-1 text-xs font-bold text-brand-accent hover:underline">
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                  <div className="space-y-4">
                    {form.variants.map((v, idx) => (
                      <div key={v.id} className="border border-brand-border rounded-xl p-3 bg-brand-dark/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <select value={v.type} onChange={e => updateVariant(idx, { type: e.target.value as BookVariantType })} className={`${INPUT_CLS} text-sm py-1.5`}>
                            <option value="ebook">Ebook</option>
                            <option value="audiobook">Audiobook</option>
                            <option value="print">Print</option>
                            <option value="translation">Translation</option>
                          </select>
                          <button onClick={() => removeVariant(idx)} type="button" className="ml-2 p-1 text-brand-text-secondary hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {(v.type === 'ebook' || v.type === 'audiobook') && (
                          <input type="url" value={v.fileUrl ?? ''} onChange={e => updateVariant(idx, { fileUrl: e.target.value })} className={`${INPUT_CLS} text-sm py-1.5`} placeholder="File URL (epub, pdf, mp3)…" />
                        )}
                        {v.type === 'ebook' && (
                          <select value={v.format ?? ''} onChange={e => updateVariant(idx, { format: e.target.value as 'epub' | 'pdf' })} className={`${INPUT_CLS} text-sm py-1.5`}>
                            <option value="">Format…</option>
                            <option value="epub">EPUB</option>
                            <option value="pdf">PDF</option>
                          </select>
                        )}
                        {v.type === 'translation' && (
                          <>
                            <input type="text" value={v.language ?? ''} onChange={e => updateVariant(idx, { language: e.target.value })} className={`${INPUT_CLS} text-sm py-1.5`} placeholder="ISO code (sw, fr, lg…)" />
                            <input type="text" value={v.languageName ?? ''} onChange={e => updateVariant(idx, { languageName: e.target.value })} className={`${INPUT_CLS} text-sm py-1.5`} placeholder="Language name (Swahili…)" />
                            <input type="url" value={v.fileUrl ?? ''} onChange={e => updateVariant(idx, { fileUrl: e.target.value })} className={`${INPUT_CLS} text-sm py-1.5`} placeholder="File URL…" />
                          </>
                        )}
                        {v.type === 'print' && (
                          <>
                            <select value={v.printFormat ?? ''} onChange={e => updateVariant(idx, { printFormat: e.target.value as 'paperback' | 'hardcover' })} className={`${INPUT_CLS} text-sm py-1.5`}>
                              <option value="">Format…</option>
                              <option value="paperback">Paperback</option>
                              <option value="hardcover">Hardcover</option>
                            </select>
                            <input type="text" value={v.region ?? ''} onChange={e => updateVariant(idx, { region: e.target.value })} className={`${INPUT_CLS} text-sm py-1.5`} placeholder="Region (Global, Africa…)" />
                            <input type="url" value={v.purchaseUrl ?? ''} onChange={e => updateVariant(idx, { purchaseUrl: e.target.value })} className={`${INPUT_CLS} text-sm py-1.5`} placeholder="Direct purchase URL…" />
                          </>
                        )}
                        <div className="flex gap-2">
                          <input type="number" min={0} step={0.01} value={v.price ?? ''} onChange={e => updateVariant(idx, { price: e.target.value === '' ? undefined : Number(e.target.value) })} className={`${INPUT_CLS} text-sm py-1.5 flex-1`} placeholder="Price" />
                          <input type="text" value={v.currency ?? 'USD'} onChange={e => updateVariant(idx, { currency: e.target.value })} className={`${INPUT_CLS} text-sm py-1.5 w-20`} placeholder="USD" />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-brand-text-secondary cursor-pointer">
                          <input type="checkbox" checked={v.isFree} onChange={e => updateVariant(idx, { isFree: e.target.checked })} className="rounded" />
                          Free
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Purchase Links */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-brand-text-primary">Purchase Links</label>
                    <button onClick={addLink} type="button" className="flex items-center gap-1 text-xs font-bold text-brand-accent hover:underline">
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                  <div className="space-y-3">
                    {form.purchaseLinks.map((link, idx) => (
                      <div key={link.id} className="border border-brand-border rounded-xl p-3 bg-brand-dark/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <select value={link.platform} onChange={e => updateLink(idx, { platform: e.target.value as PodPlatformId })} className={`${INPUT_CLS} text-sm py-1.5`}>
                            {POD_PLATFORM_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <button onClick={() => removeLink(idx)} type="button" className="ml-2 p-1 text-brand-text-secondary hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {link.platform === 'custom' && (
                          <input type="text" value={link.name} onChange={e => updateLink(idx, { name: e.target.value })} className={`${INPUT_CLS} text-sm py-1.5`} placeholder="Platform name…" />
                        )}
                        <input type="url" value={link.url} onChange={e => updateLink(idx, { url: e.target.value })} className={`${INPUT_CLS} text-sm py-1.5`} placeholder="https://…" />
                        <input type="text" value={link.region ?? ''} onChange={e => updateLink(idx, { region: e.target.value })} className={`${INPUT_CLS} text-sm py-1.5`} placeholder="Region (Global, Africa…)" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={handleSave} disabled={saving || !form.title || !form.author || !form.description || !form.category} className="flex-1 py-3 rounded-xl font-bold bg-brand-accent text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-wait transition-colors">
                    {saving ? 'Saving…' : editingId ? 'Update' : 'Save'}
                  </button>
                  <button onClick={handleCancel} className="px-5 py-3 rounded-xl font-bold bg-brand-dark border border-brand-border text-brand-text-secondary hover:text-brand-text-primary transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <BookMarked className="w-10 h-10 mx-auto mb-4 text-brand-text-secondary/40" />
              <p className="text-brand-text-secondary mb-6 text-sm">Manage books, ebooks, audiobooks and print editions.</p>
              <button onClick={() => setShowForm(true)} className="px-6 py-3 rounded-xl font-bold bg-brand-accent text-white hover:bg-opacity-90 transition-colors">
                + New Book
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* List */}
      <div className="lg:col-span-2">
        <Card className="border-brand-border bg-brand-dark/30 min-h-[600px]">
          <h2 className="text-xl font-bold text-brand-text-primary mb-6 border-b border-brand-border pb-4 flex justify-between items-center">
            <span>Books Library</span>
            <span className="text-sm font-normal text-brand-text-secondary bg-brand-secondary px-3 py-1 rounded-full">
              {books.length} items
            </span>
          </h2>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent" />
            </div>
          ) : books.length > 0 ? (
            <div className="space-y-3">
              {books.map(book => (
                <div key={book.id} className="flex items-center justify-between p-4 rounded-xl border border-brand-border bg-brand-dark/50 hover:border-brand-accent/50 transition-colors">
                  <div className="flex items-center gap-4 overflow-hidden min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-brand-secondary flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookMarked className="w-5 h-5 text-brand-text-secondary/50" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-brand-text-primary font-bold truncate">{book.title}</h4>
                      <p className="text-xs text-brand-text-secondary truncate">
                        {book.author} · {book.variants.length} variant{book.variants.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full whitespace-nowrap ${book.status === 'published' ? 'bg-green-500/15 text-green-400' : 'bg-brand-secondary text-brand-text-secondary'}`}>
                      {book.status}
                    </span>
                    <button onClick={() => handleEdit(book)} className="p-2 text-brand-text-secondary hover:text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(book)} className="p-2 text-brand-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<BookMarked className="w-8 h-8" />}
              heading="No books yet"
              subtext="Use the form to add the first one."
            />
          )}
        </Card>
      </div>
    </div>
  );
};

// ─── Reading Plans Manager Tab ───────────────────────────────────────────────

const emptyPlanItem = (): ReadingPlanItem => ({
  day: 1,
  title: '',
});

const emptyPlan = (): Omit<ReadingPlan, 'id' | 'createdAt' | 'updatedAt'> => ({
  title: '',
  description: '',
  category: '',
  coverUrl: '',
  totalDays: 7,
  isFree: true,
  isPremium: false,
  status: 'draft',
  items: [],
});

const ReadingPlansManagerTab: React.FC = () => {
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyPlan());

  const load = async () => {
    setLoading(true);
    listReadingPlans(false).then(setPlans).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await updateReadingPlan(editingId, form);
      } else {
        await saveReadingPlan(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyPlan());
      await load();
    } catch {
      // save error — form stays open
    }
    setSaving(false);
  };

  const handleEdit = (plan: ReadingPlan) => {
    setForm({
      title: plan.title,
      description: plan.description,
      category: plan.category,
      coverUrl: plan.coverUrl ?? '',
      totalDays: plan.totalDays,
      isFree: plan.isFree,
      isPremium: plan.isPremium,
      status: plan.status,
      items: plan.items,
    });
    setEditingId(plan.id);
    setShowForm(true);
  };

  const handleDelete = async (plan: ReadingPlan) => {
    if (!window.confirm(`Delete "${plan.title}"?`)) return;
    await deleteReadingPlan(plan.id);
    await load();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyPlan());
  };

  const addItem = () => {
    const nextDay = form.items.length > 0 ? Math.max(...form.items.map(i => i.day)) + 1 : 1;
    setForm(f => ({ ...f, items: [...f.items, { ...emptyPlanItem(), day: nextDay }] }));
  };

  const updateItem = (idx: number, patch: Partial<ReadingPlanItem>) =>
    setForm(f => ({ ...f, items: f.items.map((item, i) => i === idx ? { ...item, ...patch } : item) }));

  const removeItem = (idx: number) =>
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const field = (label: string, el: React.ReactNode) => (
    <div>
      <label className="block text-sm font-bold text-brand-text-primary mb-2">{label}</label>
      {el}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form */}
      <div className="lg:col-span-1">
        <Card className="border-brand-border bg-brand-dark/30 sticky top-24">
          {showForm ? (
            <>
              <h2 className="text-xl font-bold text-brand-text-primary mb-6 border-b border-brand-border pb-4">
                {editingId ? 'Edit Plan' : 'New Reading Plan'}
              </h2>
              <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">
                {field('Title *', <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={INPUT_CLS} placeholder="Plan title…" />)}
                {field('Description *', <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className={`${INPUT_CLS} resize-none`} placeholder="What readers will gain…" />)}
                {field('Category *', <input type="text" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={INPUT_CLS} placeholder="e.g. Bible Study, Book Club…" />)}
                <MediaUpload
                  label="Cover"
                  kind="image"
                  value={form.coverUrl}
                  onChange={(url) => setForm(f => ({ ...f, coverUrl: url }))}
                  upload={(file, onProgress) => uploadCatalogMedia('books', 'cover', file, onProgress)}
                />
                {field('Total Days', <input type="number" min={1} value={form.totalDays} onChange={e => setForm(f => ({ ...f, totalDays: Number(e.target.value) }))} className={INPUT_CLS} />)}
                {field('Status', (
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'draft' | 'published' }))} className={INPUT_CLS}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                ))}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-brand-text-secondary cursor-pointer">
                    <input type="checkbox" checked={form.isFree} onChange={e => setForm(f => ({ ...f, isFree: e.target.checked }))} className="rounded" />
                    Free
                  </label>
                  <label className="flex items-center gap-2 text-sm text-brand-text-secondary cursor-pointer">
                    <input type="checkbox" checked={form.isPremium} onChange={e => setForm(f => ({ ...f, isPremium: e.target.checked }))} className="rounded" />
                    Premium
                  </label>
                </div>

                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-brand-text-primary">Days / Items</label>
                    <button onClick={addItem} type="button" className="flex items-center gap-1 text-xs font-bold text-brand-accent hover:underline">
                      <Plus className="w-3 h-3" /> Add Day
                    </button>
                  </div>
                  <div className="space-y-4">
                    {form.items.map((item, idx) => (
                      <div key={idx} className="border border-brand-border rounded-xl p-3 bg-brand-dark/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-brand-text-secondary uppercase">Day {item.day}</span>
                          <button onClick={() => removeItem(idx)} type="button" className="p-1 text-brand-text-secondary hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <input type="number" min={1} value={item.day} onChange={e => updateItem(idx, { day: Number(e.target.value) })} className={`${INPUT_CLS} text-sm py-1.5`} placeholder="Day number" />
                        <input type="text" value={item.title} onChange={e => updateItem(idx, { title: e.target.value })} className={`${INPUT_CLS} text-sm py-1.5`} placeholder="Day title…" />
                        <input type="text" value={item.description ?? ''} onChange={e => updateItem(idx, { description: e.target.value })} className={`${INPUT_CLS} text-sm py-1.5`} placeholder="Description…" />
                        <input type="text" value={item.chapters ?? ''} onChange={e => updateItem(idx, { chapters: e.target.value })} className={`${INPUT_CLS} text-sm py-1.5`} placeholder="Chapters (e.g. Gen 1-3)…" />
                        <input type="text" value={item.bookId ?? ''} onChange={e => updateItem(idx, { bookId: e.target.value })} className={`${INPUT_CLS} text-sm py-1.5`} placeholder="Book ID (from Books Library)…" />
                        <input type="number" min={1} value={item.durationMinutes ?? ''} onChange={e => updateItem(idx, { durationMinutes: e.target.value === '' ? undefined : Number(e.target.value) })} className={`${INPUT_CLS} text-sm py-1.5`} placeholder="Duration (minutes)…" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={handleSave} disabled={saving || !form.title || !form.description || !form.category} className="flex-1 py-3 rounded-xl font-bold bg-brand-accent text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-wait transition-colors">
                    {saving ? 'Saving…' : editingId ? 'Update' : 'Save'}
                  </button>
                  <button onClick={handleCancel} className="px-5 py-3 rounded-xl font-bold bg-brand-dark border border-brand-border text-brand-text-secondary hover:text-brand-text-primary transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 mx-auto mb-4 text-brand-text-secondary/40" />
              <p className="text-brand-text-secondary mb-6 text-sm">Create structured multi-day reading journeys.</p>
              <button onClick={() => setShowForm(true)} className="px-6 py-3 rounded-xl font-bold bg-brand-accent text-white hover:bg-opacity-90 transition-colors">
                + New Plan
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* List */}
      <div className="lg:col-span-2">
        <Card className="border-brand-border bg-brand-dark/30 min-h-[600px]">
          <h2 className="text-xl font-bold text-brand-text-primary mb-6 border-b border-brand-border pb-4 flex justify-between items-center">
            <span>Reading Plans</span>
            <span className="text-sm font-normal text-brand-text-secondary bg-brand-secondary px-3 py-1 rounded-full">
              {plans.length} items
            </span>
          </h2>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent" />
            </div>
          ) : plans.length > 0 ? (
            <div className="space-y-3">
              {plans.map(plan => (
                <div key={plan.id} className="flex items-center justify-between p-4 rounded-xl border border-brand-border bg-brand-dark/50 hover:border-brand-accent/50 transition-colors">
                  <div className="flex items-center gap-4 overflow-hidden min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-brand-secondary flex-shrink-0 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-brand-text-secondary/50" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-brand-text-primary font-bold truncate">{plan.title}</h4>
                      <p className="text-xs text-brand-text-secondary truncate">
                        {plan.category} · {plan.totalDays} days · {plan.items.length} item{plan.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full whitespace-nowrap ${plan.status === 'published' ? 'bg-green-500/15 text-green-400' : 'bg-brand-secondary text-brand-text-secondary'}`}>
                      {plan.status}
                    </span>
                    <button onClick={() => handleEdit(plan)} className="p-2 text-brand-text-secondary hover:text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(plan)} className="p-2 text-brand-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Calendar className="w-8 h-8" />}
              heading="No reading plans yet"
              subtext="Use the form to create the first one."
            />
          )}
        </Card>
      </div>
    </div>
  );
};

// ─── Podcasts Tab ────────────────────────────────────────────────────────────

interface PodcastEpisodeDoc {
  id: string;
  showName: string;
  episodeTitle: string;
  episodeNumber?: number;
  description?: string;
  audioUrl?: string;
  coverUrl?: string;
  duration?: string;
  publishDate?: string;
  isPremium: boolean;
  rssFeedUrl?: string;
}

const emptyPodcastForm = () => ({
  showName: '',
  episodeTitle: '',
  episodeNumber: '' as number | '',
  description: '',
  audioUrl: '',
  coverUrl: '',
  duration: '',
  publishDate: new Date().toISOString().split('T')[0],
  isPremium: false,
  rssFeedUrl: '',
});

const PodcastsTab: React.FC = () => {
  const [episodes, setEpisodes] = useState<PodcastEpisodeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyPodcastForm());

  const load = async () => {
    setLoading(true);
    try {
      const { collection, getDocs, orderBy, query } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      const q = query(collection(db, 'admin_podcasts'), orderBy('publishDate', 'desc'));
      const snap = await getDocs(q);
      setEpisodes(snap.docs.map(d => ({ id: d.id, ...d.data() } as PodcastEpisodeDoc)));
    } catch {
      // Firestore may not be set up yet
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { collection, addDoc, doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      const payload = {
        ...form,
        episodeNumber: form.episodeNumber === '' ? null : Number(form.episodeNumber),
      };
      if (editingId) {
        await updateDoc(doc(db, 'admin_podcasts', editingId), { ...payload, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'admin_podcasts'), { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyPodcastForm());
      await load();
    } catch {
      // Save error
    }
    setSaving(false);
  };

  const handleEdit = (ep: PodcastEpisodeDoc) => {
    setForm({
      showName: ep.showName,
      episodeTitle: ep.episodeTitle,
      episodeNumber: ep.episodeNumber ?? '',
      description: ep.description ?? '',
      audioUrl: ep.audioUrl ?? '',
      coverUrl: ep.coverUrl ?? '',
      duration: ep.duration ?? '',
      publishDate: ep.publishDate ?? new Date().toISOString().split('T')[0],
      isPremium: ep.isPremium,
      rssFeedUrl: ep.rssFeedUrl ?? '',
    });
    setEditingId(ep.id);
    setShowForm(true);
  };

  const handleDelete = async (ep: PodcastEpisodeDoc) => {
    if (!window.confirm(`Delete "${ep.episodeTitle}"?`)) return;
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      await deleteDoc(doc(db, 'admin_podcasts', ep.id));
      await load();
    } catch {
      // Delete error
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyPodcastForm());
  };

  const field = (label: string, el: React.ReactNode) => (
    <div>
      <label className="block text-sm font-bold text-brand-text-primary mb-2">{label}</label>
      {el}
    </div>
  );

  const inputCls = "w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <Card className="border-brand-border bg-brand-dark/30 sticky top-24">
          {showForm ? (
            <>
              <h2 className="text-xl font-bold text-brand-text-primary mb-6 border-b border-brand-border pb-4">
                {editingId ? 'Edit Episode' : 'New Episode'}
              </h2>
              <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">
                {field('Show / Series Name *', <input type="text" value={form.showName} onChange={e => setForm(f => ({ ...f, showName: e.target.value }))} className={inputCls} placeholder="e.g. The CCN Podcast" />)}
                {field('Episode Title *', <input type="text" value={form.episodeTitle} onChange={e => setForm(f => ({ ...f, episodeTitle: e.target.value }))} className={inputCls} placeholder="Episode title…" />)}
                {field('Episode Number', <input type="number" min={1} value={form.episodeNumber} onChange={e => setForm(f => ({ ...f, episodeNumber: e.target.value === '' ? '' : Number(e.target.value) }))} className={inputCls} placeholder="e.g. 42" />)}
                {field('Description', <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} className={`${inputCls} resize-none`} placeholder="What is this episode about?" />)}
                {field('Audio File URL', <input type="url" value={form.audioUrl} onChange={e => setForm(f => ({ ...f, audioUrl: e.target.value }))} className={inputCls} placeholder="https://…/episode.mp3" />)}
                {field('Cover Image URL', <input type="url" value={form.coverUrl} onChange={e => setForm(f => ({ ...f, coverUrl: e.target.value }))} className={inputCls} placeholder="https://…/cover.jpg" />)}
                {field('Duration', <input type="text" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className={inputCls} placeholder="e.g. 42 min" />)}
                {field('Publish Date', <input type="date" value={form.publishDate} onChange={e => setForm(f => ({ ...f, publishDate: e.target.value }))} className={inputCls} />)}
                {field('RSS Feed URL (optional)', <input type="url" value={form.rssFeedUrl} onChange={e => setForm(f => ({ ...f, rssFeedUrl: e.target.value }))} className={inputCls} placeholder="https://…/feed.xml" />)}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.isPremium} onChange={e => setForm(f => ({ ...f, isPremium: e.target.checked }))} className="w-5 h-5 rounded border-brand-border bg-brand-dark text-brand-accent focus:ring-brand-accent" />
                  <span className="text-sm font-bold text-brand-text-primary">Premium Content</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button onClick={handleSave} disabled={saving || !form.showName || !form.episodeTitle} className="flex-1 py-3 rounded-xl font-bold bg-brand-accent text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-wait transition-colors">
                    {saving ? 'Saving…' : editingId ? 'Update' : 'Save'}
                  </button>
                  <button onClick={handleCancel} className="px-5 py-3 rounded-xl font-bold bg-brand-dark border border-brand-border text-brand-text-secondary hover:text-brand-text-primary transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Mic className="w-10 h-10 mx-auto mb-4 text-brand-text-secondary/40" />
              <p className="text-brand-text-secondary mb-6 text-sm">Manage podcast episodes and series.</p>
              <button onClick={() => setShowForm(true)} className="px-6 py-3 rounded-xl font-bold bg-brand-accent text-white hover:bg-opacity-90 transition-colors">
                + New Episode
              </button>
            </div>
          )}
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="border-brand-border bg-brand-dark/30 min-h-[600px]">
          <h2 className="text-xl font-bold text-brand-text-primary mb-6 border-b border-brand-border pb-4 flex justify-between items-center">
            <span>Podcast Episodes</span>
            <span className="text-sm font-normal text-brand-text-secondary bg-brand-secondary px-3 py-1 rounded-full">
              {episodes.length} items
            </span>
          </h2>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent" />
            </div>
          ) : episodes.length > 0 ? (
            <div className="space-y-3">
              {episodes.map(ep => (
                <div key={ep.id} className="flex items-center justify-between p-4 rounded-xl border border-brand-border bg-brand-dark/50 hover:border-brand-accent/50 transition-colors">
                  <div className="flex items-center gap-4 overflow-hidden min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-brand-secondary flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {ep.coverUrl ? (
                        <img src={ep.coverUrl} alt={ep.episodeTitle} className="w-full h-full object-cover" />
                      ) : (
                        <Mic className="w-5 h-5 text-brand-text-secondary/50" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-brand-text-primary font-bold truncate">{ep.episodeTitle}</h4>
                      <p className="text-xs text-brand-text-secondary truncate">
                        {ep.showName}{ep.episodeNumber ? ` · Ep. ${ep.episodeNumber}` : ''}{ep.duration ? ` · ${ep.duration}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    {ep.isPremium && (
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-brand-accent/20 text-brand-accent whitespace-nowrap">Premium</span>
                    )}
                    <button onClick={() => handleEdit(ep)} className="p-2 text-brand-text-secondary hover:text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(ep)} className="p-2 text-brand-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Mic className="w-8 h-8" />}
              heading="No podcast episodes yet"
              subtext="Use the form to add the first one."
            />
          )}
        </Card>
      </div>
    </div>
  );
};

// ─── Newsletters Tab ─────────────────────────────────────────────────────────

interface NewsletterIssueDoc {
  id: string;
  seriesName: string;
  issueTitle: string;
  issueNumber?: number;
  description?: string;
  publishDate?: string;
  archiveUrl?: string;
  coverUrl?: string;
  isPremium: boolean;
}

const emptyNewsletterForm = () => ({
  seriesName: '',
  issueTitle: '',
  issueNumber: '' as number | '',
  description: '',
  publishDate: new Date().toISOString().split('T')[0],
  archiveUrl: '',
  coverUrl: '',
  isPremium: false,
});

const NewslettersTab: React.FC = () => {
  const [issues, setIssues] = useState<NewsletterIssueDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyNewsletterForm());

  const load = async () => {
    setLoading(true);
    try {
      const { collection, getDocs, orderBy, query } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      const q = query(collection(db, 'admin_newsletters'), orderBy('publishDate', 'desc'));
      const snap = await getDocs(q);
      setIssues(snap.docs.map(d => ({ id: d.id, ...d.data() } as NewsletterIssueDoc)));
    } catch {
      // Firestore may not be set up yet
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { collection, addDoc, doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      const payload = {
        ...form,
        issueNumber: form.issueNumber === '' ? null : Number(form.issueNumber),
      };
      if (editingId) {
        await updateDoc(doc(db, 'admin_newsletters', editingId), { ...payload, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'admin_newsletters'), { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyNewsletterForm());
      await load();
    } catch {
      // Save error
    }
    setSaving(false);
  };

  const handleEdit = (issue: NewsletterIssueDoc) => {
    setForm({
      seriesName: issue.seriesName,
      issueTitle: issue.issueTitle,
      issueNumber: issue.issueNumber ?? '',
      description: issue.description ?? '',
      publishDate: issue.publishDate ?? new Date().toISOString().split('T')[0],
      archiveUrl: issue.archiveUrl ?? '',
      coverUrl: issue.coverUrl ?? '',
      isPremium: issue.isPremium,
    });
    setEditingId(issue.id);
    setShowForm(true);
  };

  const handleDelete = async (issue: NewsletterIssueDoc) => {
    if (!window.confirm(`Delete "${issue.issueTitle}"?`)) return;
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      await deleteDoc(doc(db, 'admin_newsletters', issue.id));
      await load();
    } catch {
      // Delete error
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyNewsletterForm());
  };

  const field = (label: string, el: React.ReactNode) => (
    <div>
      <label className="block text-sm font-bold text-brand-text-primary mb-2">{label}</label>
      {el}
    </div>
  );

  const inputCls = "w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <Card className="border-brand-border bg-brand-dark/30 sticky top-24">
          {showForm ? (
            <>
              <h2 className="text-xl font-bold text-brand-text-primary mb-6 border-b border-brand-border pb-4">
                {editingId ? 'Edit Issue' : 'New Issue'}
              </h2>
              <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">
                {field('Newsletter Series Name *', <input type="text" value={form.seriesName} onChange={e => setForm(f => ({ ...f, seriesName: e.target.value }))} className={inputCls} placeholder="e.g. The Weekly Word" />)}
                {field('Issue Title *', <input type="text" value={form.issueTitle} onChange={e => setForm(f => ({ ...f, issueTitle: e.target.value }))} className={inputCls} placeholder="Issue title…" />)}
                {field('Issue Number', <input type="number" min={1} value={form.issueNumber} onChange={e => setForm(f => ({ ...f, issueNumber: e.target.value === '' ? '' : Number(e.target.value) }))} className={inputCls} placeholder="e.g. 12" />)}
                {field('Description', <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} className={`${inputCls} resize-none`} placeholder="What's in this issue?" />)}
                {field('Publish Date', <input type="date" value={form.publishDate} onChange={e => setForm(f => ({ ...f, publishDate: e.target.value }))} className={inputCls} />)}
                {field('External Archive URL (optional)', <input type="url" value={form.archiveUrl} onChange={e => setForm(f => ({ ...f, archiveUrl: e.target.value }))} className={inputCls} placeholder="https://… (link to full issue online)" />)}
                {field('Cover Image URL', <input type="url" value={form.coverUrl} onChange={e => setForm(f => ({ ...f, coverUrl: e.target.value }))} className={inputCls} placeholder="https://…/cover.jpg" />)}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.isPremium} onChange={e => setForm(f => ({ ...f, isPremium: e.target.checked }))} className="w-5 h-5 rounded border-brand-border bg-brand-dark text-brand-accent focus:ring-brand-accent" />
                  <span className="text-sm font-bold text-brand-text-primary">Premium Content</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button onClick={handleSave} disabled={saving || !form.seriesName || !form.issueTitle} className="flex-1 py-3 rounded-xl font-bold bg-brand-accent text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-wait transition-colors">
                    {saving ? 'Saving…' : editingId ? 'Update' : 'Save'}
                  </button>
                  <button onClick={handleCancel} className="px-5 py-3 rounded-xl font-bold bg-brand-dark border border-brand-border text-brand-text-secondary hover:text-brand-text-primary transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Mail className="w-10 h-10 mx-auto mb-4 text-brand-text-secondary/40" />
              <p className="text-brand-text-secondary mb-6 text-sm">Manage newsletter issues and series.</p>
              <button onClick={() => setShowForm(true)} className="px-6 py-3 rounded-xl font-bold bg-brand-accent text-white hover:bg-opacity-90 transition-colors">
                + New Issue
              </button>
            </div>
          )}
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="border-brand-border bg-brand-dark/30 min-h-[600px]">
          <h2 className="text-xl font-bold text-brand-text-primary mb-6 border-b border-brand-border pb-4 flex justify-between items-center">
            <span>Newsletter Issues</span>
            <span className="text-sm font-normal text-brand-text-secondary bg-brand-secondary px-3 py-1 rounded-full">
              {issues.length} items
            </span>
          </h2>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent" />
            </div>
          ) : issues.length > 0 ? (
            <div className="space-y-3">
              {issues.map(issue => (
                <div key={issue.id} className="flex items-center justify-between p-4 rounded-xl border border-brand-border bg-brand-dark/50 hover:border-brand-accent/50 transition-colors">
                  <div className="flex items-center gap-4 overflow-hidden min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-brand-secondary flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {issue.coverUrl ? (
                        <img src={issue.coverUrl} alt={issue.issueTitle} className="w-full h-full object-cover" />
                      ) : (
                        <Mail className="w-5 h-5 text-brand-text-secondary/50" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-brand-text-primary font-bold truncate">{issue.issueTitle}</h4>
                      <p className="text-xs text-brand-text-secondary truncate">
                        {issue.seriesName}{issue.issueNumber ? ` · Issue #${issue.issueNumber}` : ''}{issue.publishDate ? ` · ${issue.publishDate}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    {issue.isPremium && (
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-brand-accent/20 text-brand-accent whitespace-nowrap">Premium</span>
                    )}
                    <button onClick={() => handleEdit(issue)} className="p-2 text-brand-text-secondary hover:text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(issue)} className="p-2 text-brand-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Mail className="w-8 h-8" />}
              heading="No newsletter issues yet"
              subtext="Use the form to add the first one."
            />
          )}
        </Card>
      </div>
    </div>
  );
};

const ContentManagerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('written-devotionals');
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [price, setPrice] = useState<number | ''>('');

  const [items, setItems] = useState<CatalogContentItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const isCatalogTab = activeTab !== 'written-devotionals' && activeTab !== 'books-library' && activeTab !== 'reading-plans' && activeTab !== 'podcasts' && activeTab !== 'newsletters';
  const catalogTab = isCatalogTab ? (activeTab as ContentType) : 'devotionals';

  const requiresAuthor = catalogTab === 'audiobooks' || catalogTab === 'books' || catalogTab === 'courses';
  const usesDate = catalogTab === 'devotionals' || catalogTab === 'challenges';
  const usesCover = catalogTab === 'audiobooks' || catalogTab === 'books' || catalogTab === 'challenges' || catalogTab === 'courses';
  const usesPrimaryFile = catalogTab !== 'challenges' && catalogTab !== 'courses';
  const primaryFileRole: UploadRole = catalogTab === 'books' ? 'file' : 'audio';

  const heading = useMemo(() => isCatalogTab ? singular(catalogTab) : 'devotional', [activeTab]);

  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setDescription('');
    setDate('');
    setFileUrl('');
    setCoverUrl('');
    setIsPremium(false);
    setPrice('');
  };

  const fetchItems = async () => {
    if (!isCatalogTab) return;
    setLoadingItems(true);
    try {
      setItems(await listCatalogContent(catalogTab));
    } catch (error) {
      notify(error instanceof Error ? error.message : `Failed to load ${catalogTab}.`, 'error');
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    resetForm();
    fetchItems();
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await saveCatalogContent(catalogTab, {
        title,
        description,
        content: catalogTab === 'devotionals' ? description : undefined,
        author: catalogTab === 'courses' ? undefined : author,
        instructor: catalogTab === 'courses' ? author : undefined,
        date: catalogTab === 'devotionals' ? date : undefined,
        startDate: catalogTab === 'challenges' ? date : undefined,
        audioUrl: catalogTab === 'devotionals' || catalogTab === 'audiobooks' ? fileUrl || undefined : undefined,
        fileUrl: catalogTab === 'books' ? fileUrl || undefined : undefined,
        coverUrl: coverUrl || undefined,
        status: 'published',
        isPremium,
        price: isPremium ? Number(price || 0) : 0,
      });

      notify(`${heading} saved successfully.`, 'success');
      resetForm();
      await fetchItems();
    } catch (error) {
      notify(error instanceof Error ? error.message : `Failed to save ${heading}.`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: CatalogContentItem) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}"?`)) return;

    try {
      await deleteCatalogContent(catalogTab, item.id);
      notify(`${heading} deleted successfully.`, 'success');
      await fetchItems();
    } catch (error) {
      notify(error instanceof Error ? error.message : `Failed to delete ${heading}.`, 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-text-primary mb-2">Content Manager</h1>
        <p className="text-brand-text-secondary">Upload and manage devotionals, audiobooks, books, challenges, and courses.</p>
      </div>

      <div className="flex gap-4 mb-8 overflow-x-auto pb-2 custom-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-brand-accent text-white'
                : 'bg-brand-dark border border-brand-border text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'written-devotionals' ? (
        <DevotionalsTab />
      ) : activeTab === 'books-library' ? (
        <BooksManagerTab />
      ) : activeTab === 'reading-plans' ? (
        <ReadingPlansManagerTab />
      ) : activeTab === 'podcasts' ? (
        <PodcastsTab />
      ) : activeTab === 'newsletters' ? (
        <NewslettersTab />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="border-brand-border bg-brand-dark/30 sticky top-24">
              <h2 className="text-xl font-bold text-brand-text-primary mb-6 border-b border-brand-border pb-4">
                Add New {heading}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-brand-text-primary mb-2">Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent"
                    placeholder={`Enter ${heading} title...`}
                  />
                </div>

                {requiresAuthor && (
                  <div>
                    <label className="block text-sm font-bold text-brand-text-primary mb-2">
                      {catalogTab === 'courses' ? 'Instructor' : 'Author'}
                    </label>
                    <input
                      type="text"
                      required
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent"
                      placeholder={catalogTab === 'courses' ? 'Instructor name...' : 'Author name...'}
                    />
                  </div>
                )}

                {usesDate && (
                  <div>
                    <label className="block text-sm font-bold text-brand-text-primary mb-2">
                      {catalogTab === 'devotionals' ? 'Date' : 'Start Date'}
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-brand-text-primary mb-2">
                    {catalogTab === 'devotionals' ? 'Devotional Content' : 'Description'}
                  </label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent resize-none"
                    placeholder={`Enter ${catalogTab === 'devotionals' ? 'content' : 'description'}...`}
                  />
                </div>

                {usesCover && (
                  <MediaUpload
                    label="Cover Image"
                    kind="image"
                    value={coverUrl}
                    onChange={setCoverUrl}
                    upload={(f, onProg) => uploadCatalogMedia(catalogTab, 'cover', f, onProg)}
                  />
                )}

                <div className="flex flex-col gap-4 border border-brand-border rounded-xl p-4 bg-brand-dark/50">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isPremium"
                      checked={isPremium}
                      onChange={(e) => setIsPremium(e.target.checked)}
                      className="w-5 h-5 rounded border-brand-border bg-brand-dark text-brand-accent focus:ring-brand-accent focus:ring-offset-brand-dark"
                    />
                    <label htmlFor="isPremium" className="text-sm font-bold text-brand-text-primary">
                      Premium Content
                    </label>
                  </div>

                  {isPremium && (
                    <div>
                      <label className="block text-sm font-bold text-brand-text-primary mb-2">
                        Price ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent"
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>

                {usesPrimaryFile && (
                  <MediaUpload
                    label={catalogTab === 'books' ? 'Book File' : 'Audio File'}
                    kind={catalogTab === 'books' ? 'document' : 'audio'}
                    value={fileUrl}
                    onChange={setFileUrl}
                    upload={(f, onProg) => uploadCatalogMedia(catalogTab, primaryFileRole, f, onProg)}
                    required={catalogTab !== 'devotionals'}
                    allowUrl
                  />
                )}

                <button
                  type="submit"
                  disabled={isSaving}
                  className={`w-full py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${
                    isSaving ? 'bg-brand-secondary text-brand-text-secondary cursor-wait' : 'bg-brand-accent text-white hover:bg-opacity-90'
                  }`}
                >
                  {isSaving ? 'Saving...' : `Save ${heading}`}
                </button>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="border-brand-border bg-brand-dark/30 h-full min-h-[600px]">
              <h2 className="text-xl font-bold text-brand-text-primary mb-6 border-b border-brand-border pb-4 flex justify-between items-center">
                <span>Manage {catalogTab}</span>
                <span className="text-sm font-normal text-brand-text-secondary bg-brand-secondary px-3 py-1 rounded-full">
                  {items.length} items
                </span>
              </h2>

              {loadingItems ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent" />
                </div>
              ) : items.length > 0 ? (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-brand-border bg-brand-dark/50 hover:border-brand-accent/50 transition-colors">
                      <div className="flex items-center gap-4 overflow-hidden">
                        {(item.coverUrl || catalogTab === 'devotionals') && (
                          <div className="w-12 h-12 rounded bg-brand-secondary flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {item.coverUrl ? (
                              <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <SparklesIcon className="w-6 h-6 text-brand-text-secondary/50" />
                            )}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-brand-text-primary font-bold truncate">{item.title}</h4>
                            {item.isPremium && (
                              <span className="px-2 py-0.5 text-[12px] font-bold bg-brand-accent/20 text-brand-accent rounded-full whitespace-nowrap">
                                Premium {item.price ? `($${item.price})` : ''}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-brand-text-secondary truncate">
                            {(item.author || item.instructor) && `By ${item.author || item.instructor} - `}
                            {item.date || item.startDate || item.createdAt || 'undated'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        {(catalogTab === 'challenges' || catalogTab === 'courses') && (
                          <button
                            onClick={() => navigate(`/studio/${catalogTab}/${item.id}/modules`)}
                            className="px-3 py-1.5 text-xs font-bold bg-brand-accent/10 text-brand-accent hover:bg-brand-accent hover:text-white rounded-lg transition-colors"
                          >
                            Manage Modules
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-2 text-brand-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <CloseIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Layers className="w-8 h-8" />}
                  heading={`No ${heading}s yet`}
                  subtext="Use the form to add the first one."
                />
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagerPage;
