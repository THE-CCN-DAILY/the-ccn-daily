import React, { createContext, useState, useContext, useMemo, useCallback, useEffect } from 'react';
import type { UserStats, PointEarningAction } from '../types';
import { mockInitialStats } from '../data/gamificationData';
import { useAuth } from './AuthContext';
import {
  dispatchGamificationAction,
  getGamification,
  redeemGamificationReward,
} from '../services/gamificationService';

interface GamificationContextType {
  stats: UserStats;
  unlockedAchievements: string[];
  dispatchGamificationEvent: (actionId: PointEarningAction['id']) => void;
  redeemReward: (cost: number) => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({ currentStreak: 0, longestStreak: 0, points: 0 });
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setStats({ currentStreak: 0, longestStreak: 0, points: 0 });
      setUnlockedAchievements([]);
      return;
    }

    let cancelled = false;

    getGamification(user.uid)
      .then((data) => {
        if (cancelled) return;
        setStats(data?.stats || mockInitialStats);
        setUnlockedAchievements(data?.unlockedAchievements || ['a1', 'a2', 'a3', 'a4']);
      })
      .catch((error) => {
        console.error('Failed to fetch gamification state', error);
        if (!cancelled) {
          setStats(mockInitialStats);
          setUnlockedAchievements(['a1', 'a2', 'a3', 'a4']);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);


  const dispatchGamificationEvent = useCallback(async (actionId: PointEarningAction['id']) => {
    if (!user) return;

    try {
      const data = await dispatchGamificationAction(user.uid, actionId);
      if (data) {
        setStats(data.stats);
        setUnlockedAchievements(data.unlockedAchievements);
      }
    } catch (error) {
      console.error('Failed to dispatch gamification event', error);
    }

  }, [user]);

  const redeemReward = useCallback(async (cost: number) => {
    if (!user) return;
    try {
      const data = await redeemGamificationReward(user.uid, cost);
      if (data) {
        setStats(data.stats);
        setUnlockedAchievements(data.unlockedAchievements);
      }
    } catch (error) {
      console.error('Failed to redeem gamification reward', error);
    }
  }, [user]);

  const value = useMemo(() => ({
    stats,
    unlockedAchievements,
    dispatchGamificationEvent,
    redeemReward,
  }), [stats, unlockedAchievements, dispatchGamificationEvent, redeemReward]);

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = (): GamificationContextType => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};
