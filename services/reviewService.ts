import { adminAuthHeaders } from './adminAuth';

/**
 * Moderated book & audiobook reviews (D1-backed via the Cloudflare Worker).
 *
 * A signed-in member submits a star rating + note → created 'pending'. An admin
 * approves or rejects it; only approved reviews surface on the public product
 * view. One backend table serves both surfaces, discriminated by content type.
 */

export type ReviewContentType = 'book' | 'audiobook';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface BookReview {
  id: string;
  contentType: ReviewContentType;
  bookId: string;
  userId: string;
  authorName: string;
  rating: number;
  body: string;
  status: ReviewStatus;
  createdAt?: string;
}

export interface ReviewAggregate {
  count: number;
  average: number;
}

export interface NewReview {
  rating: number;
  body: string;
  authorName?: string;
}

export const MAX_REVIEW_TEXT = 2000;

const apiSegment = (contentType: ReviewContentType): string =>
  contentType === 'audiobook' ? 'audiobooks' : 'books';

const errorFrom = async (response: Response, fallback: string): Promise<Error> => {
  const data = await response.json().catch(() => ({}));
  return new Error(data.message || data.error || fallback);
};

/** Public: approved reviews + aggregate rating for one book/audiobook. */
export const listReviews = async (
  contentType: ReviewContentType,
  contentId: string,
): Promise<{ reviews: BookReview[]; aggregate: ReviewAggregate }> => {
  const response = await fetch(`/api/${apiSegment(contentType)}/${encodeURIComponent(contentId)}/reviews`);
  if (!response.ok) throw await errorFrom(response, 'Could not load reviews.');
  const data = await response.json();
  return {
    reviews: (data.reviews as BookReview[]) ?? [],
    aggregate: (data.aggregate as ReviewAggregate) ?? { count: 0, average: 0 },
  };
};

/** Member: submit (or update) a review — goes to the moderation queue as 'pending'. */
export const submitReview = async (
  contentType: ReviewContentType,
  contentId: string,
  input: NewReview,
): Promise<void> => {
  const rating = Math.round(Number(input.rating));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new Error('Please choose a rating from 1 to 5 stars.');
  }
  const response = await fetch(`/api/${apiSegment(contentType)}/${encodeURIComponent(contentId)}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await adminAuthHeaders()) },
    body: JSON.stringify({ rating, body: input.body.trim().slice(0, MAX_REVIEW_TEXT), authorName: input.authorName }),
  });
  if (!response.ok) throw await errorFrom(response, 'Could not submit your review.');
};

/** Admin: the moderation queue for a given status (default pending), across books + audiobooks. */
export const listReviewsForModeration = async (status: ReviewStatus = 'pending'): Promise<BookReview[]> => {
  const response = await fetch(`/api/admin/reviews?status=${encodeURIComponent(status)}`, {
    headers: await adminAuthHeaders(),
  });
  if (!response.ok) throw await errorFrom(response, 'Could not load the review queue.');
  const data = await response.json();
  return (data.reviews as BookReview[]) ?? [];
};

/** Admin: approve or reject a review. */
export const setReviewStatus = async (
  id: string,
  status: 'approved' | 'rejected',
): Promise<void> => {
  const response = await fetch(`/api/admin/reviews/${encodeURIComponent(id)}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await adminAuthHeaders()) },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw await errorFrom(response, 'Could not update the review.');
};

/** Admin: permanently delete a review (e.g. un-publish an approved one). */
export const deleteReview = async (id: string): Promise<void> => {
  const response = await fetch(`/api/admin/reviews/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: await adminAuthHeaders(),
  });
  if (!response.ok) throw await errorFrom(response, 'Could not remove the review.');
};
