import React from 'react';
import { motion } from 'motion/react';
import Card from '../components/Card';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { BellIcon, CheckIcon } from '../components/icons';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const InboxPage: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const { user } = useAuth();
  const { status: pushStatus, loading: pushLoading, enable: enablePush } = usePushNotifications({
    uid: user?.uid ?? null,
    autoRefresh: true,
  });

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <motion.div
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2">Account</p>
          <h1 className="text-3xl sm:text-4xl font-black text-brand-text-primary mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Inbox &amp; Updates
          </h1>
          <p className="text-brand-text-secondary">Announcements, broadcasts, and system updates — all in one place.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex-shrink-0 text-sm font-bold text-brand-accent hover:text-brand-accent/80 flex items-center gap-2 self-start sm:self-auto"
          >
            <CheckIcon className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </motion.div>

      {/* ── Push notification opt-in ───────────────────────────────── */}
      {pushStatus !== 'unsupported' && pushStatus !== 'denied' && (
        <motion.div
          className="mb-6 rounded-xl border border-brand-border bg-brand-secondary p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.1 }}
        >
          <div className="flex items-start gap-3">
            <BellIcon className="w-5 h-5 text-brand-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-brand-text-primary mb-0.5">Device Notifications</p>
              <p className="text-xs text-brand-text-secondary leading-snug">
                {pushStatus === 'granted'
                  ? 'Push notifications are active on this device.'
                  : 'Receive daily devotionals and ministry updates even when the app is closed.'}
              </p>
            </div>
          </div>
          {pushStatus !== 'granted' && (
            <button
              onClick={enablePush}
              disabled={pushLoading}
              className="flex-shrink-0 px-5 py-2 rounded-full bg-brand-accent text-white text-sm font-bold disabled:opacity-50 transition-opacity"
            >
              {pushLoading ? 'Enabling…' : 'Enable'}
            </button>
          )}
          {pushStatus === 'granted' && (
            <span className="flex-shrink-0 text-xs font-bold text-brand-accent px-3 py-1 rounded-full border border-brand-accent/40">
              ✓ Active
            </span>
          )}
        </motion.div>
      )}

      <Card className="p-0 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <BellIcon className="w-12 h-12 text-brand-text-secondary opacity-20 mx-auto mb-4" />
            <p className="text-brand-text-secondary mb-4" style={{ fontFamily: 'var(--serif-body)', lineHeight: 1.65 }}>Nothing here yet. Quietness is not absence.</p>
            <p className="text-sm italic text-brand-text-secondary opacity-60" style={{ fontFamily: 'var(--serif-body)' }}>Be still, and know that I am God. — Ps. 46:10</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-border">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-6 transition-colors ${notification.read ? 'bg-brand-dark opacity-75' : 'bg-brand-secondary/30 border-l-4 border-brand-accent'}`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-bold ${notification.read ? 'text-brand-text-secondary' : 'text-brand-text-primary'}`}>
                    {notification.title}
                  </h3>
                  <span className="text-xs text-brand-text-secondary">
                    {new Date(notification.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-brand-text-secondary leading-relaxed">
                  {notification.message}
                </p>
                {!notification.read && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                    className="mt-4 text-xs font-bold text-brand-accent hover:underline"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default InboxPage;
