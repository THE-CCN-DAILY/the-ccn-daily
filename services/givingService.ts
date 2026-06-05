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

export interface GivingStatusResult {
  tx_ref: string;
  status: 'pending' | 'active' | 'failed' | 'unknown';
  amount?: number;
  currency?: string;
  giftType?: 'monthly' | 'one-time';
}

export const createGivingIntent = async (input: GivingIntentInput): Promise<GivingIntentResult> => {
  return requestJson<GivingIntentResult>('/api/giving/intent', {
    method: 'POST',
    headers: input.userId ? await adminAuthHeaders() : undefined,
    body: JSON.stringify(input),
  });
};

export const getGivingStatus = async (txRef: string): Promise<GivingStatusResult> => {
  return requestJson<GivingStatusResult>(`/api/giving/status/${encodeURIComponent(txRef)}`);
};

export const waitForGivingConfirmation = async (
  txRef: string,
  attempts = 6,
  delayMs = 1800,
): Promise<GivingStatusResult> => {
  let lastStatus: GivingStatusResult = { tx_ref: txRef, status: 'unknown' };

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      lastStatus = await getGivingStatus(txRef);
    } catch {
      lastStatus = { tx_ref: txRef, status: 'unknown' };
    }
    if (lastStatus.status === 'active' || lastStatus.status === 'failed') return lastStatus;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return lastStatus;
};
