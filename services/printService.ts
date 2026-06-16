import { adminAuthHeaders } from './adminAuth';

// Print-edition distribution + waitlist. The worker is country-aware via
// Cloudflare's request.cf.country, so the member calls need no country argument.

export type PrintState = 'notOffered' | 'available' | 'comingSoon';

export interface PrintAvailability {
  state: PrintState;
  country: string;
  countryName: string;
  priceUsd?: number;
  price?: number;     // localized amount when available
  currency?: string;  // localized currency when available
}

export interface PrintRequest {
  id: string;
  bookId: string;
  bookTitle: string;
  name: string;
  email: string;
  country: string;
  countryName: string;
  message: string;
  status: string;
  createdAt: string;
}

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
};

export const getPrintAvailability = (bookId: string): Promise<PrintAvailability> =>
  requestJson<PrintAvailability>(`/api/books/${encodeURIComponent(bookId)}/print`);

export const requestPrintAccess = (
  bookId: string,
  payload: { email: string; name?: string; country?: string; message?: string },
): Promise<{ ok: boolean }> =>
  requestJson(`/api/books/${encodeURIComponent(bookId)}/print-request`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// ── Admin ──────────────────────────────────────────────────────────────────

export const listPrintRequests = async (): Promise<PrintRequest[]> => {
  const data = await requestJson<{ requests: PrintRequest[] }>('/api/admin/print-requests', {
    headers: await adminAuthHeaders(),
  });
  return data.requests || [];
};

export const setBookPrintAvailability = async (
  bookId: string,
  payload: { printEnabled: boolean; printCountries: string[]; printPriceUsd: number },
): Promise<{ book: unknown }> =>
  requestJson(`/api/admin/books/${encodeURIComponent(bookId)}/print`, {
    method: 'POST',
    headers: await adminAuthHeaders(),
    body: JSON.stringify(payload),
  });
