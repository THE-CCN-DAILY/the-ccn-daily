import React, { useState } from 'react';
import { motion } from 'motion/react';
import Card from '../components/Card';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { PlusIcon, UserIcon, SparklesIcon, GamificationIcon, CloseIcon } from '../components/icons';

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'member' | 'pending';
  joinedAt?: string;
  avatarUrl?: string;
}

const FamilyDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // Placeholder family members — replace with Firestore family plan data
  const [members, setMembers] = useState<FamilyMember[]>([
    {
      id: '1',
      name: user?.displayName || 'You',
      email: user?.email || '',
      role: 'owner',
      joinedAt: '2024-01-01',
      avatarUrl: user?.photoURL || undefined,
    },
    {
      id: '2',
      name: 'Sarah Smith',
      email: 'sarah@example.com',
      role: 'member',
      joinedAt: '2024-01-15',
    },
    {
      id: '3',
      name: 'Pending Invite',
      email: 'john@example.com',
      role: 'pending',
    }
  ]);

  const maxSeats = 5;
  const usedSeats = members.length;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    
    if (usedSeats >= maxSeats) {
      notify('No available seats left in your family plan.', 'error');
      return;
    }

    setIsInviting(true);
    // Simulate API call
    setTimeout(() => {
      setMembers([...members, {
        id: Date.now().toString(),
        name: 'Pending Invite',
        email: inviteEmail,
        role: 'pending'
      }]);
      setInviteEmail('');
      setIsInviting(false);
      notify('Invitation sent successfully!', 'success');
    }, 1000);
  };

  const handleRemoveMember = (id: string) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      setMembers(members.filter(m => m.id !== id));
      notify('Member removed.', 'success');
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--sans-ui)', color: 'var(--gold-ds, #B7892E)' }}>Account</p>
        <h1 className="text-4xl font-black text-brand-text-primary mb-2" style={{ fontFamily: 'var(--serif-display)' }}>
          Family Dashboard
        </h1>
        <p className="text-brand-text-secondary">Invite family members to your shared plan and grow together in faith.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Plan & Invites */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="border-brand-border bg-brand-dark/30">
            <h2 className="text-lg font-bold text-brand-text-primary mb-4 flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-brand-accent" />
              Family Plan
            </h2>
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-brand-text-secondary">Seats Used</span>
                <span className="font-bold text-brand-text-primary">{usedSeats} / {maxSeats}</span>
              </div>
              <div className="w-full bg-brand-dark rounded-full h-2.5">
                <div 
                  className="bg-brand-accent h-2.5 rounded-full transition-all" 
                  style={{ width: `${(usedSeats / maxSeats) * 100}%` }}
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
                className="w-full py-3 bg-brand-accent text-white rounded-lg font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

          <Card className="border-brand-border bg-brand-dark/30">
            <h2 className="text-lg font-bold text-brand-text-primary mb-4 flex items-center gap-2">
              <GamificationIcon className="w-5 h-5 text-brand-accent" />
              Family Activity
            </h2>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-brand-dark border border-brand-border">
                <p className="text-sm text-brand-text-primary font-bold">30 Days of Prayer</p>
                <p className="text-xs text-brand-text-secondary mt-1">Sarah completed Day 4</p>
              </div>
              <div className="p-3 rounded-lg bg-brand-dark border border-brand-border">
                <p className="text-sm text-brand-text-primary font-bold">Foundations Course</p>
                <p className="text-xs text-brand-text-secondary mt-1">You and 1 other are enrolled</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Member List */}
        <div className="lg:col-span-2">
          <Card className="border-brand-border bg-brand-dark/30 h-full">
            <h2 className="text-xl font-bold text-brand-text-primary mb-6 border-b border-brand-border pb-4">
              Family Members
            </h2>
            
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 rounded-xl border border-brand-border bg-brand-dark/50 hover:border-brand-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-secondary flex items-center justify-center overflow-hidden">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                      <p className="text-xs text-brand-text-secondary">{member.email}</p>
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
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FamilyDashboardPage;
