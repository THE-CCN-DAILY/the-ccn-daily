import { getFirestore } from 'firebase-admin/firestore';

export async function writeAuditLog(input: {
  action:
    | 'purchase_intent_created'
    | 'purchase_completed'
    | 'entitlement_granted'
    | 'entitlement_revoked'
    | 'refund_processed'
    | 'webhook_rejected'
    | 'reconciliation_fix_applied';
  actorId?: string;
  userId?: string;
  resourceId?: string;
  subscriptionId?: string;
  metadata?: Record<string, unknown>;
}) {
  const db = getFirestore();
  await db.collection('auditLogs').add({
    ...input,
    createdAt: new Date().toISOString(),
  });
}
