export type AccessType = 'subscription_included' | 'owned_perpetual' | 'trial_limited';

export interface Resource {
  id: string;
  type: 'book' | 'course' | 'audiobook' | 'challenge';
  title: string;
  accessLane: 'included' | 'owned' | 'hybrid';
  isPremium: boolean;
  priceUsd?: number;
  tierRequired?: 'free' | 'pro' | 'max';
}

export interface UserPurchase {
  id: string;
  userId: string;
  resourceId: string;
  purchasedAt: string;
  status: 'active' | 'refunded' | 'revoked';
}

export interface UserEntitlement {
  id: string;
  userId: string;
  resourceId: string;
  accessType: AccessType;
  source: 'purchase' | 'subscription' | 'trial' | 'grant';
  startsAt: string;
  endsAt?: string | null;
  isActive: boolean;
}
