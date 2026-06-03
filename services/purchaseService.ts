import type { UserEntitlement } from '../types/entitlements';
import type { UserSubscription } from './entitlementService';
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

export type PaidTier = 'pro' | 'max' | 'partner';

export interface PaymentIntentInput {
  userId: string;
  tier: PaidTier;
  billingCycle: 'monthly' | 'yearly';
}

export interface PaymentIntentResult {
  tx_ref: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  tier: PaidTier;
  /** Server-provided Flutterwave public key (may be undefined if not set server-side). */
  publicKey?: string;
}

/**
 * Create a SERVER-AUTHORITATIVE payment intent.
 *
 * The server computes the price (tier + billing cycle + PPP from request geo),
 * records a pending purchase, and returns the amount/currency/tx_ref the client
 * must use to initialize Flutterwave. The client never sets the price, and
 * entitlements are NOT written here — only the verified Flutterwave webhook grants
 * access.
 */
export const createPaymentIntent = async (input: PaymentIntentInput): Promise<PaymentIntentResult> => {
  return requestJson<PaymentIntentResult>('/api/payments/intent', {
    method: 'POST',
    headers: await adminAuthHeaders(),
    body: JSON.stringify({
      userId: input.userId,
      tier: input.tier,
      billingCycle: input.billingCycle,
    }),
  });
};

export interface SubscriptionReadback {
  tier: UserSubscription['tier'];
  status: UserSubscription['status'];
  endsAt?: string | null;
  entitlements: UserEntitlement[];
}

/**
 * Read back the user's current subscription + active entitlements from the server.
 * This is the source of truth after a webhook grant.
 */
export const getUserSubscription = async (userId: string): Promise<SubscriptionReadback> => {
  const data = await requestJson<{
    tier: UserSubscription['tier'];
    status: UserSubscription['status'];
    endsAt?: string | null;
    entitlements?: UserEntitlement[];
  }>(`/api/users/${encodeURIComponent(userId)}/subscription`, {
    headers: await adminAuthHeaders(),
  });

  return {
    tier: data.tier || 'free',
    status: data.status || 'none',
    endsAt: data.endsAt ?? null,
    entitlements: data.entitlements || [],
  };
};
