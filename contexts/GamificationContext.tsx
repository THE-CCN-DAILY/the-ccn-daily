import React, { createContext, useState, useContext, useMemo, useCallback, useEffect } from 'react';
import type { UserStats, PointEarningAction } from '../types';
import { mockInitialStats, mockAchievements, mockEarningActions } from '../data/gamificationData';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

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

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.stats) {
          setStats(data.stats);
        } else {
          // Initialize stats if they don't exist
          updateDoc(userRef, { stats: mockInitialStats }).catch(err => 
            handleFirestoreError(err, OperationType.UPDATE, userRef.path)
          );
        }
        if (data.unlockedAchievements) {
          setUnlockedAchievements(data.unlockedAchievements);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, userRef.path);
    });

    return () => unsubscribe();
  }, [user]);


  const dispatchGamificationEvent = useCallback(async (actionId: PointEarningAction['id']) => {
    if (!user) return;
    
    const action = mockEarningActions.find(a => a.id === actionId);
    if (!action) return;

    const userRef = doc(db, 'users', user.uid);
    try {
        // Award points
        await updateDoc(userRef, {
            'stats.points': increment(action.points)
        });
        
        // Simple achievement check for prototype
        let newAchievementId: string | null = null;
        if (actionId === 'e4' && !unlockedAchievements.includes('a5')) newAchievementId = 'a5'; // Note Taker
        if (actionId === 'e5' && !unlockedAchievements.includes('a6')) newAchievementId = 'a6'; // Community Builder
        
        if (newAchievementId && !unlockedAchievements.includes(newAchievementId)) {
            const achievement = mockAchievements.find(a => a.id === newAchievementId);
            if(achievement) {
                await updateDoc(userRef, {
                    unlockedAchievements: arrayUnion(newAchievementId),
                    'stats.points': increment(achievement.points)
                });
            }
        }
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, userRef.path);
    }

  }, [unlockedAchievements, user]);

  const redeemReward = useCallback(async (cost: number) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    try {
        if (stats.points >= cost) {
            await updateDoc(userRef, {
                'stats.points': increment(-cost)
            });
        }
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, userRef.path);
    }
  }, [user, stats.points]);

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
