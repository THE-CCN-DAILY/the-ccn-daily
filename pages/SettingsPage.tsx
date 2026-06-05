import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Moon, Sun, BookOpen, Bell, User as UserIcon, LogOut, Crown, FolderCog, Headphones, Mic, Camera, Pencil, Lock, Check, X } from 'lucide-react';
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { getTierLabel, type SubscriptionTier } from '../types/pricing';
import { getUserSubscription } from '../services/purchaseService';
import {
  uploadProfilePhoto,
  updateDisplayName,
  changePassword,
  hasPasswordProvider,
  getErrorMessage,
} from '../services/accountService';
import {
  type NotificationPrefs,
  type PlaybackPrefs,
  DEFAULT_NOTIFICATION_PREFS,
  loadNotificationPrefs,
  saveNotificationPrefs,
  getPlaybackPrefs,
  savePlaybackPrefs,
} from '../services/settingsService';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2
    className="text-xl mb-4"
    style={{ fontFamily: 'var(--serif-display)', fontWeight: 600, color: 'var(--fg-1)' }}
  >
    {children}
  </h2>
);

const Row: React.FC<{ title: string; desc?: string; children: React.ReactNode }> = ({ title, desc, children }) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-brand-border last:border-0">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-brand-text-primary">{title}</p>
      {desc && <p className="text-xs text-brand-text-secondary mt-0.5">{desc}</p>}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

