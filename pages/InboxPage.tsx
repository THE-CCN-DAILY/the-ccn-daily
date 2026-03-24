import React from 'react';
import Card from '../components/Card';
import { useNotifications } from '../contexts/NotificationContext';
import { BellIcon, CheckIcon } from '../components/icons';

const InboxPage: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-black text-brand-text-primary flex items-center gap-4">
            <BellIcon className="w-10 h-10 text-brand-accent"/>
            Inbox & Updates
          </h1>
          <p className="text-brand-text-secondary mt-2">Stay connected with the latest announcements and broadcasts.</p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-sm font-bold text-brand-accent hover:text-brand-accent/80 flex items-center gap-2"
          >
            <CheckIcon className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      <Card className="p-0 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <BellIcon className="w-12 h-12 text-brand-text-secondary opacity-20 mx-auto mb-4" />
            <p className="text-brand-text-secondary">You have no new updates.</p>
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
