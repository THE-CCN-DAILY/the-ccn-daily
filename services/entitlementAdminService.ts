import { getFirestore } from 'firebase-admin/firestore';
import { writeAuditLog } from './auditLogService';

const db = getFirestore();

export async function grantOwnedEntitlement(userId: string, resourceId: string, txRef: string) {
  const purchaseRef = db.collection('user_purchases').doc(`${userId}_${resourceId}_${txRef}`);
  const entitlementRef = db.collection('user_entitlements').doc(`${userId}_${resourceId}_owned`);

  await db.runTransaction(async tx => {
    tx.set(purchaseRef, {
      userId, resourceId, txRef, status: 'active', purchasedAt: new Date().toISOString(),
    }, { merge: true });

    tx.set(entitlementRef, {
      userId,
      resourceId,
      accessType: 'owned_perpetual',
      source: 'purchase',
      startsAt: new Date().toISOString(),
      endsAt: null,
      isActive: true,
    }, { merge: true });
  });

  await writeAuditLog({ action: 'entitlement_granted', userId, resourceId, metadata: { txRef } });
}

export async function revokeOwnedEntitlement(userId: string, resourceId: string, txRef: string) {
  const purchaseRef = db.collection('user_purchases').doc(`${userId}_${resourceId}_${txRef}`);
  const entitlementRef = db.collection('user_entitlements').doc(`${userId}_${resourceId}_owned`);

  await db.runTransaction(async tx => {
    tx.set(purchaseRef, { status: 'refunded', refundedAt: new Date().toISOString() }, { merge: true });
    tx.set(entitlementRef, { isActive: false, revokedAt: new Date().toISOString() }, { merge: true });
  });

  await writeAuditLog({ action: 'entitlement_revoked', userId, resourceId, metadata: { txRef } });
}
