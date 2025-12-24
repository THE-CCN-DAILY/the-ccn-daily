import React from 'react';
import Card from '../components/Card';
import { UserIcon, PlusCircleIcon, ChatBubbleLeftRightIcon, PencilIcon, SpeakerWaveIcon, ReaderIcon, EllipsisHorizontalIcon } from '../components/icons';

const mockUsers = [
  { id: 'u1', name: 'John D.', email: 'john.d@example.com', role: 'User', joined: '2024-02-15' },
  { id: 'u2', name: 'Sarah K.', email: 'sarah.k@example.com', role: 'User', joined: '2024-02-18' },
  { id: 'u3', name: 'Emily R.', email: 'emily.r@example.com', role: 'Content Creator', joined: '2024-01-20' },
  { id: 'u4', name: 'Anonymous', email: 'anon@example.com', role: 'User', joined: '2024-03-01' },
];

const StatCard: React.FC<{ title: string; value: string; change: string; icon: React.FC<any> }> = ({ title, value, change, icon: Icon }) => (
    <Card className="flex items-center p-4">
        <div className="p-3 bg-brand-accent/20 rounded-lg mr-4">
            <Icon className="w-6 h-6 text-brand-accent" />
        </div>
        <div>
            <p className="text-sm text-brand-text-secondary">{title}</p>
            <p className="text-2xl font-bold text-brand-text-primary">{value}</p>
            <p className="text-xs text-status-success">{change}</p>
        </div>
    </Card>
);

const AdminDashboard: React.FC = () => {
    return (
        <div>
            <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Admin Dashboard</h1>
            <p className="text-lg text-brand-text-secondary mb-8">
                Manage users, content, and monitor the health of your application.
            </p>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard title="Daily Active Users" value="1,284" change="+5.2% from yesterday" icon={UserIcon} />
                <StatCard title="New Signups (24h)" value="72" change="+10% from yesterday" icon={PlusCircleIcon} />
                <StatCard title="Content Engagement" value="8,421" change="Likes, Comments, Prayers" icon={ChatBubbleLeftRightIcon} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Management */}
                <Card className="lg:col-span-2">
                    <h2 className="text-xl font-bold text-brand-text-primary mb-4">User Management</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-brand-text-secondary uppercase bg-brand-secondary/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Name</th>
                                    <th scope="col" className="px-6 py-3">Email</th>
                                    <th scope="col" className="px-6 py-3">Role</th>
                                    <th scope="col" className="px-6 py-3">Joined</th>
                                    <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockUsers.map(user => (
                                    <tr key={user.id} className="border-b border-brand-border hover:bg-brand-secondary/30">
                                        <th scope="row" className="px-6 py-4 font-medium text-brand-text-primary whitespace-nowrap">{user.name}</th>
                                        <td className="px-6 py-4 text-brand-text-secondary">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'Admin' ? 'bg-red-500/20 text-red-400' : user.role === 'Content Creator' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-brand-text-secondary">{user.joined}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-1 text-brand-text-secondary hover:text-brand-text-primary"><EllipsisHorizontalIcon className="w-5 h-5"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Content Management */}
                <Card>
                    <h2 className="text-xl font-bold text-brand-text-primary mb-4">Content Management</h2>
                    <div className="space-y-3">
                        <button className="w-full text-left flex items-center p-3 rounded-lg bg-brand-secondary hover:bg-brand-border transition-colors">
                            <ReaderIcon className="w-6 h-6 mr-3 text-brand-accent"/>
                            <div>
                                <p className="font-semibold text-brand-text-primary">Books & Courses</p>
                                <p className="text-xs text-brand-text-secondary">Manage ePubs and learning materials</p>
                            </div>
                        </button>
                        <button className="w-full text-left flex items-center p-3 rounded-lg bg-brand-secondary hover:bg-brand-border transition-colors">
                            <SpeakerWaveIcon className="w-6 h-6 mr-3 text-brand-accent"/>
                             <div>
                                <p className="font-semibold text-brand-text-primary">Podcasts</p>
                                <p className="text-xs text-brand-text-secondary">Upload new episodes and transcripts</p>
                            </div>
                        </button>
                        <button className="w-full text-left flex items-center p-3 rounded-lg bg-brand-secondary hover:bg-brand-border transition-colors">
                            <PencilIcon className="w-6 h-6 mr-3 text-brand-accent"/>
                             <div>
                                <p className="font-semibold text-brand-text-primary">Devotional Content</p>
                                <p className="text-xs text-brand-text-secondary">Review and schedule daily devotionals</p>
                            </div>
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;