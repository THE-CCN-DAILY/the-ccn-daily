import { adminAuthHeaders } from './adminAuth';

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

export interface GivingIntentInput {
  amount: number;
  giftType: 'monthly' | 'one-time';
  donorName?: string;
  donorEmail?: string;
  userId?: string;
}

export interface GivingIntentResult {
  tx_ref: string;
  amount: number;
  currency: string;
  giftType: 'monthly' | 'one-time';
  publicKey?: string;
}

export const createGivingIntent = async (input: GivingIntentInput): Promise<GivingIntentResult> => {
  return requestJson<GivingIntentResult>('/api/giving/intent', {
    method: 'POST',
    headers: input.userId ? await adminAuthHeaders() : undefined,
    body: JSON.stringify(input),
  });
};
