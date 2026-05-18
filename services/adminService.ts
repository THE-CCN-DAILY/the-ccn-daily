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
    headers: { 'x-admin-email': ADMIN_EMAIL },
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
