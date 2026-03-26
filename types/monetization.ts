export type PaymentEventType = 'payment.succeeded' | 'payment.failed' | 'payment.refunded';

export interface PaymentEvent {
  id: string; // provider event id
  type: PaymentEventType;
  txRef: string;
  userId: string;
  productType: 'resource_one_time' | 'subscription';
  productId: string;
  amount: number;
  currency: string;
  timestamp: string;
}

export interface IdempotencyRecord {
  key: string;
  route: string;
  status: 'processing' | 'completed' | 'failed';
  responseBody?: unknown;
  createdAt: string;
  updatedAt: string;
}
