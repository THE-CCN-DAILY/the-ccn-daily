import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Moon, Sun, BookOpen, Bell, User as UserIcon, LogOut, Crown, FolderCog, Headphones, Mic } from 'lucide-react';
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
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
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { notify } = useNotifications();

  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [playback, setPlayback] = useState<PlaybackPrefs>(getPlaybackPrefs());
  const isAdmin = user?.role === 'admin';

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
          <Row title="Voice notes" desc="Record spoken notes on any content.">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-accent">
              <Mic className="w-3.5 h-3.5" /> Premium · coming soon
            </span>
          </Row>
        </Card>

        {/* Account */}
        <Card>
          <SectionTitle><span className="inline-flex items-center gap-2"><UserIcon className="w-5 h-5 text-brand-accent" />Account</span></SectionTitle>
          <div className="flex items-center gap-3 mb-4">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="h-12 w-12 rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--bg-sunk)', color: 'var(--ember)' }}>{initials}</div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-brand-text-primary truncate">{user?.displayName || 'Member'}</p>
              <p className="text-xs text-brand-text-secondary truncate">{user?.email}</p>
            </div>
            {isAdmin && (
              <span className="ml-auto px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-accent/15 text-brand-accent">Admin</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => { void signOut(); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-status-error hover:bg-status-error/10 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
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
