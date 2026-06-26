import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { UserPlus, Trash2, ShieldAlert, Mail } from 'lucide-react';
import {
  listAdminUsers,
  updateUserRole,
  listPendingInvites,
  createPendingInvite,
  revokePendingInvite,
  type AdminUser,
  type AssignableRole,
  type RoleInvite,
} from '../services/adminService';

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
  const [invites, setInvites] = useState<RoleInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AssignableRole>('user');
  const [inviting, setInviting] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const currentEmailNormalized = (currentUser?.email || '').toLowerCase().trim();
  const isCurrentSuperAdmin = SUPER_ADMIN_EMAILS.includes(currentEmailNormalized);

  const loadData = async () => {
    try {
      const [usersData, invitesData] = await Promise.all([
        listAdminUsers(),
        listPendingInvites(),
      ]);
      setUsers(usersData.users);
      setInvites(invitesData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load roles data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: AssignableRole) => {
    if (!isAdmin) {
      toast.error('Only admins can change roles.');
      return;
    }
    const targetUser = users.find((u) => u.id === userId);
    const previous = targetUser?.role;
    const targetEmailNormalized = (targetUser?.email || '').toLowerCase().trim();

    // UI double-check security: Prevent regular admin from promoting to or demoting Admin/Lead Developer roles
    const isTargetElevated = previous === 'admin' || previous === 'lead_developer';
    const isNewRoleElevated = newRole === 'admin' || newRole === 'lead_developer';

    if (!isCurrentSuperAdmin && (isTargetElevated || isNewRoleElevated)) {
      toast.error('Only super-admins (founders) can promote or demote Admin or Lead Developer accounts.');
      return;
    }

    setSavingId(userId);
    // Optimistic update
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    try {
      const updated = await updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)));
      toast.success('Role updated successfully.');
    } catch (err) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: previous ?? 'user' } : u)));
      toast.error(err instanceof Error ? err.message : 'Failed to update role.');
    } finally {
      setSavingId(null);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Only admins can invite team members.');
      return;
    }
    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      toast.error('Please enter a valid email address.');
      return;
    }

    // UI double-check security: Only super-admins can invite Admin or Lead Developer
    const isNewRoleElevated = inviteRole === 'admin' || inviteRole === 'lead_developer';
    if (!isCurrentSuperAdmin && isNewRoleElevated) {
      toast.error('Only super-admins (founders) can invite users to Admin or Lead Developer roles.');
      return;
    }

    setInviting(true);
    try {
      const res = await createPendingInvite(email, inviteRole);
      toast.success(res.message);
      setInviteEmail('');
      setInviteRole('user');
      // Reload roles and invites lists
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create invitation.');
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvite = async (email: string) => {
    if (!isAdmin) {
      toast.error('Only admins can revoke invitations.');
      return;
    }

    const invite = invites.find((i) => i.email === email);
    const isInviteRoleElevated = invite?.role === 'admin' || invite?.role === 'lead_developer';
    if (!isCurrentSuperAdmin && isInviteRoleElevated) {
      toast.error('Only super-admins (founders) can revoke Admin or Lead Developer invitations.');
      return;
    }

    if (!window.confirm(`Are you sure you want to revoke the invitation for ${email}?`)) {
      return;
    }

    try {
      const res = await revokePendingInvite(email);
      toast.success(res.message);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke invitation.');
    }
  };

  if (loading) {
    return <div className="text-brand-text-secondary">Loading users and invitations...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Roles &amp; Permissions</h1>
        <p className="text-lg text-brand-text-secondary max-w-3xl">
          Authority is stored once in the member database. Promote someone here or authorize a non-member's email, and the role will automatically sync upon sign-in.
        </p>
      </div>

      {/* Superadmin Alert */}
      {!isCurrentSuperAdmin && (
        <div className="flex gap-3 items-start p-4 rounded-xl border border-brand-border bg-brand-primary/40 text-brand-text-secondary text-sm">
          <ShieldAlert className="h-5 w-5 text-brand-accent shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-brand-text-primary">Super-Admin Protection Active</p>
            <p className="mt-1">
              You are signed in as a standard administrator. You can assign and manage roles for members, but only super-admins (founders) can promote, demote, or invite accounts to <strong>Admin</strong> or <strong>Lead Developer</strong> roles.
            </p>
          </div>
        </div>
      )}

      {/* Grid: Invite Non-Member + Glossary */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Invite Form */}
        <Card className="lg:col-span-1 h-full flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-brand-accent mb-4 flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Authorize Team Role
            </h2>
            <p className="text-sm text-brand-text-secondary mb-6">
              Enter an email address to authorize a role. If they are already a member, their role updates instantly. If not, a pending invite is created and automatically granted when they first sign up.
            </p>
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-text-secondary uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-brand-text-secondary/50" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full rounded-lg border border-brand-border bg-brand-dark pl-11 pr-4 py-3 text-sm text-brand-text-primary outline-none focus:border-brand-accent/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text-secondary uppercase tracking-wider mb-2">
                  Role to Assign
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as AssignableRole)}
                  className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-brand-text-primary outline-none focus:border-brand-accent/50 transition-colors"
                >
                  {ROLE_OPTIONS.map((opt) => {
                    const isElevatedRole = opt.value === 'admin' || opt.value === 'lead_developer';
                    const optionDisabled = isElevatedRole && !isCurrentSuperAdmin;
                    return (
                      <option key={opt.value} value={opt.value} disabled={optionDisabled}>
                        {opt.label} {optionDisabled ? '(Super-Admin Only)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <button
                type="submit"
                disabled={inviting || !isAdmin}
                className="w-full bg-brand-accent text-white px-5 py-3 rounded-lg font-semibold text-sm hover:bg-brand-cta-light disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
              >
                {inviting ? 'Authorizing...' : 'Authorize Email'}
              </button>
            </form>
          </div>
        </Card>

        {/* Right: Glossary */}
        <Card className="lg:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand-accent mb-4">What these roles mean</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            {ROLE_GLOSSARY.map((r) => (
              <div key={r.name} className="border-b border-brand-border/20 pb-3 last:border-0 last:pb-0">
                <dt className="font-semibold text-brand-text-primary text-[15px]">{r.name}</dt>
                <dd className="text-xs leading-relaxed text-brand-text-secondary mt-1">{r.blurb}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      {/* Active Team Members */}
      <Card>
        <h2 className="text-base font-bold text-brand-text-primary mb-4">Active Team &amp; Members</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-brand-border">
                <th className="py-3 px-4 text-brand-text-primary font-semibold text-sm">User</th>
                <th className="py-3 px-4 text-brand-text-primary font-semibold text-sm">Email</th>
                <th className="py-3 px-4 text-brand-text-primary font-semibold text-sm">Current Role</th>
                <th className="py-3 px-4 text-brand-text-primary font-semibold text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const targetEmailNormalized = (u.email || '').toLowerCase().trim();
                const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(targetEmailNormalized);
                const isTargetElevated = u.role === 'admin' || u.role === 'lead_developer';

                return (
                  <tr key={u.id} className="border-b border-brand-border/50 hover:bg-brand-secondary/50">
                    <td className="py-3 px-4 text-sm text-brand-text-secondary">
                      <span className="font-semibold text-brand-text-primary">
                        {u.displayName || 'Unknown Member'}
                      </span>
                      {isSuperAdmin && (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded">
                          Founder
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-brand-text-secondary">{u.email}</td>
                    <td className="py-3 px-4 text-sm text-brand-text-secondary capitalize">
                      {(u.role || 'user').replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role || 'user'}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as AssignableRole)}
                        disabled={
                          isSuperAdmin ||
                          !isAdmin ||
                          savingId === u.id ||
                          (!isCurrentSuperAdmin && isTargetElevated)
                        }
                        className="bg-brand-dark border border-brand-border text-brand-text-primary text-xs rounded-lg focus:ring-brand-accent/50 focus:border-brand-accent/50 block w-full p-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {ROLE_OPTIONS.map((opt) => {
                          const isElevatedRole = opt.value === 'admin' || opt.value === 'lead_developer';
                          const optionDisabled = isElevatedRole && !isCurrentSuperAdmin;
                          return (
                            <option key={opt.value} value={opt.value} disabled={optionDisabled}>
                              {opt.label} {optionDisabled ? '(Super-Admin Only)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 px-4 text-center text-sm text-brand-text-secondary">
                    No members found. Members appear here as soon as they sign up.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pending Invitations */}
      <Card>
        <h2 className="text-base font-bold text-brand-text-primary mb-1">Pending Role Authorizations</h2>
        <p className="text-xs text-brand-text-secondary mb-4">
          Non-members whose email addresses have been pre-authorized. When they register, they will be given these roles automatically.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-brand-border">
                <th className="py-3 px-4 text-brand-text-primary font-semibold text-sm">Authorized Email</th>
                <th className="py-3 px-4 text-brand-text-primary font-semibold text-sm">Pending Role</th>
                <th className="py-3 px-4 text-brand-text-primary font-semibold text-sm">Authorized By</th>
                <th className="py-3 px-4 text-brand-text-primary font-semibold text-sm">Created</th>
                <th className="py-3 px-4 text-brand-text-primary font-semibold text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => {
                const isInviteElevated = invite.role === 'admin' || invite.role === 'lead_developer';
                const canRevoke = isCurrentSuperAdmin || !isInviteElevated;

                return (
                  <tr key={invite.email} className="border-b border-brand-border/50 hover:bg-brand-secondary/50">
                    <td className="py-3 px-4 text-sm text-brand-text-primary font-semibold">{invite.email}</td>
                    <td className="py-3 px-4 text-sm text-brand-text-secondary capitalize">
                      {invite.role.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-sm text-brand-text-secondary">{invite.invited_by}</td>
                    <td className="py-3 px-4 text-sm text-brand-text-secondary">
                      {new Date(invite.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleRevokeInvite(invite.email)}
                        disabled={!canRevoke || !isAdmin}
                        className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title={!canRevoke ? 'Only super-admins can revoke elevated invitations' : 'Revoke invitation'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Revoke
                      </button>
                    </td>
                  </tr>
                );
              })}
              {invites.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 px-4 text-center text-sm text-brand-text-secondary">
                    No pending authorizations. Enter an email in the form above to invite someone.
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
