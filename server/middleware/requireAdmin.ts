import type { Response, NextFunction } from 'express';
import type { AuthedRequest } from './requireAuth';
import { getFirestore } from 'firebase-admin/firestore';

export async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user?.uid) return res.status(401).json({ error: 'Unauthorized' });

    const db = getFirestore();
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const role = userDoc.data()?.role || 'user';

    if (role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    req.user.role = role;
    next();
  } catch {
    res.status(500).json({ error: 'Admin check failed' });
  }
}
