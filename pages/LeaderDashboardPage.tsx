import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import Card from '../components/Card';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Lightbulb } from 'lucide-react';
import { PlusIcon, UserIcon, ChartBarIcon, ReaderIcon, CloseIcon } from '../components/icons';
import {
  GroupAssignment,
  GroupAssignmentType,
  GroupMember,
  createGroupAssignment,
  getGroupOverview,
  inviteGroupMember,
  removeGroupAssignment,
  removeGroupMember,
} from '../services/householdService';

const ASSIGNMENT_TYPES: { value: GroupAssignmentType; label: string }[] = [
  { value: 'devotional', label: 'Devotional' },
  { value: 'course', label: 'Course' },
  { value: 'challenge', label: 'Challenge' },
  { value: 'practice', label: 'Practice' },
];

const formatLastActive = (value?: string) => {
  if (!value) return 'Not yet';
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return 'Not yet';
  const days = Math.floor((Date.now() - parsed) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(parsed).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const LeaderDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [assignments, setAssignments] = useState<GroupAssignment[]>([]);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentType, setAssignmentType] = useState<GroupAssignmentType>('practice');
  const [isAssigning, setIsAssigning] = useState(false);
  const assignmentInputRef = useRef<HTMLInputElement>(null);

  const refreshOverview = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const overview = await getGroupOverview(user.uid);
      setMembers(overview.members);
      setAssignments(overview.assignments);
      setLoadError('');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Your group could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    setIsLoading(true);
    refreshOverview();
  }, [refreshOverview]);

  const activeMembers = useMemo(
    () => members.filter((member) => member.status === 'active'),
    [members]
  );

  const participation = useMemo(() => {
    if (activeMembers.length === 0) return 0;
    const total = activeMembers.reduce((sum, member) => sum + member.engagementScore, 0);
    return Math.round(total / activeMembers.length);
  }, [activeMembers]);

  const focusAssignmentForm = () => {
    assignmentInputRef.current?.focus();
    assignmentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !user?.uid) return;

    setIsInviting(true);
    try {
      const result = await inviteGroupMember(user.uid, inviteEmail.trim());
      setInviteEmail('');
      notify(
        result.emailSent
          ? 'Invitation sent. They will receive an email with their place.'
          : 'Invitation recorded. A place is held in your group.',
        'success'
      );
      await refreshOverview();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'The invitation could not be sent.', 'error');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (!user?.uid) return;
    if (window.confirm('Are you sure you want to remove this member from the group?')) {
      try {
        await removeGroupMember(user.uid, id);
        notify('Member removed.', 'success');
        await refreshOverview();
      } catch (error) {
        notify(error instanceof Error ? error.message : 'The member could not be removed.', 'error');
      }
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentTitle.trim() || !user?.uid) return;

    setIsAssigning(true);
    try {
      await createGroupAssignment(user.uid, assignmentTitle.trim(), assignmentType);
      setAssignmentTitle('');
      notify('Practice assigned to your group.', 'success');
      await refreshOverview();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'The practice could not be assigned.', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveAssignment = async (id: string) => {
    if (!user?.uid) return;
    if (window.confirm('Remove this assignment from your group?')) {
      try {
        await removeGroupAssignment(user.uid, id);
        notify('Assignment removed.', 'success');
        await refreshOverview();
      } catch (error) {
        notify(error instanceof Error ? error.message : 'The assignment could not be removed.', 'error');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <motion.div
        className="mb-8 rounded-lg border border-brand-border p-7 md:p-9 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-paper) 68%, color-mix(in srgb, var(--sage) 9%, var(--bg-card)) 100%)',
          boxShadow: 'var(--sh-card)',
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--sans-ui)', color: 'var(--gold-ds, #B7892E)' }}>Group stewardship</p>
          <h1 className="text-4xl font-semibold text-brand-text-primary mb-2" style={{ fontFamily: 'var(--serif-display)' }}>
            Leader Table
          </h1>
          <p className="text-brand-text-secondary max-w-2xl">Guide your group with shared Scripture practice, gentle accountability, and clear next steps.</p>
        </div>
        <button
          onClick={focusAssignmentForm}
          className="flex-shrink-0 px-6 py-2.5 bg-brand-accent text-white font-semibold rounded-md hover:bg-opacity-90 transition-colors self-start sm:self-auto"
        >
          Assign Practice
        </button>
      </motion.div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-brand-border bg-brand-dark/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-accent/20 flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-brand-accent" />
            </div>
            <div>
              <p className="text-sm text-brand-text-secondary">People walking together</p>
              <h3 className="text-2xl font-bold text-brand-text-primary">{members.length}</h3>
            </div>
          </div>
        </Card>

        <Card className="border-brand-border bg-brand-dark/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-status-success/20 flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-status-success" />
            </div>
            <div>
              <p className="text-sm text-brand-text-secondary">Shared participation</p>
              <h3 className="text-2xl font-bold text-brand-text-primary">{participation}%</h3>
            </div>
          </div>
        </Card>

        <Card className="border-brand-border bg-brand-dark/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-secondary flex items-center justify-center">
              <ReaderIcon className="w-6 h-6 text-brand-text-primary" />
            </div>
            <div>
              <p className="text-sm text-brand-text-secondary">Active practices</p>
              <h3 className="text-2xl font-bold text-brand-text-primary">{assignments.length}</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Invites & Active Content */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="border-brand-border bg-brand-dark/20">
            <h2 className="text-lg font-bold text-brand-text-primary mb-4 flex items-center gap-2">
              <PlusIcon className="w-5 h-5 text-brand-accent" />
              Invite someone
            </h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent"
                />
              </div>
              <button
                type="submit"
                disabled={isInviting}
                className="w-full py-3 bg-brand-secondary text-brand-text-primary border border-brand-border rounded-lg font-bold hover:bg-brand-border transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isInviting ? 'Sending...' : 'Send Invite'}
              </button>
            </form>
          </Card>

          <Card className="border-brand-border bg-brand-dark/20">
            <h2 className="text-lg font-bold text-brand-text-primary mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-brand-accent" />
              Current Assignments
            </h2>

            <form onSubmit={handleCreateAssignment} className="space-y-3 mb-5">
              <input
                ref={assignmentInputRef}
                type="text"
                value={assignmentTitle}
                onChange={(e) => setAssignmentTitle(e.target.value)}
                placeholder="Name the practice, course, or challenge"
                maxLength={160}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent"
              />
              <div className="flex gap-2">
                <select
                  value={assignmentType}
                  onChange={(e) => setAssignmentType(e.target.value as GroupAssignmentType)}
                  className="flex-1 bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-text-primary focus:outline-none focus:border-brand-accent"
                >
                  {ASSIGNMENT_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={isAssigning || !assignmentTitle.trim()}
                  className="px-4 py-2.5 bg-brand-accent text-white rounded-lg text-sm font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50"
                >
                  {isAssigning ? 'Assigning…' : 'Assign'}
                </button>
              </div>
            </form>

            <div className="space-y-4">
              {assignments.length === 0 && !isLoading && (
                <p className="text-xs text-brand-text-secondary">
                  Nothing assigned yet. Set a shared practice above and your group will see it here.
                </p>
              )}
              {assignments.map((assignment) => (
                <div key={assignment.id} className="p-4 rounded-lg bg-brand-dark border border-brand-border">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm text-brand-text-primary font-bold">{assignment.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] bg-brand-accent/20 text-brand-accent px-2 py-0.5 rounded-full capitalize">{assignment.type}</span>
                      <button
                        onClick={() => handleRemoveAssignment(assignment.id)}
                        className="p-1 text-brand-text-secondary hover:text-red-500 transition-colors"
                        title="Remove assignment"
                      >
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-brand-secondary rounded-full h-1.5 mb-1">
                    <div className="bg-brand-accent h-1.5 rounded-full" style={{ width: `${Math.min(100, assignment.progress)}%` }}></div>
                  </div>
                  <p className="text-xs text-brand-text-secondary text-right">{Math.min(100, assignment.progress)}% Avg Completion</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Member List */}
        <div className="lg:col-span-2">
          <Card className="border-brand-border bg-brand-dark/30 h-full">
            <h2 className="text-xl font-bold text-brand-text-primary mb-6 border-b border-brand-border pb-4">
              Group Members
            </h2>

            {isLoading && (
              <p className="text-sm text-brand-text-secondary py-6 text-center">Gathering your group…</p>
            )}

            {!isLoading && loadError && (
              <p className="text-sm text-status-error py-6 text-center">{loadError}</p>
            )}

            {!isLoading && !loadError && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-brand-border text-xs uppercase tracking-wider text-brand-text-secondary">
                    <th className="pb-3 font-bold">Member</th>
                    <th className="pb-3 font-bold">Engagement</th>
                    <th className="pb-3 font-bold">Last Active</th>
                    <th className="pb-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-brand-dark/30 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-secondary flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-brand-text-secondary" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-brand-text-primary flex items-center gap-2">
                              {member.name}
                              {member.role === 'leader' && (
                                <span className="px-2 py-0.5 text-[9px] bg-brand-accent/20 text-brand-accent rounded-full uppercase tracking-wider">Leader</span>
                              )}
                              {member.role === 'pending' && (
                                <span className="px-2 py-0.5 text-[9px] bg-yellow-500/20 text-yellow-500 rounded-full uppercase tracking-wider">Pending</span>
                              )}
                            </p>
                            <p className="text-xs text-brand-text-secondary">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        {member.role !== 'pending' ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-brand-dark rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${member.engagementScore > 70 ? 'bg-status-success' : member.engagementScore > 30 ? 'bg-yellow-500' : 'bg-status-error'}`}
                                style={{ width: `${Math.min(100, member.engagementScore)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-brand-text-secondary">{member.engagementScore}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-brand-text-secondary">-</span>
                        )}
                      </td>
                      <td className="py-4 text-sm text-brand-text-secondary">
                        {member.role === 'pending' ? 'Invited' : formatLastActive(member.lastActiveAt)}
                      </td>
                      <td className="py-4 text-right">
                        {member.role !== 'leader' && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-2 text-brand-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title={member.role === 'pending' ? 'Cancel Invite' : 'Remove Member'}
                          >
                            <CloseIcon className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </Card>
        </div>
      </div>

      {/* Church / Corporate Section */}
      <div className="mt-10">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--sans-ui)', color: 'var(--gold-ds, #B7892E)' }}>Church &amp; Corporate</p>
          <h2 className="text-2xl font-bold text-brand-text-primary" style={{ fontFamily: 'var(--serif-display)' }}>Your Cohort at a Glance</h2>
          <p className="text-brand-text-secondary text-sm mt-1">Everything your church or organization needs to walk together: seats, shared practices, and visible progress.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-brand-border bg-brand-dark/30">
            <div className="w-10 h-10 rounded-full bg-brand-accent/15 flex items-center justify-center mb-4">
              <UserIcon className="w-5 h-5 text-brand-accent" />
            </div>
            <h3 className="font-bold text-brand-text-primary mb-1">Manage Your Group</h3>
            <p className="text-xs text-brand-text-secondary mb-4">
              {members.length} {members.length === 1 ? 'person is' : 'people are'} at your table, with {members.filter((m) => m.status === 'pending').length} invitation{members.filter((m) => m.status === 'pending').length === 1 ? '' : 's'} outstanding. Add or release members above.
            </p>
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-status-success/15 text-status-success border border-status-success/30">Active</span>
          </Card>
          <Card className="border-brand-border bg-brand-dark/30">
            <div className="w-10 h-10 rounded-full bg-brand-accent/15 flex items-center justify-center mb-4">
              <Lightbulb className="w-5 h-5 text-brand-accent" />
            </div>
            <h3 className="font-bold text-brand-text-primary mb-1">Assign Content</h3>
            <p className="text-xs text-brand-text-secondary mb-4">
              {assignments.length === 0
                ? 'Set a devotional, course, or challenge for your whole group using the assignment form above.'
                : `${assignments.length} shared ${assignments.length === 1 ? 'practice is' : 'practices are'} currently assigned to your group.`}
            </p>
            <button
              onClick={focusAssignmentForm}
              className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-accent/15 text-brand-accent border border-brand-accent/30 hover:bg-brand-accent/25 transition-colors"
            >
              Assign Now
            </button>
          </Card>
          <Card className="border-brand-border bg-brand-dark/30">
            <div className="w-10 h-10 rounded-full bg-brand-accent/15 flex items-center justify-center mb-4">
              <ChartBarIcon className="w-5 h-5 text-brand-accent" />
            </div>
            <h3 className="font-bold text-brand-text-primary mb-1">Track Cohort Progress</h3>
            <p className="text-xs text-brand-text-secondary mb-4">
              Shared participation across your active members currently sits at {participation}%. Engagement updates as your group practices together.
            </p>
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-status-success/15 text-status-success border border-status-success/30">Live</span>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeaderDashboardPage;
