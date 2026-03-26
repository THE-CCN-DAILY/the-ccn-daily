import type { Request, Response } from 'express';
import crypto from 'crypto';
import type { PaymentEvent } from '../../types/monetization';
import { grantOwnedEntitlement, revokeOwnedEntitlement } from '../../services/entitlementAdminService';
import { writeAuditLog } from '../../services/auditLogService';

function verifySignature(rawBody: string, signature: string | undefined, secret: string): boolean {
  if (!signature) return false;
  const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
}

export async function paymentWebhookHandler(req: Request, res: Response) {
  try {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET || '';
    const signature = req.headers['x-webhook-signature'] as string | undefined;
    const rawBody = JSON.stringify(req.body);

    if (!verifySignature(rawBody, signature, secret)) {
      await writeAuditLog({ action: 'webhook_rejected', metadata: { reason: 'invalid_signature' } });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body as PaymentEvent;

    if (event.type === 'payment.succeeded' && event.productType === 'resource_one_time') {
      await grantOwnedEntitlement(event.userId, event.productId, event.txRef);
    }

    if (event.type === 'payment.refunded' && event.productType === 'resource_one_time') {
      await revokeOwnedEntitlement(event.userId, event.productId, event.txRef);
      await writeAuditLog({ action: 'refund_processed', userId: event.userId, resourceId: event.productId, metadata: { txRef: event.txRef } });
    }

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Webhook processing failed' });
  }
}
