import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Megaphone, Plus, Pencil, Trash2, Calendar, Eye, EyeOff, Upload } from 'lucide-react';
import Card from '../components/Card';
import { useNotifications } from '../contexts/NotificationContext';
import {
  subscribeAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  setAnnouncementActive,
  uploadAnnouncementMedia,
  isLive,
  EMPTY_ANNOUNCEMENT,
  ANNOUNCEMENT_MEDIA_SPECS,
  type Announcement,
  type AnnouncementInput,
  type AnnouncementPlacement,
  type AnnouncementStyle,
  type AnnouncementAudience,
} from '../services/announcementService';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const PLACEMENTS: AnnouncementPlacement[] = ['banner', 'sidebar'];
const STYLES: AnnouncementStyle[] = ['default', 'seasonal', 'product', 'event'];
const AUDIENCES: { id: AnnouncementAudience; label: string }[] = [
  { id: 'all', label: 'Everyone' },
  { id: 'free', label: 'Free users' },
  { id: 'paid', label: 'Paid users' },
];

const toLocalInput = (d: Date | null): string =>
  d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
const fromLocalInput = (s: string): Date | null => (s ? new Date(s) : null);

const fieldClass =
  'w-full rounded-lg border border-brand-border bg-brand-secondary px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-accent/70';
const labelClass = 'block text-xs font-semibold text-brand-text-secondary mb-1';

