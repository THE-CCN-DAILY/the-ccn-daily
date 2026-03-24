
import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import ChallengeCreator from '../components/admin/ChallengeCreator';
import { UserIcon, PlusCircleIcon, ChatBubbleLeftRightIcon, PencilIcon, SpeakerWaveIcon, ReaderIcon, EllipsisHorizontalIcon, CommunityIcon, DbIcon, TrophyIcon, SpinnerIcon, CalendarIcon } from '../components/icons';
import { useNotifications } from '../contexts/NotificationContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { useAuth } from '../contexts/AuthContext';

interface AppUser {
  id: string;
  displayName: string;
  email: string;
  role: string;
  createdAt: any;
}

const StatCard: React.FC<{ title: string; value: string | number; change: string; icon: React.FC<any> }> = ({ title, value, change, icon: Icon }) => (
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
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'users' | 'challenges' | 'broadcasts' | 'events' | 'payments' | 'tenancy'>('users');
    const { addNotification } = useNotifications();
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [broadcastTarget, setBroadcastTarget] = useState('All Active Members');
    const [sendInApp, setSendInApp] = useState(true);
    const [sendEmail, setSendEmail] = useState(true);
    const [isSending, setIsSending] = useState(false);

    // Event creation state
    const [eventTitle, setEventTitle] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventDesc, setEventDesc] = useState('');
    const [eventType, setEventType] = useState<'online' | 'physical'>('online');
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);

    // Real users state
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            setUsers([]);
            setLoadingUsers(false);
            return;
        }
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedUsers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()?.toLocaleDateString() || 'N/A'
            })) as AppUser[];
            setUsers(fetchedUsers);
            setLoadingUsers(false);
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, 'users');
        });

        return () => unsubscribe();
    }, [user]);

    const handleSendBroadcast = async () => {
        if (!broadcastMsg.trim()) return;
        setIsSending(true);
        try {
            await addNotification({
                title: broadcastTitle || 'Community Update',
                message: broadcastMsg,
                date: new Date().toISOString(),
                type: sendInApp && sendEmail ? 'both' : sendInApp ? 'in-app' : 'email',
                // @ts-ignore - adding target for future use
                target: broadcastTarget
            });
            setIsSending(false);
            setBroadcastMsg('');
            setBroadcastTitle('');
            alert('Broadcast sent successfully! Users will see it in their Inbox.');
        } catch (error) {
            setIsSending(false);
        }
    };

    const handleCreateEvent = async () => {
        if (!eventTitle || !eventDate) return;
        setIsCreatingEvent(true);
        try {
            await addDoc(collection(db, 'events'), {
                title: eventTitle,
                date: new Date(eventDate),
                description: eventDesc,
                type: eventType,
                attendeeCount: 0,
                createdAt: serverTimestamp()
            });
            setIsCreatingEvent(false);
            setEventTitle('');
            setEventDate('');
            setEventDesc('');
            alert('Event created successfully!');
        } catch (error) {
            setIsCreatingEvent(false);
            handleFirestoreError(error, OperationType.CREATE, 'events');
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Nexus Admin Hub</h1>
            <p className="text-lg text-brand-text-secondary mb-8">
                Global Command Center for Project Phoenix.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard title="Total Members" value={users.length} change="+5.2% from yesterday" icon={UserIcon} />
                <StatCard title="Global Communities" value="14" change="+2 this month" icon={CommunityIcon} />
                <StatCard title="Storage Utilization" value="84%" change="Phase 7 Expansion Needed" icon={DbIcon} />
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
                {(['users', 'challenges', 'broadcasts', 'events', 'payments', 'tenancy'] as const).map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-full text-sm font-bold border transition-all ${activeTab === tab ? 'bg-brand-accent text-white' : 'bg-brand-secondary text-brand-text-secondary border-brand-border'}`}
                    >
                        {tab === 'challenges' ? 'AI Course Studio' : tab === 'tenancy' ? 'Multi-Tenant (P7)' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {activeTab === 'users' ? (
                        <Card>
                            <h2 className="text-xl font-bold text-brand-text-primary mb-4">User Management</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-brand-text-secondary uppercase bg-brand-secondary/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Name</th>
                                            <th scope="col" className="px-6 py-3">Role</th>
                                            <th scope="col" className="px-6 py-3">Joined</th>
                                            <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingUsers ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-brand-text-secondary">Loading members...</td>
                                            </tr>
                                        ) : users.map(user => (
                                            <tr key={user.id} className="border-b border-brand-border hover:bg-brand-secondary/30">
                                                <th scope="row" className="px-6 py-4 font-medium text-brand-text-primary whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent font-bold mr-3">
                                                            {user.displayName?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold">{user.displayName || 'Anonymous'}</p>
                                                            <p className="text-xs text-brand-text-secondary">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </th>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${user.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-brand-text-secondary">{user.createdAt}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="p-1 text-brand-text-secondary hover:text-brand-text-primary"><EllipsisHorizontalIcon className="w-5 h-5"/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    ) : activeTab === 'challenges' ? (
                        <ChallengeCreator />
                    ) : activeTab === 'broadcasts' ? (
                        <Card className="animate-fade-in">
                            <h2 className="text-xl font-bold text-brand-text-primary mb-4">Broadcast Engine</h2>
                            <p className="text-sm text-brand-text-secondary mb-6">Send targeted updates via in-app push notifications and email.</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">Target Audience</label>
                                    <select 
                                        value={broadcastTarget}
                                        onChange={(e) => setBroadcastTarget(e.target.value)}
                                        className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 text-brand-text-primary focus:border-brand-accent outline-none"
                                    >
                                        <option>All Active Members</option>
                                        <option>Specific Challenge Participants</option>
                                        <option>Community Admins Only</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">Message Title</label>
                                    <input 
                                        type="text"
                                        value={broadcastTitle}
                                        onChange={(e) => setBroadcastTitle(e.target.value)}
                                        className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 text-brand-text-primary focus:border-brand-accent outline-none mb-4" 
                                        placeholder="e.g., Important Update"
                                    />
                                    <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">Message Content</label>
                                    <textarea 
                                        value={broadcastMsg}
                                        onChange={(e) => setBroadcastMsg(e.target.value)}
                                        className="w-full bg-brand-dark border border-brand-border rounded-xl p-4 text-brand-text-primary focus:border-brand-accent outline-none min-h-[100px]" 
                                        placeholder="Enter your announcement..."
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-sm text-brand-text-primary">
                                        <input type="checkbox" checked={sendInApp} onChange={(e) => setSendInApp(e.target.checked)} className="rounded border-brand-border text-brand-accent focus:ring-brand-accent" />
                                        In-App Notification
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-brand-text-primary">
                                        <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="rounded border-brand-border text-brand-accent focus:ring-brand-accent" />
                                        Email (via Resend/SendGrid)
                                    </label>
                                </div>
                                <button 
                                    onClick={handleSendBroadcast}
                                    disabled={isSending || !broadcastMsg.trim() || (!sendInApp && !sendEmail)}
                                    className="w-full py-3 bg-brand-accent text-white rounded-xl font-bold hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                                >
                                    {isSending ? <><SpinnerIcon className="w-5 h-5"/> Sending Broadcast...</> : 'Send Broadcast'}
                                </button>
                            </div>
                        </Card>
                    ) : activeTab === 'events' ? (
                        <Card className="animate-fade-in">
                            <h2 className="text-xl font-bold text-brand-text-primary mb-4">Live Events & Streaming</h2>
                            <p className="text-sm text-brand-text-secondary mb-6">Manage online streams (Mux/Agora) and physical event registrations.</p>
                            <div className="space-y-6">
                                <div className="p-6 border border-brand-border rounded-xl bg-brand-secondary/30">
                                    <h3 className="font-bold text-brand-text-primary mb-4">Schedule New Event</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">Event Title</label>
                                            <input 
                                                type="text" 
                                                value={eventTitle}
                                                onChange={(e) => setEventTitle(e.target.value)}
                                                className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 text-brand-text-primary focus:border-brand-accent outline-none" 
                                                placeholder="e.g., Global Prayer Summit"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">Date & Time</label>
                                                <input 
                                                    type="datetime-local" 
                                                    value={eventDate}
                                                    onChange={(e) => setEventDate(e.target.value)}
                                                    className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 text-brand-text-primary focus:border-brand-accent outline-none" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">Type</label>
                                                <select 
                                                    value={eventType}
                                                    onChange={(e) => setEventType(e.target.value as any)}
                                                    className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 text-brand-text-primary focus:border-brand-accent outline-none"
                                                >
                                                    <option value="online">Online Stream</option>
                                                    <option value="physical">Physical Gathering</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">Description</label>
                                            <textarea 
                                                value={eventDesc}
                                                onChange={(e) => setEventDesc(e.target.value)}
                                                className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 text-brand-text-primary focus:border-brand-accent outline-none min-h-[100px]" 
                                                placeholder="What is this event about?"
                                            />
                                        </div>
                                        <button 
                                            onClick={handleCreateEvent}
                                            disabled={isCreatingEvent || !eventTitle || !eventDate}
                                            className="w-full py-3 bg-brand-accent text-white rounded-xl font-bold hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isCreatingEvent ? <><SpinnerIcon className="w-5 h-5"/> Creating...</> : 'Create Event'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ) : activeTab === 'payments' ? (
                        <Card className="animate-fade-in">
                            <h2 className="text-xl font-bold text-brand-text-primary mb-4">Global Payment Gateways</h2>
                            <p className="text-sm text-brand-text-secondary mb-6">Manage monetization, subscriptions, and international/local payments.</p>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border border-brand-border rounded-xl bg-brand-secondary/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[#635BFF]/10 rounded-lg flex items-center justify-center">
                                            <DbIcon className="w-6 h-6 text-[#635BFF]" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-brand-text-primary">Stripe Integration</h3>
                                            <p className="text-xs text-brand-text-secondary">Global Cards, Apple Pay, Google Pay</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold uppercase rounded-full">Connected</span>
                                </div>
                                <div className="flex items-center justify-between p-4 border border-brand-border rounded-xl bg-brand-secondary/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[#FB9129]/10 rounded-lg flex items-center justify-center">
                                            <DbIcon className="w-6 h-6 text-[#FB9129]" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-brand-text-primary">Flutterwave Integration</h3>
                                            <p className="text-xs text-brand-text-secondary">Mobile Money (M-Pesa, MTN) & Local Cards</p>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1 bg-brand-accent text-white rounded text-xs font-bold hover:scale-105 transition-transform">Connect</button>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            <Card className="border-l-4 border-brand-accent">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-bold text-brand-text-primary">Victory Community</h3>
                                        <p className="text-xs text-brand-text-secondary">Infrastructure: Dedicated Firestore Isolation (US-East)</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-brand-accent">1,250</p>
                                        <p className="text-[10px] uppercase font-bold text-brand-text-secondary">Active Members</p>
                                    </div>
                                </div>
                            </Card>
                            <button className="w-full py-4 border-2 border-dashed border-brand-border rounded-xl text-brand-text-secondary font-bold hover:bg-brand-accent/5 transition-colors">
                                + Provision New Community Tenant
                            </button>
                        </div>
                    )}
                </div>

                <Card>
                    <h2 className="text-xl font-bold text-brand-text-primary mb-4">Content Controls</h2>
                    <div className="space-y-3">
                        <button className="w-full text-left flex items-center p-3 rounded-lg bg-brand-secondary hover:bg-brand-border transition-colors">
                            <TrophyIcon className="w-6 h-6 mr-3 text-brand-accent"/>
                            <div>
                                <p className="font-semibold text-brand-text-primary">Challenge Templates</p>
                                <p className="text-xs text-brand-text-secondary">Manage Community Sprints</p>
                            </div>
                        </button>
                        <button className="w-full text-left flex items-center p-3 rounded-lg bg-brand-secondary hover:bg-brand-border transition-colors">
                            <ReaderIcon className="w-6 h-6 mr-3 text-brand-accent"/>
                            <div>
                                <p className="font-semibold text-brand-text-primary">Books & Courses</p>
                                <p className="text-xs text-brand-text-secondary">Global Library Distribution</p>
                            </div>
                        </button>
                        <button className="w-full text-left flex items-center p-3 rounded-lg bg-brand-secondary hover:bg-brand-border transition-colors">
                            <SpeakerWaveIcon className="w-6 h-6 mr-3 text-brand-accent"/>
                             <div>
                                <p className="font-semibold text-brand-text-primary">Voice Training</p>
                                <p className="text-xs text-brand-text-secondary">Kai Customization Logic</p>
                            </div>
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
