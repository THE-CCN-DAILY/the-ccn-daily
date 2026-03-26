import { getFirestore } from 'firebase-admin/firestore';
import { grantOwnedEntitlement } from '../services/entitlementAdminService';
import { writeAuditLog } from '../services/auditLogService';

export async function runReconciliationJob() {
  const db = getFirestore();
  const purchases = await db.collection('user_purchases').where('status', '==', 'active').get();

  const fixes: Array<{ userId: string; resourceId: string; txRef: string }> = [];

  for (const doc of purchases.docs) {
    const p = doc.data();
    const entId = `${p.userId}_${p.resourceId}_owned`;
    const entDoc = await db.collection('user_entitlements').doc(entId).get();
    if (!entDoc.exists || entDoc.data()?.isActive !== true) {
      fixes.push({ userId: p.userId, resourceId: p.resourceId, txRef: p.txRef });
    }
  }

  for (const f of fixes) {
    await grantOwnedEntitlement(f.userId, f.resourceId, f.txRef);
    await writeAuditLog({
      action: 'reconciliation_fix_applied',
      userId: f.userId,
      resourceId: f.resourceId,
      metadata: { txRef: f.txRef },
    });
  }

  return { scanned: purchases.size, fixesApplied: fixes.length };
}
