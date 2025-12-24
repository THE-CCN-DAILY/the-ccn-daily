import React, { createContext, useState, useContext, useMemo, useCallback, useEffect } from 'react';
import type { UserStats, PointEarningAction } from '../types';
import { mockInitialStats, mockAchievements, mockEarningActions } from '../data/gamificationData';
import { useAuth } from './AuthContext';

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

  // This effect now correctly handles initializing and resetting state on login/logout
  // without destructively overwriting state during an active session.
  useEffect(() => {
    if (user) {
      // User has logged in. Initialize their state from the mock data.
      // This runs only when the user object changes, preserving session state.
      setStats(mockInitialStats);
      setUnlockedAchievements(mockAchievements.filter(a => a.isUnlocked).map(a => a.id));
    } else {
      // User has logged out. Reset state to be empty.
      setStats({ currentStreak: 0, longestStreak: 0, points: 0 });
      setUnlockedAchievements([]);
    }
  }, [user]); // The dependency array is key: this only runs on auth changes.


  const dispatchGamificationEvent = useCallback((actionId: PointEarningAction['id']) => {
    if (!user) {
        console.log("Cannot dispatch gamification event: no user is logged in.");
        return; // Don't award points if no one is logged in.
    }
    
    const action = mockEarningActions.find(a => a.id === actionId);
    if (!action) return;

    // This is a functional update, ensuring we're always working with the latest state.
    setStats(prev => ({ ...prev, points: prev.points + action.points }));
    
    // Simple achievement check for prototype
    let newAchievementId: string | null = null;
    if (actionId === 'e4' && !unlockedAchievements.includes('a5')) newAchievementId = 'a5'; // Note Taker
    if (actionId === 'e5' && !unlockedAchievements.includes('a6')) newAchievementId = 'a6'; // Community Builder
    
    if (newAchievementId && !unlockedAchievements.includes(newAchievementId)) {
        setUnlockedAchievements(prev => [...prev, newAchievementId!]);
        const achievement = mockAchievements.find(a => a.id === newAchievementId);
        if(achievement) {
            setStats(prev => ({ ...prev, points: prev.points + achievement.points }));
        }
    }

  }, [unlockedAchievements, user]);

  const redeemReward = useCallback((cost: number) => {
    if (!user) return;
    setStats(prev => {
        if (prev.points >= cost) {
            return { ...prev, points: prev.points - cost };
        }
        return prev;
    });
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
