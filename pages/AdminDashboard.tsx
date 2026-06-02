
import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import ChallengeCreator from '../components/admin/ChallengeCreator';
import { UserIcon, PlusCircleIcon, ChatBubbleLeftRightIcon, PencilIcon, SpeakerWaveIcon, ReaderIcon, EllipsisHorizontalIcon, CommunityIcon, DbIcon, TrophyIcon, SpinnerIcon, CalendarIcon } from '../components/icons';
import { useNotifications } from '../contexts/NotificationContext';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { adminAuthHeaders } from '../services/adminAuth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { useAuth } from '../contexts/AuthContext';
import { AdminUserStats, listAdminUsers } from '../services/adminService';
import { createAdminEvent } from '../services/eventService';
import { createMuxLiveStream } from '../services/liveStreamService';
import LandscapeTab from '../components/admin/LandscapeTab';

interface AppUser {
  id: string;
  displayName: string;
  email: string;
  role: string;
  createdAt: any;
}

const StatCard: React.FC<{ title: string; value: string | number; change: string; icon: React.FC<any> }> = ({ title, value, change, icon: Icon }) => (
    <Card className="flex items-center gap-5 p-5" style={{ boxShadow: 'var(--sh-card)' }}>
        <div className="p-3.5 bg-brand-accent/10 border border-brand-accent/20 rounded-xl shrink-0">
            <Icon className="w-6 h-6 text-brand-accent" />
        </div>
        <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-brand-text-secondary">{title}</p>
            <p
                className="text-3xl font-semibold text-brand-text-primary leading-tight"
                style={{ fontFamily: 'var(--serif-display)' }}
            >
                {value}
            </p>
            <p className="text-xs text-status-success mt-0.5">{change}</p>
        </div>
    </Card>
);

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'users' | 'challenges' | 'broadcasts' | 'events' | 'payments' | 'discounts' | 'tenancy' | 'resources' | 'inbox' | 'budget' | 'landscape'>('users');
    const { addNotification, notify } = useNotifications();
    const [usageStats, setUsageStats] = useState<any>(null);
    const [loadingBudget, setLoadingBudget] = useState(false);
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
    const [userStats, setUserStats] = useState<AdminUserStats>({ total: 0, admins: 0, active30d: 0 });

    // Inbox state
    const [inboxMessages, setInboxMessages] = useState<any[]>([]);
    const [loadingInbox, setLoadingInbox] = useState(true);

    // Resource Management State
    const [resources, setResources] = useState<any[]>([]);
    const [loadingResources, setLoadingResources] = useState(true);
    const [resourceTitle, setResourceTitle] = useState('');
    const [resourceType, setResourceType] = useState<'book' | 'course' | 'audiobook' | 'challenge'>('book');
    const [resourceAccessLane, setResourceAccessLane] = useState<'included' | 'owned' | 'hybrid'>('included');
    const [resourcePrice, setResourcePrice] = useState('');
    const [resourceTier, setResourceTier] = useState<'free' | 'pro' | 'max'>('free');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('');

    // Mux State
    const [muxStreamKey, setMuxStreamKey] = useState('');
    const [muxPlaybackId, setMuxPlaybackId] = useState('');
    const [isCreatingMuxStream, setIsCreatingMuxStream] = useState(false);

    // Payment Settings State
    const [flutterwaveKey, setFlutterwaveKey] = useState('');
    const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

    // Discounts State
    const [discounts, setDiscounts] = useState<any[]>([]);
    const [loadingDiscounts, setLoadingDiscounts] = useState(true);
    const [discountName, setDiscountName] = useState('');
    const [discountPercentage, setDiscountPercentage] = useState('');
    const [discountStartDate, setDiscountStartDate] = useState('');
    const [discountEndDate, setDiscountEndDate] = useState('');
    const [discountType, setDiscountType] = useState<'seasonal' | 'yearly' | 'custom'>('seasonal');
    const [targetTier, setTargetTier] = useState<'pro' | 'max' | 'all'>('all');
    const [targetBilling, setTargetBilling] = useState<'monthly' | 'yearly' | 'both'>('both');
    const [isCreatingDiscount, setIsCreatingDiscount] = useState(false);

    const handleCreateMuxStream = async () => {
        setIsCreatingMuxStream(true);
        try {
            const data = await createMuxLiveStream();
            setMuxStreamKey(data.streamKey);
            setMuxPlaybackId(data.playbackId);

            notify('Mux Live Stream created successfully! Save your Stream Key securely.', 'success');
        } catch (error: any) {
            notify(`Failed to create Mux stream: ${error.message}`, 'error');
        } finally {
            setIsCreatingMuxStream(false);
        }
    };

    const handleMuxUpload = async () => {
        if (!uploadFile) return;
        setIsUploading(true);
        setUploadMessage('Requesting Mux upload URL...');
        
        try {
            // 1. Get direct upload URL from our backend
            const response = await fetch('/api/mux/upload', {
                method: 'POST',
                headers: await adminAuthHeaders(),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get Mux upload URL');
            }
            const { uploadUrl, uploadId } = await response.json();

            setUploadMessage('Uploading to Mux...');
            
            // 2. Upload file directly to Mux
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: uploadFile,
                headers: {
                    'Content-Type': uploadFile.type,
                }
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload file to Mux');
            }

            // 3. Save metadata to Firestore
            await addDoc(collection(db, 'resources'), {
                title: resourceTitle || uploadFile.name,
                muxUploadId: uploadId,
                type: resourceType,
                size: uploadFile.size,
                accessLane: resourceAccessLane,
                priceUsd: resourceAccessLane !== 'included' ? Number(resourcePrice) : 0,
                tierRequired: resourceAccessLane !== 'owned' ? resourceTier : null,
                isPremium: resourceAccessLane !== 'included' || resourceTier !== 'free',
                uploadedBy: user?.uid,
                createdAt: serverTimestamp(),
                provider: 'mux'
            });

            setUploadMessage('Video uploaded to Mux successfully! It will be ready to play shortly.');
            setUploadFile(null);
            setResourceTitle('');
        } catch (error: any) {
            setUploadMessage(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileUpload = async () => {
        if (!uploadFile) return;
        setIsUploading(true);
        setUploadMessage('');
        
        try {
            const storageRef = ref(storage, `resources/${Date.now()}_${uploadFile.name}`);
            const uploadTask = uploadBytesResumable(storageRef, uploadFile);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                }, 
                (error) => {
                    setUploadMessage('Upload failed. Please try again.');
                    setIsUploading(false);
                }, 
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        
                        // Save file metadata to Firestore
                        await addDoc(collection(db, 'resources'), {
                            title: resourceTitle || uploadFile.name,
                            url: downloadURL,
                            type: resourceType,
                            size: uploadFile.size,
                            accessLane: resourceAccessLane,
                            priceUsd: resourceAccessLane !== 'included' ? Number(resourcePrice) : 0,
                            tierRequired: resourceAccessLane !== 'owned' ? resourceTier : null,
                            isPremium: resourceAccessLane !== 'included' || resourceTier !== 'free',
                            uploadedBy: user?.uid,
                            createdAt: serverTimestamp()
                        });

                        setUploadMessage('File uploaded successfully!');
                        setIsUploading(false);
                        setUploadFile(null);
                        setResourceTitle('');
                        setUploadProgress(0);
                    } catch (error) {
                        handleFirestoreError(error, OperationType.CREATE, 'resources');
                        setUploadMessage('Failed to save file metadata.');
                        setIsUploading(false);
                    }
                }
            );
        } catch {
            setUploadMessage('An error occurred during upload.');
            setIsUploading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'budget') {
            fetchBudgetStats();
        }
    }, [activeTab]);

    const fetchBudgetStats = async () => {
        setLoadingBudget(true);
        try {
            const { getUsageStats } = await import('../services/budgetService');
            const stats = await getUsageStats();
            setUsageStats(stats);
        } catch {
            // Budget stats unavailable — silently skipped
        } finally {
            setLoadingBudget(false);
        }
    };

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            setUsers([]);
            setUserStats({ total: 0, admins: 0, active30d: 0 });
            setLoadingUsers(false);
            return;
        }

        let cancelled = false;
        setLoadingUsers(true);

        listAdminUsers()
            .then(({ users, stats }) => {
                if (cancelled) return;
                setUsers(users as AppUser[]);
                setUserStats(stats);
            })
            .catch((error) => {
                if (cancelled) return;
                notify(error instanceof Error ? error.message : 'Failed to load users.', 'error');
                setUsers([]);
                setUserStats({ total: 0, admins: 0, active30d: 0 });
            })
            .finally(() => {
                if (!cancelled) setLoadingUsers(false);
            });

        return () => {
            cancelled = true;
        };
    }, [user, notify]);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            setInboxMessages([]);
            setLoadingInbox(false);
            setDiscounts([]);
            setLoadingDiscounts(false);
            setResources([]);
            setLoadingResources(false);
            return;
        }

        const unsubscribers: Array<() => void> = [];

        if (activeTab === 'inbox') {
            setLoadingInbox(true);
            const inboxQ = query(collection(db, 'inbox'), orderBy('receivedAt', 'desc'));
            unsubscribers.push(onSnapshot(inboxQ, (snapshot) => {
                const messages = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    receivedAt: doc.data().receivedAt?.toDate()?.toLocaleString() || 'N/A'
                }));
                setInboxMessages(messages);
                setLoadingInbox(false);
            }, (error) => {
                handleFirestoreError(error, OperationType.LIST, 'inbox');
                setLoadingInbox(false);
            }));
        }

        if (activeTab === 'discounts' || activeTab === 'payments') {
            setLoadingDiscounts(true);
            const discountsQ = query(collection(db, 'settings'), orderBy('createdAt', 'desc'));
            unsubscribers.push(onSnapshot(discountsQ, (snapshot) => {
                const fetchedDiscounts = snapshot.docs
                    .filter(doc => doc.data().category === 'discount' || doc.data().percentage !== undefined)
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        startDate: doc.data().startDate?.toDate()?.toLocaleDateString() || 'N/A',
                        endDate: doc.data().endDate?.toDate()?.toLocaleDateString() || 'N/A'
                    }));
                setDiscounts(fetchedDiscounts);
                setLoadingDiscounts(false);

                const paymentDoc = snapshot.docs.find(doc => doc.id === 'payment_settings');
                if (paymentDoc) {
                    setFlutterwaveKey(paymentDoc.data().flutterwavePublicKey || '');
                }
            }, (error) => {
                handleFirestoreError(error, OperationType.LIST, 'settings');
                setLoadingDiscounts(false);
            }));
        }

        if (activeTab === 'resources') {
            setLoadingResources(true);
            const resourcesQ = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
            unsubscribers.push(onSnapshot(resourcesQ, (snapshot) => {
                const fetchedResources = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate()?.toLocaleDateString() || 'N/A'
                }));
                setResources(fetchedResources);
                setLoadingResources(false);
            }, (error) => {
                handleFirestoreError(error, OperationType.LIST, 'resources');
                setLoadingResources(false);
            }));
        }

        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        };
    }, [activeTab, user]);

    const handleDeleteResource = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this resource?')) return;
        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            await deleteDoc(doc(db, 'resources', id));
            notify('Resource deleted successfully!', 'success');
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, 'resources');
            notify('Failed to delete resource.', 'error');
        }
    };

    const handleSendBroadcast = async () => {
        if (!broadcastMsg.trim()) return;
        setIsSending(true);
        try {
            if (sendInApp) {
                await addNotification({
                    title: broadcastTitle || 'Community Update',
                    message: broadcastMsg,
                    date: new Date().toISOString(),
                    type: sendInApp && sendEmail ? 'both' : sendInApp ? 'in-app' : 'email',
                    // @ts-ignore - adding target for future use
                    target: broadcastTarget
                });
            }

            if (sendEmail) {
                // In a real app, you'd fetch the users' emails based on the target.
                // For this demo, we'll send it to the users we have loaded.
                // Note: Resend free tier requires verifying the domain or sending only to the verified email.
                // We'll pass the emails to the backend.
                const targetEmails = users.map(u => u.email).filter(Boolean);
                
                if (targetEmails.length > 0) {
                    const response = await fetch('/api/send-email', {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            to: targetEmails,
                            subject: broadcastTitle || 'Community Update',
                            html: `
                                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                    <h2 style="color: #F27D26;">${broadcastTitle || 'Community Update'}</h2>
                                    <p style="color: #333; line-height: 1.6; font-size: 16px;">${broadcastMsg.replace(/\n/g, '<br>')}</p>
                                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                                    <p style="color: #999; font-size: 12px; text-align: center;">Sent via THE CCN DAILY Broadcast</p>
                                </div>
                            `
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to send email');
                    }
                }
            }

            setIsSending(false);
            setBroadcastMsg('');
            setBroadcastTitle('');
            notify('Broadcast sent successfully!', 'success');
        } catch (error: any) {
            notify(`Failed to send broadcast: ${error.message}`, 'error');
            setIsSending(false);
        }
    };

    const handleCreateEvent = async () => {
        if (!eventTitle || !eventDate) return;
        setIsCreatingEvent(true);
        try {
            await createAdminEvent({
                title: eventTitle,
                date: new Date(eventDate).toISOString(),
                description: eventDesc,
                type: eventType,
            });
            setIsCreatingEvent(false);
            setEventTitle('');
            setEventDate('');
            setEventDesc('');
            notify('Event created successfully!', 'success');
        } catch (error: any) {
            setIsCreatingEvent(false);
            notify(error.message || 'Failed to create event.', 'error');
        }
    };

    const handleToggleDiscount = async (id: string, currentStatus: boolean) => {
        try {
            const { doc, updateDoc } = await import('firebase/firestore');
            await updateDoc(doc(db, 'settings', id), {
                isActive: !currentStatus,
                updatedAt: serverTimestamp()
            });
            notify(`Discount ${!currentStatus ? 'activated' : 'deactivated'} successfully!`, 'success');
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, 'settings');
            notify('Failed to update discount status.', 'error');
        }
    };

    const handleDeleteDiscount = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this discount campaign?')) return;
        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            await deleteDoc(doc(db, 'settings', id));
            notify('Discount campaign deleted successfully!', 'success');
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, 'settings');
            notify('Failed to delete discount.', 'error');
        }
    };

    const handleUpdatePaymentSettings = async () => {
        setIsUpdatingPayment(true);
        try {
            const { doc, setDoc } = await import('firebase/firestore');
            await setDoc(doc(db, 'settings', 'payment_settings'), {
                flutterwavePublicKey: flutterwaveKey,
                updatedAt: serverTimestamp()
            }, { merge: true });
            notify('Payment settings updated successfully!', 'success');
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, 'settings');
            notify('Failed to update payment settings.', 'error');
        } finally {
            setIsUpdatingPayment(false);
        }
    };

    const handleCreateDiscount = async () => {
        if (!discountName || !discountPercentage || !discountStartDate || !discountEndDate) return;
        setIsCreatingDiscount(true);
        try {
            await addDoc(collection(db, 'settings'), {
                name: discountName,
                percentage: Number(discountPercentage),
                startDate: new Date(discountStartDate),
                endDate: new Date(discountEndDate),
                type: discountType,
                targetTier: targetTier,
                targetBilling: targetBilling,
                isActive: true,
                category: 'discount',
                createdAt: serverTimestamp()
            });
            setIsCreatingDiscount(false);
            setDiscountName('');
            setDiscountPercentage('');
            setDiscountStartDate('');
            setDiscountEndDate('');
            notify('Discount campaign created successfully!', 'success');
        } catch (error) {
            setIsCreatingDiscount(false);
            handleFirestoreError(error, OperationType.CREATE, 'settings');
            notify('Failed to create discount.', 'error');
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <header className="mb-10 pt-2">
                <p className="ds-eyebrow mb-3">Operator Console</p>
                <h1
                    className="font-semibold text-brand-text-primary mb-2"
                    style={{ fontFamily: 'var(--serif-display)', fontSize: 'clamp(2rem, 5vw, 3.25rem)', lineHeight: 1.05 }}
                >
                    Nexus Admin Hub
                </h1>
                <p className="text-base text-brand-text-secondary max-w-xl">
                    Global Command Center for THE CCN DAILY.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard title="Total Members" value={userStats.total} change={`${userStats.active30d} active in 30 days`} icon={UserIcon} />
                <StatCard title="Admin Operators" value={userStats.admins} change="D1 role source" icon={CommunityIcon} />
                <StatCard title="Media Storage" value="R2 pending" change="Binding required for uploads" icon={DbIcon} />
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
                {(['users', 'inbox', 'challenges', 'broadcasts', 'events', 'payments', 'discounts', 'tenancy', 'resources', 'budget', 'landscape'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 rounded-full text-sm font-bold border transition-all ${activeTab === tab ? 'bg-brand-accent text-white border-brand-accent shadow-sm' : 'bg-brand-dark text-brand-text-secondary border-brand-border hover:text-brand-text-primary hover:border-brand-border-strong'}`}
                    >
                        {tab === 'challenges' ? 'AI Course Studio' : tab === 'tenancy' ? 'Multi-Tenant (P7)' : tab === 'budget' ? 'AI Budget' : tab === 'landscape' ? 'Landscape' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {activeTab === 'users' ? (
                        <Card>
                            <h2 className="text-2xl font-semibold text-brand-text-primary mb-4" style={{ fontFamily: 'var(--serif-display)' }}>User Management</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-[11px] font-bold tracking-[0.08em] text-brand-text-secondary uppercase bg-brand-dark border-b border-brand-border">
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
                                            <tr key={user.id} className="border-b border-brand-border last:border-0 hover:bg-brand-dark/60 transition-colors">
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
                                                    <span className={`inline-block px-2.5 py-1 text-[11px] font-bold tracking-[0.06em] uppercase rounded-full border ${user.role === 'admin' ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/30' : 'bg-status-success/10 text-status-success border-status-success/30'}`}>
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
                    ) : activeTab === 'inbox' ? (
                        <Card className="animate-fade-in">
                            <h2 className="text-2xl font-semibold text-brand-text-primary mb-4" style={{ fontFamily: 'var(--serif-display)' }}>Support Inbox</h2>
                            <p className="text-sm text-brand-text-secondary mb-6">Incoming emails received via Resend Webhooks.</p>
                            
                            <div className="space-y-4">
                                {loadingInbox ? (
                                    <div className="p-8 text-center text-brand-text-secondary">
                                        <SpinnerIcon className="w-8 h-8 mx-auto mb-4 animate-spin text-brand-accent" />
                                        <p>Loading messages...</p>
                                    </div>
                                ) : inboxMessages.length === 0 ? (
                                    <div className="p-8 text-center border border-dashed border-brand-border rounded-xl bg-brand-secondary/30">
                                        <p className="text-brand-text-secondary">No messages in your inbox.</p>
                                    </div>
                                ) : (
                                    inboxMessages.map((msg) => (
                                        <div key={msg.id} className="p-4 border border-brand-border rounded-xl bg-brand-secondary/30 hover:bg-brand-secondary/50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold text-brand-text-primary">{msg.subject}</h3>
                                                    <p className="text-xs text-brand-text-secondary">From: {msg.from}</p>
                                                </div>
                                                <span className="text-xs text-brand-text-secondary">{msg.receivedAt}</span>
                                            </div>
                                            <div className="mt-4 p-3 bg-brand-dark rounded-lg text-sm text-brand-text-primary whitespace-pre-wrap">
                                                {msg.text || 'No text content available.'}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    ) : activeTab === 'budget' ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="p-6">
                                    <h3 className="text-xl font-semibold text-brand-text-primary mb-4" style={{ fontFamily: 'var(--serif-display)' }}>AI Cost Overview (Last 30 Days)</h3>
                                    {loadingBudget ? (
                                        <SpinnerIcon className="w-8 h-8 animate-spin text-brand-accent" />
                                    ) : (
                                        <>
                                            <div
                                                className="text-4xl font-semibold text-brand-accent mb-2"
                                                style={{ fontFamily: 'var(--serif-display)' }}
                                            >
                                                ${usageStats?.totalCost.toFixed(4) || '0.0000'}
                                            </div>
                                            <p className="text-sm text-brand-text-secondary">Estimated platform cost for AI operations.</p>
                                        </>
                                    )}
                                </Card>
                                <Card className="p-6">
                                    <h3 className="text-xl font-semibold text-brand-text-primary mb-4" style={{ fontFamily: 'var(--serif-display)' }}>Feature Breakdown</h3>
                                    <div className="space-y-2">
                                        {usageStats?.featureBreakdown && Object.entries(usageStats.featureBreakdown).map(([feature, cost]: [string, any]) => (
                                            <div key={feature} className="flex justify-between items-center">
                                                <span className="capitalize">{feature}</span>
                                                <span className="font-mono text-brand-accent">${cost.toFixed(4)}</span>
                                            </div>
                                        ))}
                                        {(!usageStats?.featureBreakdown || Object.keys(usageStats.featureBreakdown).length === 0) && (
                                            <p className="text-sm text-brand-text-secondary italic">No usage data yet.</p>
                                        )}
                                    </div>
                                </Card>
                            </div>

                            <Card className="p-6">
                                <h3 className="text-xl font-semibold text-brand-text-primary mb-4" style={{ fontFamily: 'var(--serif-display)' }}>Recent AI Operations</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-brand-border">
                                                <th className="pb-3 font-semibold text-xs uppercase text-brand-text-secondary">Feature</th>
                                                <th className="pb-3 font-semibold text-xs uppercase text-brand-text-secondary">Model</th>
                                                <th className="pb-3 font-semibold text-xs uppercase text-brand-text-secondary">Cost</th>
                                                <th className="pb-3 font-semibold text-xs uppercase text-brand-text-secondary">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-brand-border">
                                            {usageStats?.recentLogs.map((log: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td className="py-3 capitalize text-sm">{log.feature}</td>
                                                    <td className="py-3 text-[12px] font-mono text-brand-text-secondary">{log.model}</td>
                                                    <td className="py-3 font-mono text-sm text-brand-accent">${log.costEstimate?.toFixed(4)}</td>
                                                    <td className="py-3 text-xs text-brand-text-secondary">
                                                        {log.timestamp?.toDate()?.toLocaleString() || 'Just now'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    ) : activeTab === 'challenges' ? (
                        <ChallengeCreator />
                    ) : activeTab === 'broadcasts' ? (
                        <Card className="animate-fade-in">
                            <h2 className="text-2xl font-semibold text-brand-text-primary mb-4" style={{ fontFamily: 'var(--serif-display)' }}>Broadcast Engine</h2>
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
                            <h2 className="text-2xl font-semibold text-brand-text-primary mb-4" style={{ fontFamily: 'var(--serif-display)' }}>Live Events & Streaming</h2>
                            <p className="text-sm text-brand-text-secondary mb-6">Manage online streams (Mux/Agora) and physical event registrations.</p>
                            <div className="space-y-6">
                                <div className="p-6 border border-brand-border rounded-xl bg-brand-secondary/30">
                                    <h3 className="text-lg font-semibold text-brand-text-primary mb-4" style={{ fontFamily: 'var(--serif-display)' }}>Schedule New Event</h3>
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

                                <div className="p-6 border border-brand-border rounded-xl bg-brand-secondary/30">
                                    <h3 className="text-lg font-semibold text-brand-text-primary mb-4" style={{ fontFamily: 'var(--serif-display)' }}>Mux Live Stream Configuration</h3>
                                    <p className="text-sm text-brand-text-secondary mb-4">Generate a secure stream key for OBS or other broadcasting software.</p>
                                    
                                    {muxStreamKey ? (
                                        <div className="space-y-4">
                                            <div className="p-4 bg-brand-dark rounded-xl border border-brand-border">
                                                <p className="text-xs text-status-success uppercase font-bold mb-1">Stream is Active & Ready</p>
                                                <p className="text-sm text-brand-text-secondary mb-2">The Live Stream page is now automatically using this Playback ID.</p>
                                            </div>
                                            <div className="p-4 bg-brand-dark rounded-xl border border-brand-border">
                                                <p className="text-xs text-brand-text-secondary uppercase font-bold mb-1">Stream Key (Keep Secret)</p>
                                                <p className="font-mono text-brand-text-primary break-all">{muxStreamKey}</p>
                                            </div>
                                            <div className="p-4 bg-brand-dark rounded-xl border border-brand-border">
                                                <p className="text-xs text-brand-text-secondary uppercase font-bold mb-1">Playback ID</p>
                                                <p className="font-mono text-brand-text-primary break-all">{muxPlaybackId}</p>
                                            </div>
                                            <p className="text-xs text-brand-accent">Use the Stream Key in OBS Studio (Server: rtmp://global-live.mux.com:5222/app)</p>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={handleCreateMuxStream}
                                            disabled={isCreatingMuxStream}
                                            className="w-full py-3 bg-brand-accent text-white rounded-xl font-bold hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isCreatingMuxStream ? <><SpinnerIcon className="w-5 h-5"/> Generating...</> : 'Generate Mux Stream Key'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ) : activeTab === 'payments' ? (
                        <Card className="animate-fade-in">
                            <h2 className="text-2xl font-semibold text-brand-text-primary mb-4" style={{ fontFamily: 'var(--serif-display)' }}>Global Payment Gateways</h2>
                            <p className="text-sm text-brand-text-secondary mb-6">Manage monetization, subscriptions, and international/local payments.</p>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 border border-brand-border rounded-xl bg-brand-secondary/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-brand-accent/10 border border-brand-accent/20 rounded-lg flex items-center justify-center">
                                            <DbIcon className="w-6 h-6 text-brand-accent" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-brand-text-primary">Flutterwave Integration</h3>
                                            <p className="text-xs text-brand-text-secondary">Global Cards, Mobile Money & Local Payments</p>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 bg-status-success/10 text-status-success border border-status-success/30 text-[11px] font-bold tracking-[0.06em] uppercase rounded-full">Connected</span>
                                </div>

                                <div className="p-6 border border-brand-border rounded-xl bg-brand-secondary/30">
                                    <h3 className="text-lg font-semibold text-brand-text-primary mb-4" style={{ fontFamily: 'var(--serif-display)' }}>Payment Configuration</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">Flutterwave Public Key</label>
                                            <input 
                                                type="password" 
                                                value={flutterwaveKey}
                                                onChange={(e) => setFlutterwaveKey(e.target.value)}
                                                className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 text-brand-text-primary focus:border-brand-accent outline-none font-mono text-sm" 
                                                placeholder="FLWPUBK_TEST-..."
                                            />
                                            <p className="text-[12px] text-brand-text-secondary mt-2 italic">
                                                This key is used for client-side payment initialization. Keep it secure.
                                            </p>
                                        </div>
                                        <button 
                                            onClick={handleUpdatePaymentSettings}
                                            disabled={isUpdatingPayment || !flutterwaveKey}
                                            className="w-full py-3 bg-brand-accent text-white rounded-xl font-bold hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isUpdatingPayment ? <><SpinnerIcon className="w-5 h-5"/> Updating...</> : 'Save Payment Settings'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ) : activeTab === 'discounts' ? (
                        <Card className="animate-fade-in">
                            <h2 className="text-2xl font-semibold text-brand-text-primary mb-4" style={{ fontFamily: 'var(--serif-display)' }}>Discount Management</h2>
                            <p className="text-sm text-brand-text-secondary mb-6">Configure seasonal discounts and promotional offers for subscriptions.</p>
                            
                            <div className="space-y-6">
                                <div className="p-6 border border-brand-border rounded-xl bg-brand-secondary/30">
                                    <h3 className="text-lg font-semibold text-brand-text-primary mb-4" style={{ fontFamily: 'var(--serif-display)' }}>Active Promotions</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-brand-dark rounded-xl border border-brand-border">
                                            <div>
                                                <h4 className="font-bold text-brand-text-primary">Yearly Subscription Discount</h4>
                                                <p className="text-xs text-brand-text-secondary">Applies automatically to all yearly plans</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-lg font-black text-brand-accent">20% OFF</span>
                                                <span className="px-2.5 py-1 bg-status-success/10 text-status-success border border-status-success/30 text-[11px] font-bold tracking-[0.06em] uppercase rounded-full">Active</span>
                                            </div>
                                        </div>
                                        {loadingDiscounts ? (
                                            <div className="text-center text-brand-text-secondary py-4">Loading discounts...</div>
                                        ) : (
                                            discounts.map((discount) => (
                                                <div key={discount.id} className="flex items-center justify-between p-4 bg-brand-dark rounded-xl border border-brand-border">
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-brand-text-primary">{discount.name}</h4>
                                                        <p className="text-xs text-brand-text-secondary">
                                                            Valid: {discount.startDate} - {discount.endDate}
                                                            <span className="ml-2 px-1 bg-brand-secondary rounded text-[12px] uppercase">{discount.type}</span>
                                                        </p>
                                                        <p className="text-[12px] text-brand-text-secondary mt-1">
                                                            Target: {discount.targetTier} plans ({discount.targetBilling})
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-lg font-black text-brand-accent">{discount.percentage}% OFF</span>
                                                        <div className="flex flex-col gap-2">
                                                            <button 
                                                                onClick={() => handleToggleDiscount(discount.id, discount.isActive)}
                                                                className={`px-3 py-1 text-[11px] font-bold tracking-[0.06em] uppercase rounded-full border transition-colors ${discount.isActive ? 'bg-status-success/10 text-status-success border-status-success/30 hover:bg-status-success/20' : 'bg-status-error/10 text-status-error border-status-error/30 hover:bg-status-error/20'}`}
                                                            >
                                                                {discount.isActive ? 'Active' : 'Inactive'}
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteDiscount(discount.id)}
                                                                className="text-[12px] text-brand-text-secondary hover:text-status-error uppercase font-bold"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="p-6 border border-brand-border rounded-xl bg-brand-secondary/30">
                                    <h3 className="text-lg font-semibold text-brand-text-primary mb-4" style={{ fontFamily: 'var(--serif-display)' }}>Create Discount Campaign</h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">Campaign Name</label>
                                                <input 
                                                    type="text" 
                                                    value={discountName}
                                                    onChange={(e) => setDiscountName(e.target.value)}
                                                    className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 text-brand-text-primary focus:border-brand-accent outline-none" 
                                                    placeholder="e.g., Easter Special 2026"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">Discount Type</label>
                                                <select 
                                                    value={discountType}
                                                    onChange={(e) => setDiscountType(e.target.value as any)}
                                                    className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 text-brand-text-primary focus:border-brand-accent outline-none"
                                                >
                                                    <option value="seasonal">Seasonal Discount</option>
                                                    <option value="yearly">Yearly Incentive</option>
                                                    <option value="custom">Custom Promotion</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">Percentage (%)</label>
                                                <input 
                                                    type="number" 
                                                    value={discountPercentage}
                                                    onChange={(e) => setDiscountPercentage(e.target.value)}
                                                    className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 text-brand-text-primary focus:border-brand-accent outline-none" 
                                                    placeholder="e.g., 15"
                                                    min="1"
                                                    max="100"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">Target Plan</label>
                                                <select 
                                                    value={targetTier}
                                                    onChange={(e) => setTargetTier(e.target.value as any)}
                                                    className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 text-brand-text-primary focus:border-brand-accent outline-none"
                                                >
                                                    <option value="all">All Paid Plans</option>
                                                    <option value="pro">Pro Only</option>
                                                    <option value="max">Max Only</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">Billing Cycle</label>
                                                <select 
                                                    value={targetBilling}
                                                    onChange={(e) => setTargetBilling(e.target.value as any)}
                                                    className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 text-brand-text-primary focus:border-brand-accent outline-none"
                                                >
                                                    <option value="both">Monthly & Yearly</option>
                                                    <option value="monthly">Monthly Only</option>
                                                    <option value="yearly">Yearly Only</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">Start Date</label>
                                                <input 
                                                    type="date" 
                                                    value={discountStartDate}
                                                    onChange={(e) => setDiscountStartDate(e.target.value)}
                                                    className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 text-brand-text-primary focus:border-brand-accent outline-none" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">End Date</label>
                                                <input 
                                                    type="date" 
                                                    value={discountEndDate}
                                                    onChange={(e) => setDiscountEndDate(e.target.value)}
                                                    className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 text-brand-text-primary focus:border-brand-accent outline-none" 
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            className="w-full py-3 bg-brand-accent text-white rounded-xl font-bold hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
                                            onClick={handleCreateDiscount}
                                            disabled={isCreatingDiscount || !discountName || !discountPercentage || !discountStartDate || !discountEndDate}
                                        >
                                            {isCreatingDiscount ? <><SpinnerIcon className="w-5 h-5"/> Creating...</> : 'Launch Discount Campaign'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ) : activeTab === 'resources' ? (
                        <Card className="animate-fade-in">
                            <h2 className="text-2xl font-semibold text-brand-text-primary mb-4" style={{ fontFamily: 'var(--serif-display)' }}>Resource Manager</h2>
                            <p className="text-sm text-brand-text-secondary mb-6">Upload and manage books, courses, and media with monetization settings.</p>
                            
                            <div className="space-y-8">
                                <div className="p-6 border border-brand-border rounded-xl bg-brand-secondary/30">
                                    <h3 className="text-lg font-semibold text-brand-text-primary mb-4" style={{ fontFamily: 'var(--serif-display)' }}>Add New Resource</h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">Resource Title</label>
                                                <input 
                                                    type="text" 
                                                    value={resourceTitle}
                                                    onChange={(e) => setResourceTitle(e.target.value)}
                                                    className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 text-brand-text-primary focus:border-brand-accent outline-none" 
                                                    placeholder="e.g., The Art of Prayer"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">Resource Type</label>
                                                <select 
                                                    value={resourceType}
                                                    onChange={(e) => setResourceType(e.target.value as any)}
                                                    className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 text-brand-text-primary focus:border-brand-accent outline-none"
                                                >
                                                    <option value="book">Book (PDF/EPUB)</option>
                                                    <option value="course">Course (Video/Text)</option>
                                                    <option value="audiobook">Audiobook (MP3)</option>
                                                    <option value="challenge">Challenge (Program)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">Access Lane</label>
                                                <select 
                                                    value={resourceAccessLane}
                                                    onChange={(e) => setResourceAccessLane(e.target.value as any)}
                                                    className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 text-brand-text-primary focus:border-brand-accent outline-none"
                                                >
                                                    <option value="included">Included in Subscription</option>
                                                    <option value="owned">Buy Once (Owned Forever)</option>
                                                    <option value="hybrid">Hybrid (Both)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">Price (USD)</label>
                                                <input 
                                                    type="number" 
                                                    value={resourcePrice}
                                                    onChange={(e) => setResourcePrice(e.target.value)}
                                                    disabled={resourceAccessLane === 'included'}
                                                    className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 text-brand-text-primary focus:border-brand-accent outline-none disabled:opacity-50" 
                                                    placeholder="e.g., 19.99"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">Tier Required</label>
                                                <select 
                                                    value={resourceTier}
                                                    onChange={(e) => setResourceTier(e.target.value as any)}
                                                    disabled={resourceAccessLane === 'owned'}
                                                    className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 text-brand-text-primary focus:border-brand-accent outline-none disabled:opacity-50"
                                                >
                                                    <option value="free">Free Tier</option>
                                                    <option value="pro">Pro Tier</option>
                                                    <option value="max">Max Tier</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="p-6 border-2 border-dashed border-brand-border rounded-xl bg-brand-secondary/30 text-center">
                                            <input 
                                                type="file" 
                                                id="file-upload" 
                                                className="hidden" 
                                                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                            />
                                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-brand-accent/20 rounded-full flex items-center justify-center mb-4">
                                                    <PlusCircleIcon className="w-8 h-8 text-brand-accent" />
                                                </div>
                                                <p className="font-bold text-brand-text-primary mb-1">
                                                    {uploadFile ? uploadFile.name : 'Click to select a file'}
                                                </p>
                                                <p className="text-xs text-brand-text-secondary">
                                                    {uploadFile ? `${(uploadFile.size / 1024 / 1024).toFixed(2)} MB` : 'MP4, PDF, JPG, PNG (Max 500MB)'}
                                                </p>
                                            </label>

                                            {uploadFile && (
                                                <div className="mt-6 flex gap-4 justify-center">
                                                    <button 
                                                        onClick={handleFileUpload}
                                                        disabled={isUploading || !resourceTitle}
                                                        className="px-8 py-3 bg-brand-accent text-white rounded-xl font-bold hover:scale-[1.02] transition-transform disabled:opacity-50"
                                                    >
                                                        {isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Upload to Firebase'}
                                                    </button>
                                                    {uploadFile.type.startsWith('video/') && (
                                                        <button 
                                                            onClick={handleMuxUpload}
                                                            disabled={isUploading || !resourceTitle}
                                                            className="px-8 py-3 bg-gold-ds text-white rounded-xl font-bold hover:scale-[1.02] transition-transform disabled:opacity-50"
                                                        >
                                                            {isUploading ? 'Uploading to Mux...' : 'Upload Video to Mux'}
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {uploadMessage && (
                                                <p className={`mt-4 text-sm font-bold ${uploadMessage.includes('success') ? 'text-status-success' : 'text-status-error'}`}>
                                                    {uploadMessage}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border border-brand-border rounded-xl bg-brand-secondary/30">
                                    <h3 className="text-lg font-semibold text-brand-text-primary mb-4" style={{ fontFamily: 'var(--serif-display)' }}>Existing Resources</h3>
                                    <div className="space-y-4">
                                        {loadingResources ? (
                                            <div className="text-center text-brand-text-secondary py-4">Loading resources...</div>
                                        ) : resources.length === 0 ? (
                                            <div className="text-center text-brand-text-secondary py-4 italic">No resources found.</div>
                                        ) : (
                                            resources.map((res) => (
                                                <div key={res.id} className="flex items-center justify-between p-4 bg-brand-dark rounded-xl border border-brand-border">
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-brand-text-primary">{res.title}</h4>
                                                        <p className="text-xs text-brand-text-secondary">
                                                            {res.type.toUpperCase()} • {res.accessLane.toUpperCase()}
                                                            {res.priceUsd > 0 && ` • $${res.priceUsd}`}
                                                            {res.tierRequired && ` • ${res.tierRequired.toUpperCase()} Required`}
                                                        </p>
                                                        <p className="text-[12px] text-brand-text-secondary mt-1">
                                                            Uploaded: {res.createdAt}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <button 
                                                            onClick={() => handleDeleteResource(res.id)}
                                                            className="text-[12px] text-brand-text-secondary hover:text-status-error uppercase font-bold"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ) : activeTab === 'tenancy' ? (
                        <div className="space-y-6 animate-fade-in">
                            <Card className="border-l-4 border-brand-accent">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-semibold text-brand-text-primary" style={{ fontFamily: 'var(--serif-display)' }}>Victory Community</h3>
                                        <p className="text-xs text-brand-text-secondary">Infrastructure: Dedicated Firestore Isolation (US-East)</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-semibold text-brand-accent" style={{ fontFamily: 'var(--serif-display)' }}>1,250</p>
                                        <p className="text-[11px] tracking-[0.08em] uppercase font-bold text-brand-text-secondary">Active Members</p>
                                    </div>
                                </div>
                            </Card>
                            <button className="w-full py-4 border-2 border-dashed border-brand-border rounded-xl text-brand-text-secondary font-bold hover:bg-brand-accent/5 transition-colors">
                                + Provision New Community Tenant
                            </button>
                        </div>
                    ) : activeTab === 'landscape' ? (
                        <LandscapeTab />
                    ) : null}
                </div>

                <Card>
                    <h2 className="text-2xl font-semibold text-brand-text-primary mb-4" style={{ fontFamily: 'var(--serif-display)' }}>Content Controls</h2>
                    <div className="space-y-3">
                        <button className="w-full text-left flex items-center gap-3 p-3.5 rounded-xl bg-brand-dark border border-brand-border hover:border-brand-accent/40 hover:bg-brand-accent/5 transition-colors">
                            <TrophyIcon className="w-6 h-6 text-brand-accent shrink-0"/>
                            <div>
                                <p className="font-semibold text-brand-text-primary">Challenge Templates</p>
                                <p className="text-xs text-brand-text-secondary">Manage Community Sprints</p>
                            </div>
                        </button>
                        <button className="w-full text-left flex items-center gap-3 p-3.5 rounded-xl bg-brand-dark border border-brand-border hover:border-brand-accent/40 hover:bg-brand-accent/5 transition-colors">
                            <ReaderIcon className="w-6 h-6 text-brand-accent shrink-0"/>
                            <div>
                                <p className="font-semibold text-brand-text-primary">Books & Courses</p>
                                <p className="text-xs text-brand-text-secondary">Global Library Distribution</p>
                            </div>
                        </button>
                        <button className="w-full text-left flex items-center gap-3 p-3.5 rounded-xl bg-brand-dark border border-brand-border hover:border-brand-accent/40 hover:bg-brand-accent/5 transition-colors">
                            <SpeakerWaveIcon className="w-6 h-6 text-brand-accent shrink-0"/>
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
