import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import {
  getAuth,
  signInWithRedirect,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  getRedirectResult,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db, signInWithEmail, signUpWithEmail, resetPassword as firebaseResetPassword } from '../firebase';
import type { AppUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  showSignIn: boolean;
  openSignIn: () => void;
  closeSignIn: () => void;
  signIn: () => void;
  signOut: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignIn, setShowSignIn] = useState(false);

  const openSignIn = useCallback(() => setShowSignIn(true), []);
  const closeSignIn = useCallback(() => setShowSignIn(false), []);

  useEffect(() => {
    const auth = getAuth();

    // Consume any pending redirect result first (no-op if no redirect in progress)
    getRedirectResult(auth).catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let role: AppUser['role'] = 'user';
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            role = (userDoc.data().role as AppUser['role']) ?? 'user';
          }
        } catch {
          // Firestore unavailable — default role is safe
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          isAnonymous: firebaseUser.isAnonymous,
          role,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(() => {
    // Always use redirect — never popup (per CLAUDE.md)
    signInWithRedirect(getAuth(), new GoogleAuthProvider());
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(getAuth()).catch(() => {});
    setUser(null);
  }, []);

  const signInEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmail(email, password);
    // onAuthStateChanged will update user state automatically
  }, []);

  const signUpEmail = useCallback(async (email: string, password: string) => {
    await signUpWithEmail(email, password);
    // onAuthStateChanged will update user state automatically
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    await firebaseResetPassword(email);
  }, []);

  const value = useMemo(
    () => ({ user, loading, showSignIn, openSignIn, closeSignIn, signIn, signOut, signInEmail, signUpEmail, sendPasswordReset }),
    [user, loading, showSignIn, openSignIn, closeSignIn, signIn, signOut, signInEmail, signUpEmail, sendPasswordReset],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