const Toggle: React.FC<{ on: boolean; onClick: () => void; label: string }> = ({ on, onClick, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={onClick}
    className={`relative h-6 w-11 rounded-full transition-colors ${on ? 'bg-brand-accent' : 'bg-brand-border'}`}
  >
    <span
      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`}
    />
  </button>
);

const THEMES: Array<{ id: Theme; label: string; icon: React.FC<{ className?: string }> }> = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'sepia', label: 'Sepia', icon: BookOpen },
];

const SettingsPage: React.FC = () => {
  const { user, signOut, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { notify } = useNotifications();

  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [playback, setPlayback] = useState<PlaybackPrefs>(getPlaybackPrefs());
  const [trustedTier, setTrustedTier] = useState<SubscriptionTier>('free');
  const [planStatus, setPlanStatus] = useState<'checking' | 'synced' | 'offline'>('checking');
  const isAdmin = user?.role === 'admin';

  // ── Profile editing state ──────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.displayName ?? '');
  const [savingName, setSavingName] = useState(false);

  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const canChangePassword = hasPasswordProvider();

  useEffect(() => { setNameValue(user?.displayName ?? ''); }, [user?.displayName]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file || !user?.uid) return;
    setUploadingPhoto(true);
    try {
      await uploadProfilePhoto(user.uid, file);
      await refreshUser();
      notify('Profile photo updated.', 'success');
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveName = async () => {
    if (!user?.uid) return;
    setSavingName(true);
    try {
      await updateDisplayName(user.uid, nameValue);
      await refreshUser();
      setEditingName(false);
      notify('Name updated.', 'success');
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      notify('New passwords do not match.', 'error');
      return;
    }
    setSavingPw(true);
    try {
      await changePassword(currentPw, newPw);
      setShowPwForm(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      notify('Password changed.', 'success');
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setSavingPw(false);
    }
  };

  const authTier = ((user?.tier as SubscriptionTier | undefined) || 'free');
  const currentTierLabel = getTierLabel(trustedTier);
  const isPaidTier = trustedTier === 'pro' || trustedTier === 'max' || trustedTier === 'partner';

  useEffect(() => {
    if (!user?.uid) {
      setTrustedTier('free');
      setPlanStatus('synced');
      return;
    }

    let cancelled = false;
    setPlanStatus('checking');
    setTrustedTier(authTier);

    getUserSubscription(user.uid)
      .then((subscription) => {
        if (cancelled) return;
        setTrustedTier(subscription.tier || 'free');
        setPlanStatus('synced');
      })
      .catch(() => {
        if (cancelled) return;
        setTrustedTier(authTier);
        setPlanStatus('offline');
      });

    return () => { cancelled = true; };
  }, [authTier, user?.uid]);

  useEffect(() => {
    if (user?.uid) loadNotificationPrefs(user.uid).then(setNotifPrefs).catch(() => {});
  }, [user?.uid]);

  const toggleNotif = async (key: keyof NotificationPrefs) => {
    if (!user?.uid) return;
    const next = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(next);
    const ok = await saveNotificationPrefs(user.uid, next);
    if (!ok) notify('Saved on this device; we’ll sync when you’re back online.', 'info');
  };

  const togglePlayback = (key: keyof PlaybackPrefs) => {
    const next = { ...playback, [key]: !playback[key] };
    setPlayback(next);
    savePlaybackPrefs(next);
  };

  const initials = (user?.displayName || user?.email || '?')
    .split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '✦';

  return (
    <div className="max-w-3xl mx-auto pb-24 px-4">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2">Your preferences</p>
        <h1 className="text-4xl font-black text-brand-text-primary" style={{ fontFamily: 'var(--serif-display)' }}>
          Settings
        </h1>
      </motion.div>

      <div className="space-y-6">
        {/* Appearance */}
        <Card>
          <SectionTitle>Appearance</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map(({ id, label, icon: Icon }) => {
              const active = theme === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTheme(id)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition-colors ${
                    active ? 'border-brand-accent bg-brand-accent/10' : 'border-brand-border bg-brand-dark hover:border-brand-border-strong'
                  }`}
                  aria-pressed={active}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-brand-accent' : 'text-brand-text-secondary'}`} />
                  <span className={`text-sm font-semibold ${active ? 'text-brand-accent' : 'text-brand-text-primary'}`}>{label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-brand-text-secondary mt-3">Dark is the default. Your choice is saved on this device.</p>
        </Card>

        {/* Notifications */}
        <Card>
          <SectionTitle><span className="inline-flex items-center gap-2"><Bell className="w-5 h-5 text-brand-accent" />Notifications</span></SectionTitle>
          <Row title="Product updates & announcements" desc="New features and important changes.">
            <Toggle on={notifPrefs.productUpdates} onClick={() => toggleNotif('productUpdates')} label="Product updates" />
          </Row>
          <Row title="Daily devotional reminder" desc="A nudge to begin your daily journey.">
            <Toggle on={notifPrefs.dailyDevotional} onClick={() => toggleNotif('dailyDevotional')} label="Daily devotional reminder" />
          </Row>
          <Row title="Community replies" desc="When someone responds to you.">
            <Toggle on={notifPrefs.communityReplies} onClick={() => toggleNotif('communityReplies')} label="Community replies" />
          </Row>
        </Card>

        {/* Playback & Notes */}
        <Card>
          <SectionTitle><span className="inline-flex items-center gap-2"><Headphones className="w-5 h-5 text-brand-accent" />Playback &amp; Notes</span></SectionTitle>
          <Row title="Autoplay audio" desc="Start audio automatically where available.">
            <Toggle on={playback.autoplayAudio} onClick={() => togglePlayback('autoplayAudio')} label="Autoplay audio" />
          </Row>
          <Row title="Prayer voice" desc="Open the guided voice prayer companion.">
            <Link
              to="/app/prayer-companion"
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-2 text-xs font-bold text-brand-text-primary transition-colors hover:bg-brand-secondary"
            >
              <Mic className="w-3.5 h-3.5" /> Open companion
            </Link>
          </Row>
        </Card>

        {/* Plan & Billing — visible to everyone */}
        <Card>
          <SectionTitle><span className="inline-flex items-center gap-2"><Crown className="w-5 h-5 text-brand-accent" />Plan &amp; Billing</span></SectionTitle>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-brand-text-secondary">Your current plan</p>
              <p className="text-lg font-bold text-brand-text-primary">{currentTierLabel}</p>
              <p className="mt-1 text-xs text-brand-text-secondary">
                {planStatus === 'checking'
                  ? 'Checking your access...'
                  : planStatus === 'synced'
                  ? 'Synced with your subscription record.'
                  : 'Showing your saved account record until subscription sync returns.'}
              </p>
            </div>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90 flex-shrink-0"
              style={{ backgroundColor: 'var(--ember)' }}
            >
              <Crown className="w-4 h-4" />
              {isPaidTier ? 'Manage Plan' : 'Upgrade Plan'}
            </Link>
          </div>
        </Card>

        {/* Account / Profile */}
        <Card>
          <SectionTitle><span className="inline-flex items-center gap-2"><UserIcon className="w-5 h-5 text-brand-accent" />Account</span></SectionTitle>

          {/* Avatar + identity */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-shrink-0">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="h-16 w-16 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="h-16 w-16 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: 'var(--bg-sunk)', color: 'var(--ember)' }}>{initials}</div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                aria-label="Change profile photo"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-brand-dark text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: 'var(--ember)' }}
              >
                {uploadingPhoto
                  ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  : <Camera className="h-3.5 w-3.5" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </div>

            <div className="min-w-0 flex-1">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    maxLength={60}
                    placeholder="Your name"
                    className="w-full rounded-lg border border-brand-border bg-brand-secondary px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-accent/70"
                  />
                  <button type="button" onClick={handleSaveName} disabled={savingName} aria-label="Save name" className="p-2 rounded-lg text-status-success hover:bg-status-success/10 disabled:opacity-60">
                    <Check className="w-5 h-5" />
                  </button>
                  <button type="button" onClick={() => { setEditingName(false); setNameValue(user?.displayName ?? ''); }} aria-label="Cancel" className="p-2 rounded-lg text-brand-text-secondary hover:bg-brand-secondary">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-brand-text-primary truncate">{user?.displayName || 'Member'}</p>
                  <button type="button" onClick={() => setEditingName(true)} aria-label="Edit name" className="p-1.5 rounded-md text-brand-text-secondary hover:text-brand-accent hover:bg-brand-secondary">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {isAdmin && (
                    <span className="ml-auto px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-accent/15 text-brand-accent">Admin</span>
                  )}
                </div>
              )}
              <p className="text-xs text-brand-text-secondary truncate mt-0.5">{user?.email}</p>
            </div>
          </div>

          {/* Change password (email/password users only) */}
          {canChangePassword && (
            <div className="border-t border-brand-border pt-4">
              {!showPwForm ? (
                <button
                  type="button"
                  onClick={() => setShowPwForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-dark border border-brand-border text-brand-text-primary hover:border-brand-accent transition-colors"
                >
                  <Lock className="w-4 h-4" /> Change password
                </button>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
                  <p className="text-sm font-semibold text-brand-text-primary">Change password</p>
                  <input type="password" autoComplete="current-password" placeholder="Current password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required className="w-full rounded-lg border border-brand-border bg-brand-secondary px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-accent/70" />
                  <input type="password" autoComplete="new-password" placeholder="New password (min 6)" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={6} className="w-full rounded-lg border border-brand-border bg-brand-secondary px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-accent/70" />
                  <input type="password" autoComplete="new-password" placeholder="Confirm new password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required minLength={6} className="w-full rounded-lg border border-brand-border bg-brand-secondary px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-accent/70" />
                  <div className="flex items-center gap-2">
                    <button type="submit" disabled={savingPw} className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: 'var(--ember)' }}>
                      {savingPw ? 'Saving…' : 'Save password'}
                    </button>
                    <button type="button" onClick={() => { setShowPwForm(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }} className="px-4 py-2 rounded-lg text-sm font-semibold text-brand-text-secondary hover:bg-brand-secondary transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="border-t border-brand-border mt-4 pt-4">
            <button
              type="button"
              onClick={() => { void signOut(); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-status-error hover:bg-status-error/10 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </Card>

        {/* Admin */}
        {isAdmin && (
          <Card>
            <SectionTitle><span className="inline-flex items-center gap-2"><FolderCog className="w-5 h-5 text-brand-accent" />Admin</span></SectionTitle>
            <div className="flex flex-wrap gap-3">
              <Link to="/studio/content-manager" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-dark border border-brand-border text-brand-text-primary hover:border-brand-accent transition-colors">
                Content Manager
              </Link>
              <Link to="/studio" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-dark border border-brand-border text-brand-text-primary hover:border-brand-accent transition-colors">
                Admin Dashboard
              </Link>
              <Link to="/pricing" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-dark border border-brand-border text-brand-text-primary hover:border-brand-accent transition-colors">
                <Crown className="w-4 h-4" /> Plans
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