const AnnouncementsManagerPage: React.FC = () => {
  const { notify } = useNotifications();
  const [items, setItems] = useState<Announcement[]>([]);
  const [form, setForm] = useState<AnnouncementInput>({ ...EMPTY_ANNOUNCEMENT });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => subscribeAnnouncements(setItems), []);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const { url, mediaType } = await uploadAnnouncementMedia(file);
      setForm((prev) => ({ ...prev, imageUrl: url, mediaType }));
      notify('Media uploaded.', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const set = <K extends keyof AnnouncementInput>(key: K, value: AnnouncementInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => { setForm({ ...EMPTY_ANNOUNCEMENT }); setEditingId(null); };

  const startEdit = (a: Announcement) => {
    setEditingId(a.id);
    setForm({
      title: a.title, body: a.body, imageUrl: a.imageUrl, mediaType: a.mediaType, ctaLabel: a.ctaLabel, ctaUrl: a.ctaUrl,
      placement: a.placement, style: a.style, audience: a.audience, isActive: a.isActive,
      startDate: a.startDate, endDate: a.endDate, priority: a.priority,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      notify('End date must be after the start date.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateAnnouncement(editingId, form);
        notify('Announcement updated.', 'success');
      } else {
        await createAnnouncement(form);
        notify('Announcement published.', 'success');
      }
      resetForm();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try { await deleteAnnouncement(id); notify('Deleted.', 'success'); if (editingId === id) resetForm(); }
    catch { notify('Could not delete.', 'error'); }
  };

  const toggleActive = async (a: Announcement) => {
    try { await setAnnouncementActive(a.id, !a.isActive); }
    catch { notify('Could not update.', 'error'); }
  };

  const liveCount = useMemo(() => items.filter((a) => isLive(a)).length, [items]);

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4">
      <motion.div className="mb-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2">Promotion</p>
        <h1 className="text-4xl font-black text-brand-text-primary inline-flex items-center gap-3" style={{ fontFamily: 'var(--serif-display)' }}>
          <Megaphone className="w-8 h-8 text-brand-accent" /> Announcements
        </h1>
        <p className="text-sm text-brand-text-secondary mt-2">
          Premium banners for products, events, and seasonal pushes. {liveCount} live now.
        </p>
      </motion.div>

      {/* Editor */}
      <Card className="mb-8">
        <h2 className="text-lg font-bold text-brand-text-primary mb-4 inline-flex items-center gap-2">
          {editingId ? <><Pencil className="w-4 h-4" /> Edit announcement</> : <><Plus className="w-4 h-4" /> New announcement</>}
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className={labelClass}>Title *</label>
            <input className={fieldClass} value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={159} placeholder="e.g. Easter audiobook bundle — 30% off" required />
          </div>
          <div>
            <label className={labelClass}>Body</label>
            <textarea className={`${fieldClass} min-h-[72px]`} value={form.body} onChange={(e) => set('body', e.target.value)} maxLength={1999} placeholder="Short supporting line." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Media — image or video (optional)</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-brand-dark border border-brand-border text-brand-text-primary hover:border-brand-accent disabled:opacity-60 flex-shrink-0"
                >
                  <Upload className="w-4 h-4" /> {uploading ? 'Uploading…' : 'Upload'}
                </button>
                <input className={`${fieldClass} flex-1`} value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="…or paste a URL" />
              </div>
              <p className="text-[11px] text-brand-text-secondary mt-1 leading-snug">
                Image — {ANNOUNCEMENT_MEDIA_SPECS.image.hint}.<br />Video — {ANNOUNCEMENT_MEDIA_SPECS.video.hint}.
              </p>
              {form.imageUrl && (
                <div className="mt-2">
                  {form.mediaType === 'video'
                    ? <video src={form.imageUrl} className="h-24 rounded-lg" muted controls />
                    : <img src={form.imageUrl} alt="" className="h-24 rounded-lg object-cover" />}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleMediaUpload} className="hidden" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Button label</label>
                <input className={fieldClass} value={form.ctaLabel} onChange={(e) => set('ctaLabel', e.target.value)} maxLength={59} placeholder="Explore" />
              </div>
              <div>
                <label className={labelClass}>Button link</label>
                <input className={fieldClass} value={form.ctaUrl} onChange={(e) => set('ctaUrl', e.target.value)} placeholder="/audiobook-library" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Placement</label>
              <select className={fieldClass} value={form.placement} onChange={(e) => set('placement', e.target.value as AnnouncementPlacement)}>
                {PLACEMENTS.map((p) => <option key={p} value={p}>{p === 'banner' ? 'Dashboard banner' : 'Sidebar promo'}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Style</label>
              <select className={fieldClass} value={form.style} onChange={(e) => set('style', e.target.value as AnnouncementStyle)}>
                {STYLES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Audience</label>
              <select className={fieldClass} value={form.audience} onChange={(e) => set('audience', e.target.value as AnnouncementAudience)}>
                {AUDIENCES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Priority</label>
              <input type="number" className={fieldClass} value={form.priority} onChange={(e) => set('priority', Number(e.target.value) || 0)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}><Calendar className="inline w-3.5 h-3.5 mr-1" />Start (optional)</label>
              <input type="datetime-local" className={fieldClass} value={toLocalInput(form.startDate)} onChange={(e) => set('startDate', fromLocalInput(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}><Calendar className="inline w-3.5 h-3.5 mr-1" />End (optional)</label>
              <input type="datetime-local" className={fieldClass} value={toLocalInput(form.endDate)} onChange={(e) => set('endDate', fromLocalInput(e.target.value))} />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-brand-text-primary">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="h-4 w-4 accent-brand-accent" />
            Active (within schedule)
          </label>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: 'var(--ember)' }}>
              {saving ? 'Saving…' : editingId ? 'Update' : 'Publish'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-brand-text-secondary hover:bg-brand-secondary transition-colors">
                Cancel
              </button>
            )}
          </div>
        </form>
      </Card>

      {/* List */}
      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-brand-text-secondary text-center py-8">No announcements yet. Create your first above.</p>
        )}
        {items.map((a) => {
          const live = isLive(a);
          return (
            <Card key={a.id} className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${live ? 'bg-status-success/15 text-status-success' : 'bg-brand-border/40 text-brand-text-secondary'}`}>
                    {live ? 'Live' : a.isActive ? 'Scheduled' : 'Off'}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-brand-text-secondary">{a.placement} · {a.style} · {a.audience}</span>
                </div>
                <p className="font-semibold text-brand-text-primary truncate mt-1">{a.title}</p>
                {(a.startDate || a.endDate) && (
                  <p className="text-xs text-brand-text-secondary mt-0.5">
                    {a.startDate ? a.startDate.toLocaleString() : 'Now'} → {a.endDate ? a.endDate.toLocaleString() : 'No end'}
                  </p>
                )}
              </div>
              <button type="button" onClick={() => toggleActive(a)} aria-label="Toggle active" title={a.isActive ? 'Turn off' : 'Turn on'} className="p-2 rounded-lg text-brand-text-secondary hover:bg-brand-secondary hover:text-brand-text-primary">
                {a.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button type="button" onClick={() => startEdit(a)} aria-label="Edit" className="p-2 rounded-lg text-brand-text-secondary hover:bg-brand-secondary hover:text-brand-accent">
                <Pencil className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => handleDelete(a.id)} aria-label="Delete" className="p-2 rounded-lg text-brand-text-secondary hover:bg-status-error/10 hover:text-status-error">
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AnnouncementsManagerPage;
