import type { UserEntitlement, UserPurchase } from '../types/entitlements';

export interface PurchaseIntentInput {
  userId: string;
  resourceId: string;
  priceUsd: number;
}

export interface PurchaseIntentResult {
  intentId: string;
  txRef: string;
  checkoutUrl?: string;
}

export async function createPurchaseIntent(input: PurchaseIntentInput): Promise<PurchaseIntentResult> {
  // TODO: call backend payment intent endpoint (Flutterwave)
  return {
    intentId: `intent_${Date.now()}`,
    txRef: `tx_${input.userId}_${input.resourceId}_${Date.now()}`,
  };
}

export async function completePurchase(params: {
  userId: string;
  resourceId: string;
  txRef: string;
}): Promise<{ purchase: UserPurchase; entitlement: UserEntitlement }> {
  // TODO: replace with backend verified webhook flow or Firestore write
  const now = new Date().toISOString();

  const purchase: UserPurchase = {
    id: `pur_${Date.now()}`,
    userId: params.userId,
    resourceId: params.resourceId,
    purchasedAt: now,
    status: 'active',
  };

  const entitlement: UserEntitlement = {
    id: `ent_${Date.now()}`,
    userId: params.userId,
    resourceId: params.resourceId,
    accessType: 'owned_perpetual',
    source: 'purchase',
    startsAt: now,
    endsAt: null,
    isActive: true,
  };

  return { purchase, entitlement };
}
