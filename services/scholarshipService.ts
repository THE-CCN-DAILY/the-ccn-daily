import { getAuth } from 'firebase/auth';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { adminAuthHeaders } from './adminAuth';

// Scholarship policy (decided with founder): grant Growth (pro) for 6 months.
export const SCHOLARSHIP_TIER = 'pro';
export const SCHOLARSHIP_MONTHS = 6;

export type ScholarshipStatus = 'pending' | 'accepted' | 'declined';

export interface ScholarshipApplication {
  id: string;
  applicantUid: string;
  applicantName: string;
  applicantEmail: string;
  country: string;
  reason: string;
  status: ScholarshipStatus;
  declineReason: string;
  createdAt: Date | null;
  reviewedAt: Date | null;
}

const toDate = (v: unknown): Date | null => (v instanceof Timestamp ? v.toDate() : null);

function fromDoc(id: string, data: Record<string, any>): ScholarshipApplication {
  return {
    id,
    applicantUid: data.applicantUid ?? '',
    applicantName: data.applicantName ?? '',
    applicantEmail: data.applicantEmail ?? '',
    country: data.country ?? '',
    reason: data.reason ?? '',
    status: (data.status as ScholarshipStatus) ?? 'pending',
    declineReason: data.declineReason ?? '',
    createdAt: toDate(data.createdAt),
    reviewedAt: toDate(data.reviewedAt),
  };
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

/** Submit a scholarship application for the signed-in user. */
export async function submitApplication(input: { country: string; reason: string }): Promise<void> {
  const user = getAuth().currentUser;
  if (!user) throw new Error('Please sign in to apply.');
  if (!input.reason.trim()) throw new Error('Please tell us a little about your situation.');

  await addDoc(collection(db, 'scholarshipApplications'), {
    applicantUid: user.uid,
    applicantName: user.displayName || 'Applicant',
    applicantEmail: user.email || '',
    country: input.country.trim().slice(0, 80),
    reason: input.reason.trim().slice(0, 1999),
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

/** The signed-in user's most recent application (to show status / prevent dupes). */
export async function getMyLatestApplication(uid: string): Promise<ScholarshipApplication | null> {
  const q = query(
    collection(db, 'scholarshipApplications'),
    where('applicantUid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(1),
  );
  const snap = await getDocs(q);
  return snap.empty ? null : fromDoc(snap.docs[0].id, snap.docs[0].data());
}

/** Admin: real-time stream of all applications. */
export function subscribeApplications(cb: (items: ScholarshipApplication[]) => void): () => void {
  const q = query(collection(db, 'scholarshipApplications'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => fromDoc(d.id, d.data()))),
    () => cb([]),
  );
}

/**
 * Admin: accept or decline. On accept the server grants the tier in D1 (+ emails);
 * on decline the server emails the reason. We then record the outcome on the Firestore
 * application and, on accept, drop an in-app notification for the applicant.
 */
export async function decideApplication(
  app: ScholarshipApplication,
  decision: 'accept' | 'decline',
  declineReason = '',
): Promise<void> {
  const headers = await adminAuthHeaders();
  const res = await fetch('/api/admin/scholarship-decide', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
      decision,
      userId: app.applicantUid,
      email: app.applicantEmail,
      name: app.applicantName,
      tier: SCHOLARSHIP_TIER,
      months: SCHOLARSHIP_MONTHS,
      declineReason,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error || 'Could not process the decision.');
  }

  await updateDoc(doc(db, 'scholarshipApplications', app.id), {
    status: decision === 'accept' ? 'accepted' : 'declined',
    declineReason: decision === 'decline' ? declineReason.slice(0, 1999) : '',
    reviewedAt: serverTimestamp(),
  });

  // Best-effort in-app notification for the applicant.
  try {
    await addDoc(collection(db, 'notifications'), {
      title: decision === 'accept' ? 'Scholarship approved 🎉' : 'About your scholarship application',
      message:
        decision === 'accept'
          ? `Your Growth access is active for ${SCHOLARSHIP_MONTHS} months. Welcome — dive in.`
          : declineReason || 'Thank you for applying. You can continue on the free plan and apply again later.',
      date: serverTimestamp(),
      type: 'in-app',
      target: app.applicantUid,
    });
  } catch {
    // Notification is secondary — the email already informed the applicant.
  }
}
