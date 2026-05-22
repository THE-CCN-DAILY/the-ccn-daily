import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import {
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../firebase';
import { db } from '../firebase';
import type { AppUser, UserRoleType } from '../types';
import type { SubscriptionTier } from '../types/pricing';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function buildAppUser(firebaseUser: FirebaseUser, role: UserRoleType, tier: SubscriptionTier): AppUser {
  return {
    uid: firebaseUser.uid,
    id: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified,
    isAnonymous: firebaseUser.isAnonymous,
    role,
    tier,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle the redirect result that fires when Google redirects back to the app
    getRedirectResult(auth).catch(() => {
      // No redirect result available — normal on non-redirect page loads
    });

    // Listen for auth state changes (covers both redirect return and existing sessions)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            const role: UserRoleType = data.role ?? 'user';
            const tier: SubscriptionTier = data.tier ?? 'free';
            setUser(buildAppUser(firebaseUser, role, tier));
          } else {
            // New user — create profile with default role
            const newAppUser = buildAppUser(firebaseUser, 'user', 'free');
            await setDoc(userRef, {
              ...newAppUser,
              createdAt: new Date().toISOString(),
            });
            setUser(newAppUser);
          }
        } catch {
          // Firestore unavailable — set minimal user so the app stays functional
          setUser(buildAppUser(firebaseUser, 'user', 'free'));
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(() => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    signInWithRedirect(auth, provider);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading, signIn, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
