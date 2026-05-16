import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  createNotification,
  listNotifications,
  markNotificationRead,
  markNotificationsRead,
} from '../services/notificationService';

import { Toaster, toast } from 'sonner';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: any;
  read: boolean;
  type: 'in-app' | 'email' | 'both';
}

interface NotificationContextType {
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'read'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  unreadCount: number;
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    let cancelled = false;

    listNotifications(user.uid)
      .then((fetchedNotifications) => {
        if (!cancelled) setNotifications(fetchedNotifications);
      })
      .catch((error) => {
        console.error('Failed to fetch notifications', error);
        if (!cancelled) setNotifications([]);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const addNotification = async (notification: Omit<AppNotification, 'id' | 'read'>) => {
    if (!user) {
      toast.success(notification.title);
      return;
    }

    try {
      const saved = await createNotification(user.uid, notification);
      if (saved) setNotifications(prev => [saved, ...prev]);
      toast.success(notification.title);
    } catch (error) {
      console.error('Failed to create notification', error);
    }
  };

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    switch (type) {
      case 'success': toast.success(message); break;
      case 'error': toast.error(message); break;
      default: toast(message);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (!user) return;
    try {
      await markNotificationRead(user.uid, id);
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (!user) return;
    try {
      await markNotificationsRead(user.uid);
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, markAllAsRead, unreadCount, notify }}>
      <Toaster position="top-right" richColors />
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
