import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Card from '../components/Card';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { HeartHandshake } from 'lucide-react';
import { PlusIcon, UserIcon, GamificationIcon, CloseIcon } from '../components/icons';
import {
  HouseholdMember,
  inviteHouseholdMember,
  listHouseholdMembers,
  removeHouseholdMember,
} from '../services/householdService';

const formatJoined = (value?: string) => {
  if (!value) return '';
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return '';
  return new Date(parsed).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const FamilyDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [maxSeats, setMaxSeats] = useState(5);

  const refreshMembers = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const overview = await listHouseholdMembers(user.uid);
      setMembers(overview.members);
      setMaxSeats(overview.maxSeats);
      setLoadError('');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Your household could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    setIsLoading(true);
    refreshMembers();
  }, [refreshMembers]);

  const usedSeats = members.length;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !user?.uid) return;

    if (usedSeats >= maxSeats) {
      notify('No available seats left in your family plan.', 'error');
      return;
    }

    setIsInviting(true);
    try {
      await inviteHouseholdMember(user.uid, inviteEmail.trim());
      setInviteEmail('');
      notify('Invitation recorded. Your household seat is reserved.', 'success');
      await refreshMembers();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'The invitation could not be sent.', 'error');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (!user?.uid) return;
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await removeHouseholdMember(user.uid, id);
        notify('Member removed.', 'success');
        await refreshMembers();
      } catch (error) {
        notify(error instanceof Error ? error.message : 'The member could not be removed.', 'error');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <motion.div
        className="mb-8 rounded-lg border border-brand-border p-7 md:p-9"
        style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-paper) 68%, color-mix(in srgb, var(--gold-ds) 8%, var(--bg-card)) 100%)',
          boxShadow: 'var(--sh-card)',
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--sans-ui)', color: 'var(--gold-ds, #B7892E)' }}>Household formation</p>
        <h1 className="text-4xl font-semibold text-brand-text-primary mb-2" style={{ fontFamily: 'var(--serif-display)' }}>
          Family Table
        </h1>
        <p className="text-brand-text-secondary max-w-2xl">Invite your household into one shared rhythm of Scripture, prayer, courses, and encouragement.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Plan & Invites */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="border-brand-border bg-brand-dark/20">
            <h2 className="text-lg font-bold text-brand-text-primary mb-4 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-brand-accent" />
              Household Seats
            </h2>
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                  <span className="text-brand-text-secondary">Seats in use</span>
                <span className="font-bold text-brand-text-primary">{usedSeats} / {maxSeats}</span>
              </div>
              <div className="w-full bg-brand-dark rounded-full h-2.5">
                <div
                  className="bg-brand-accent h-2.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (usedSeats / maxSeats) * 100)}%` }}
                ></div>
              </div>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-brand-text-primary mb-2">Invite Member</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent"
                  disabled={usedSeats >= maxSeats}
                />
              </div>
              <button
                type="submit"
                disabled={isInviting || usedSeats >= maxSeats}
                className="w-full py-3 bg-brand-accent text-white rounded-md font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isInviting ? 'Sending...' : (
                  <>
                    <PlusIcon className="w-5 h-5" />
                    Send Invite
                  </>
                )}
              </button>
            </form>
          </Card>

          <Card className="border-brand-border bg-brand-dark/20">
            <h2 className="text-lg font-bold text-brand-text-primary mb-4 flex items-center gap-2">
              <GamificationIcon className="w-5 h-5 text-brand-accent" />
              Household Activity
            </h2>
            <div className="space-y-4">
              {members.filter((member) => member.status === 'active').length > 1 ? (
                <div className="p-3 rounded-lg bg-brand-dark border border-brand-border">
                  <p className="text-sm text-brand-text-primary font-bold">Walking together</p>
                  <p className="text-xs text-brand-text-secondary mt-1">
                    {members.filter((member) => member.status === 'active').length} of your household are sharing the daily rhythm.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-brand-dark border border-brand-border">
                  <p className="text-sm text-brand-text-primary font-bold">A table set for more</p>
                  <p className="text-xs text-brand-text-secondary mt-1">
                    Invite your household so courses, challenges, and prayer can be shared.
                  </p>
                </div>
              )}
              {members.some((member) => member.status === 'pending') && (
                <div className="p-3 rounded-lg bg-brand-dark border border-brand-border">
                  <p className="text-sm text-brand-text-primary font-bold">Invitations waiting</p>
                  <p className="text-xs text-brand-text-secondary mt-1">
                    {members.filter((member) => member.status === 'pending').length} seat
                    {members.filter((member) => member.status === 'pending').length === 1 ? ' is' : 's are'} reserved for invited members.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Member List */}
        <div className="lg:col-span-2">
          <Card className="border-brand-border bg-brand-dark/20 h-full">
            <h2 className="text-xl font-bold text-brand-text-primary mb-6 border-b border-brand-border pb-4">
              People at the Table
            </h2>

            {isLoading && (
              <p className="text-sm text-brand-text-secondary py-6 text-center">Setting the table…</p>
            )}

            {!isLoading && loadError && (
              <p className="text-sm text-status-error py-6 text-center">{loadError}</p>
            )}

            {!isLoading && !loadError && (
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 rounded-xl border border-brand-border bg-brand-dark/50 hover:border-brand-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-secondary flex items-center justify-center overflow-hidden">
                      {member.role === 'owner' && user?.photoURL ? (
                        <img src={user.photoURL} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <UserIcon className="w-6 h-6 text-brand-text-secondary" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-brand-text-primary font-bold flex items-center gap-2">
                        {member.name}
                        {member.role === 'owner' && (
                          <span className="px-2 py-0.5 text-[12px] bg-brand-accent/20 text-brand-accent rounded-full uppercase tracking-wider">Owner</span>
                        )}
                        {member.role === 'pending' && (
                          <span className="px-2 py-0.5 text-[12px] bg-yellow-500/20 text-yellow-500 rounded-full uppercase tracking-wider">Pending</span>
                        )}
                      </h4>
                      <p className="text-xs text-brand-text-secondary">
                        {member.email}
                        {member.joinedAt && member.status === 'active' ? ` · joined ${formatJoined(member.joinedAt)}` : ''}
                      </p>
                    </div>
                  </div>

                  {member.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 text-brand-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title={member.role === 'pending' ? 'Cancel Invite' : 'Remove Member'}
                    >
                      <CloseIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FamilyDashboardPage;
