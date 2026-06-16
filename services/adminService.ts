import { adminAuthHeaders } from './adminAuth';

export interface AdminUser {
  id: string;
  uid?: string;
  displayName?: string;
  email: string;
  role: string;
  tier?: string;
  createdAt?: string;
  updatedAt?: string;
  lastActiveAt?: string;
}

export interface AdminUserStats {
  total: number;
  admins: number;
  active30d: number;
}

const ADMIN_EMAIL = 'pastor.eryeza@gmail.com';

const formatDate = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
};

export const listAdminUsers = async (): Promise<{ users: AdminUser[]; stats: AdminUserStats }> => {
  const response = await fetch('/api/admin/users', {
    headers: await adminAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.error || 'Failed to load admin users');
  }

  const data = await response.json();
  return {
    users: (data.users || []).map((user: AdminUser) => ({
      ...user,
      createdAt: formatDate(user.createdAt),
      lastActiveAt: formatDate(user.lastActiveAt),
    })),
    stats: data.stats || { total: 0, admins: 0, active30d: 0 },
  };
};

export type AssignableRole = 'user' | 'family_lead' | 'group_lead' | 'lead_developer' | 'admin';

/**
 * Promote or demote a user. Authority lives in D1 (`users.role`); the worker verifies the
 * caller is an admin via their Firebase ID token before updating the row.
 */
export const updateUserRole = async (userId: string, role: AssignableRole): Promise<AdminUser> => {
  const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await adminAuthHeaders()) },
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.error || 'Failed to update role');
  }

  const data = await response.json();
  return data.user as AdminUser;
};
