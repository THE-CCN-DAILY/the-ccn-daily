import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  deleteField,
  Timestamp,
} from 'firebase/firestore';

export type AnnouncementPlacement = 'banner' | 'sidebar';
export type AnnouncementStyle = 'default' | 'seasonal' | 'product' | 'event';
export type AnnouncementAudience = 'all' | 'free' | 'paid';
export type AnnouncementMediaType = 'image' | 'video';

// Recommended media specs surfaced to the admin.
export const ANNOUNCEMENT_MEDIA_SPECS = {
  image: { accept: 'image/png,image/jpeg,image/webp,image/gif', maxBytes: 3 * 1024 * 1024, hint: 'PNG/JPG/WEBP · up to 3 MB · ~1200×400 (3:1) works best' },
  video: { accept: 'video/mp4,video/webm', maxBytes: 15 * 1024 * 1024, hint: 'MP4/WEBM · up to 15 MB · 16:9, short & muted-friendly' },
} as const;

export interface Announcement {
  id: string;
  title: string;
  body: string;
  imageUrl: string;
  mediaType: AnnouncementMediaType;
  ctaLabel: string;
  ctaUrl: string;
  placement: AnnouncementPlacement;
  style: AnnouncementStyle;
  audience: AnnouncementAudience;
  isActive: boolean;
  /** Optional schedule window — null means "no bound". */
  startDate: Date | null;
  endDate: Date | null;
  priority: number;
}

/** Editable shape used by the admin form (no id/timestamps). */
export type AnnouncementInput = Omit<Announcement, 'id'>;

export const EMPTY_ANNOUNCEMENT: AnnouncementInput = {
  title: '',
  body: '',
  imageUrl: '',
  mediaType: 'image',
  ctaLabel: '',
  ctaUrl: '',
  placement: 'banner',
  style: 'default',
  audience: 'all',
  isActive: true,
  startDate: null,
  endDate: null,
  priority: 0,
};

const toDate = (value: unknown): Date | null =>
  value instanceof Timestamp ? value.toDate() : null;

function fromDoc(id: string, data: Record<string, any>): Announcement {
  return {
    id,
    title: data.title ?? '',
    body: data.body ?? '',
    imageUrl: data.imageUrl ?? '',
    mediaType: data.mediaType === 'video' ? 'video' : 'image',
    ctaLabel: data.ctaLabel ?? '',
    ctaUrl: data.ctaUrl ?? '',
    placement: (data.placement as AnnouncementPlacement) ?? 'banner',
    style: (data.style as AnnouncementStyle) ?? 'default',
    audience: (data.audience as AnnouncementAudience) ?? 'all',
    isActive: !!data.isActive,
    startDate: toDate(data.startDate),
    endDate: toDate(data.endDate),
    priority: typeof data.priority === 'number' ? data.priority : 0,
  };
}

/**
 * Build the Firestore payload. Optional date fields must be a Timestamp or ABSENT
 * (the security rule rejects null), so we use deleteField() to clear them on update.
 */
function toFirestore(input: AnnouncementInput): Record<string, unknown> {
  return {
    title: input.title.trim(),
    body: input.body ?? '',
    imageUrl: input.imageUrl ?? '',
    mediaType: input.mediaType === 'video' ? 'video' : 'image',
    ctaLabel: input.ctaLabel ?? '',
    ctaUrl: input.ctaUrl ?? '',
    placement: input.placement,
    style: input.style,
    audience: input.audience,
    isActive: input.isActive,
    priority: input.priority ?? 0,
    startDate: input.startDate ? Timestamp.fromDate(input.startDate) : deleteField(),
    endDate: input.endDate ? Timestamp.fromDate(input.endDate) : deleteField(),
  };
}

/** Real-time stream of ALL announcements (admin view). */
export function subscribeAnnouncements(cb: (items: Announcement[]) => void): () => void {
  const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => fromDoc(d.id, d.data()))),
    () => cb([]),
  );
}

export async function createAnnouncement(input: AnnouncementInput): Promise<void> {
  if (!input.title.trim()) throw new Error('Please enter a title.');
  const payload = toFirestore(input);
  // On create, omit cleared dates entirely (addDoc rejects deleteField()).
  if (!input.startDate) delete (payload as any).startDate;
  if (!input.endDate) delete (payload as any).endDate;
  await addDoc(collection(db, 'announcements'), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateAnnouncement(id: string, input: AnnouncementInput): Promise<void> {
  if (!input.title.trim()) throw new Error('Please enter a title.');
  await updateDoc(doc(db, 'announcements', id), {
    ...toFirestore(input),
    updatedAt: serverTimestamp(),
  });
}

export async function setAnnouncementActive(id: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(db, 'announcements', id), { isActive, updatedAt: serverTimestamp() });
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await deleteDoc(doc(db, 'announcements', id));
}

/**
 * Upload announcement media (image or video) to Firebase Storage; returns the public URL
 * + detected media type. Validates type/size against ANNOUNCEMENT_MEDIA_SPECS.
 */
export async function uploadAnnouncementMedia(
  file: File,
): Promise<{ url: string; mediaType: AnnouncementMediaType }> {
  const mediaType: AnnouncementMediaType = file.type.startsWith('video/') ? 'video' : 'image';
  const spec = ANNOUNCEMENT_MEDIA_SPECS[mediaType];
  if (!spec.accept.split(',').includes(file.type)) {
    throw new Error(`Unsupported file type — ${spec.hint}`);
  }
  if (file.size > spec.maxBytes) {
    throw new Error(`File is too large — ${spec.hint}`);
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || (mediaType === 'video' ? 'mp4' : 'jpg');
  const path = `announcements/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);
  return { url, mediaType };
}

/** True when an announcement is active AND within its schedule window right now. */
export function isLive(a: Announcement, now: Date = new Date()): boolean {
  if (!a.isActive) return false;
  if (a.startDate && now < a.startDate) return false;
  if (a.endDate && now > a.endDate) return false;
  return true;
}

/** Does this announcement target a user on the given tier? */
export function matchesAudience(a: Announcement, isPaid: boolean): boolean {
  if (a.audience === 'all') return true;
  return a.audience === (isPaid ? 'paid' : 'free');
}

/**
 * One-shot fetch of the announcements that should display for a viewer right now,
 * for a given placement — filtered by schedule + audience and sorted by priority.
 */
export async function getLiveAnnouncements(
  placement: AnnouncementPlacement,
  isPaid: boolean,
): Promise<Announcement[]> {
  const snap = await getDocs(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')));
  const now = new Date();
  return snap.docs
    .map((d) => fromDoc(d.id, d.data()))
    .filter((a) => a.placement === placement && isLive(a, now) && matchesAudience(a, isPaid))
    .sort((x, y) => (y.priority ?? 0) - (x.priority ?? 0));
}
