import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { listAdminUsers, updateUserRole, type AdminUser, type AssignableRole } from '../services/adminService';

// Mirrors the worker's ASSIGNABLE_ROLES + isAdminRequest contract. The founder
// allowlist below can never be demoted (the worker enforces this too).
const SUPER_ADMIN_EMAILS = ['pastor.eryeza@gmail.com', 'ccndaily@gmail.com'];

const ROLE_OPTIONS: { value: AssignableRole; label: string }[] = [
  { value: 'user', label: 'User' },
  { value: 'family_lead', label: 'Family Lead' },
  { value: 'group_lead', label: 'Group Lead' },
  { value: 'lead_developer', label: 'Lead Developer' },
  { value: 'admin', label: 'Admin' },
];

const ROLE_GLOSSARY: { name: string; blurb: string }[] = [
  {
    name: 'User',
    blurb: 'A member. Full access to the sanctuary — devotionals, Bible, books, community, giving. No admin tools.',
  },
  {
    name: 'Family Lead',
    blurb: 'A member who also stewards a household: sees the Family Dashboard to invite and encourage their people.',
  },
  {
    name: 'Group Lead',
    blurb: 'A member who shepherds a small group: sees the Leader Dashboard to assign and track shared progress.',
  },
  {
    name: 'Lead Developer',
    blurb: 'Engineering access to technical and content tooling (content manager, release ops). No billing or secrets.',
  },
  {
    name: 'Admin',
    blurb: 'Ministry operator: manage content, review scholarships, moderate comments, see giving and diagnostics, manage roles. Cannot change billing or secrets.',
  },
  {
    name: 'Founder (super-admin)',
    blurb: 'The un-removable owner. Everything an admin can do, plus the permanent fallback who can always grant or revoke admin. Set by the ministry-owner allowlist — never demotable here.',
  },
];

const Roles: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    let active = true;
    listAdminUsers()
      .then(({ users: rows }) => {
        if (active) setUsers(rows);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to load users.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleRoleChange = async (userId: string, newRole: AssignableRole) => {
    if (!isAdmin) {
      toast.error('Only admins can change roles.');
      return;
    }
    const previous = users.find((u) => u.id === userId)?.role;
    setSavingId(userId);
    // Optimistic update; roll back on failure.
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    try {
      const updated = await updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)));
      toast.success('Role updated.');
    } catch (err) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: previous ?? 'user' } : u)));
      toast.error(err instanceof Error ? err.message : 'Failed to update role.');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="text-brand-text-secondary">Loading users...</div>;
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Roles &amp; Permissions</h1>
      <p className="text-lg text-brand-text-secondary mb-6 max-w-3xl">
        Authority is stored once in the member database — promote someone here and it takes effect
        across the whole app. The founder account is the permanent root and can&apos;t be demoted.
      </p>

      <Card className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-accent mb-4">What these roles mean</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          {ROLE_GLOSSARY.map((r) => (
            <div key={r.name}>
              <dt className="font-semibold text-brand-text-primary">{r.name}</dt>
              <dd className="text-sm text-brand-text-secondary mt-0.5">{r.blurb}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-brand-border">
                <th className="py-3 px-4 text-brand-text-primary font-semibold">User</th>
                <th className="py-3 px-4 text-brand-text-primary font-semibold">Email</th>
                <th className="py-3 px-4 text-brand-text-primary font-semibold">Current Role</th>
                <th className="py-3 px-4 text-brand-text-primary font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSuperAdmin = SUPER_ADMIN_EMAILS.includes((u.email || '').toLowerCase());
                return (
                  <tr key={u.id} className="border-b border-brand-border/50 hover:bg-brand-secondary/50">
                    <td className="py-3 px-4 text-brand-text-secondary">
                      {u.displayName || 'Unknown'}
                      {isSuperAdmin && (
                        <span className="ml-2 text-[11px] font-bold uppercase tracking-wide text-brand-accent">Founder</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-brand-text-secondary">{u.email}</td>
                    <td className="py-3 px-4 text-brand-text-secondary capitalize">{(u.role || 'user').replace('_', ' ')}</td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role || 'user'}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as AssignableRole)}
                        disabled={isSuperAdmin || !isAdmin || savingId === u.id}
                        className="bg-brand-dark border border-brand-border text-brand-text-primary text-sm rounded-lg focus:ring-brand-accent focus:border-brand-accent block w-full p-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 px-4 text-center text-brand-text-secondary">
                    No members yet. Roles appear here as people sign in.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Roles;
