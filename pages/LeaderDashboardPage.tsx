import React, { useState } from 'react';
import { motion } from 'motion/react';
import Card from '../components/Card';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { PlusIcon, UserIcon, SparklesIcon, ChartBarIcon, ReaderIcon, CloseIcon } from '../components/icons';

interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: 'leader' | 'member' | 'pending';
  engagementScore: number;
  lastActive: string;
}

const LeaderDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // Placeholder group members — replace with Firestore group data
  const [members, setMembers] = useState<GroupMember[]>([
    {
      id: '1',
      name: user?.displayName || 'You',
      email: user?.email || '',
      role: 'leader',
      engagementScore: 100,
      lastActive: 'Today',
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael@example.com',
      role: 'member',
      engagementScore: 85,
      lastActive: 'Yesterday',
    },
    {
      id: '3',
      name: 'Emma Davis',
      email: 'emma@example.com',
      role: 'member',
      engagementScore: 40,
      lastActive: '3 days ago',
    },
    {
      id: '4',
      name: 'Pending Invite',
      email: 'david@example.com',
      role: 'pending',
      engagementScore: 0,
      lastActive: 'Never',
    }
  ]);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsInviting(true);
    // Simulate API call
    setTimeout(() => {
      setMembers([...members, {
        id: Date.now().toString(),
        name: 'Pending Invite',
        email: inviteEmail,
        role: 'pending',
        engagementScore: 0,
        lastActive: 'Never'
      }]);
      setInviteEmail('');
      setIsInviting(false);
      notify('Invitation sent successfully!', 'success');
    }, 1000);
  };

  const handleRemoveMember = (id: string) => {
    if (window.confirm('Are you sure you want to remove this member from the group?')) {
      setMembers(members.filter(m => m.id !== id));
      notify('Member removed.', 'success');
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <motion.div
        className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--sans-ui)', color: 'var(--gold-ds, #B7892E)' }}>Account</p>
          <h1 className="text-4xl font-black text-brand-text-primary mb-2" style={{ fontFamily: 'var(--serif-display)' }}>
            Leader Dashboard
          </h1>
          <p className="text-brand-text-secondary">Manage your group, assign content, and track member engagement.</p>
        </div>
        <button className="flex-shrink-0 px-6 py-2.5 bg-brand-accent text-white font-bold rounded-full hover:bg-opacity-90 transition-colors self-start sm:self-auto">
          Assign Content
        </button>
      </motion.div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-brand-border bg-brand-dark/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-accent/20 flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-brand-accent" />
            </div>
            <div>
              <p className="text-sm text-brand-text-secondary">Total Members</p>
              <h3 className="text-2xl font-bold text-brand-text-primary">{members.length}</h3>
            </div>
          </div>
        </Card>
        
        <Card className="border-brand-border bg-brand-dark/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-status-success/20 flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-status-success" />
            </div>
            <div>
              <p className="text-sm text-brand-text-secondary">Avg. Engagement</p>
              <h3 className="text-2xl font-bold text-brand-text-primary">75%</h3>
            </div>
          </div>
        </Card>

        <Card className="border-brand-border bg-brand-dark/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-secondary flex items-center justify-center">
              <ReaderIcon className="w-6 h-6 text-brand-text-primary" />
            </div>
            <div>
              <p className="text-sm text-brand-text-secondary">Active Assignments</p>
              <h3 className="text-2xl font-bold text-brand-text-primary">2</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Invites & Active Content */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="border-brand-border bg-brand-dark/30">
            <h2 className="text-lg font-bold text-brand-text-primary mb-4 flex items-center gap-2">
              <PlusIcon className="w-5 h-5 text-brand-accent" />
              Invite to Group
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

          <Card className="border-brand-border bg-brand-dark/30">
            <h2 className="text-lg font-bold text-brand-text-primary mb-4 flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-brand-accent" />
              Current Assignments
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-brand-dark border border-brand-border">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm text-brand-text-primary font-bold">Foundations of Faith</h4>
                  <span className="text-[12px] bg-brand-accent/20 text-brand-accent px-2 py-0.5 rounded-full">Course</span>
                </div>
                <div className="w-full bg-brand-secondary rounded-full h-1.5 mb-1">
                  <div className="bg-brand-accent h-1.5 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <p className="text-xs text-brand-text-secondary text-right">60% Avg Completion</p>
              </div>
              
              <div className="p-4 rounded-lg bg-brand-dark border border-brand-border">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm text-brand-text-primary font-bold">30 Days of Prayer</h4>
                  <span className="text-[12px] bg-brand-accent/20 text-brand-accent px-2 py-0.5 rounded-full">Challenge</span>
                </div>
                <div className="w-full bg-brand-secondary rounded-full h-1.5 mb-1">
                  <div className="bg-brand-accent h-1.5 rounded-full" style={{ width: '25%' }}></div>
                </div>
                <p className="text-xs text-brand-text-secondary text-right">25% Avg Completion</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Member List */}
        <div className="lg:col-span-2">
          <Card className="border-brand-border bg-brand-dark/30 h-full">
            <h2 className="text-xl font-bold text-brand-text-primary mb-6 border-b border-brand-border pb-4">
              Group Members
            </h2>
            
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
                                style={{ width: `${member.engagementScore}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-brand-text-secondary">{member.engagementScore}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-brand-text-secondary">-</span>
                        )}
                      </td>
                      <td className="py-4 text-sm text-brand-text-secondary">
                        {member.lastActive}
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
          </Card>
        </div>
      </div>

      {/* Church / Corporate Section */}
      <div className="mt-10">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--sans-ui)', color: 'var(--gold-ds, #B7892E)' }}>Church &amp; Corporate</p>
          <h2 className="text-2xl font-bold text-brand-text-primary" style={{ fontFamily: 'var(--serif-display)' }}>Bulk Access &amp; Cohort Management</h2>
          <p className="text-brand-text-secondary text-sm mt-1">Manage multi-seat church or corporate licenses, assign content to cohorts, and track group progress.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-brand-border bg-brand-dark/30">
            <div className="w-10 h-10 rounded-full bg-brand-accent/15 flex items-center justify-center mb-4">
              <UserIcon className="w-5 h-5 text-brand-accent" />
            </div>
            <h3 className="font-bold text-brand-text-primary mb-1">Manage Groups</h3>
            <p className="text-xs text-brand-text-secondary mb-4">Create sub-groups within your church or organization and assign leaders to each cohort.</p>
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-secondary text-brand-text-secondary border border-brand-border">Coming Soon</span>
          </Card>
          <Card className="border-brand-border bg-brand-dark/30">
            <div className="w-10 h-10 rounded-full bg-brand-accent/15 flex items-center justify-center mb-4">
              <SparklesIcon className="w-5 h-5 text-brand-accent" />
            </div>
            <h3 className="font-bold text-brand-text-primary mb-1">Assign Content</h3>
            <p className="text-xs text-brand-text-secondary mb-4">Push devotionals, courses, and challenges to your entire organization or specific cohorts.</p>
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-secondary text-brand-text-secondary border border-brand-border">Coming Soon</span>
          </Card>
          <Card className="border-brand-border bg-brand-dark/30">
            <div className="w-10 h-10 rounded-full bg-brand-accent/15 flex items-center justify-center mb-4">
              <ChartBarIcon className="w-5 h-5 text-brand-accent" />
            </div>
            <h3 className="font-bold text-brand-text-primary mb-1">Track Cohort Progress</h3>
            <p className="text-xs text-brand-text-secondary mb-4">View completion rates, engagement scores, and spiritual growth metrics across your full organization.</p>
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-secondary text-brand-text-secondary border border-brand-border">Coming Soon</span>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeaderDashboardPage;
