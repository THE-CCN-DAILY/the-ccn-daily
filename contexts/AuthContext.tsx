import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import {
  getAuth,
  signInWithRedirect,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  getRedirectResult,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured, signInWithEmail, signUpWithEmail, resetPassword as firebaseResetPassword } from '../firebase';
import type { AppUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  showSignIn: boolean;
  redirectError: string | null;
  openSignIn: () => void;
  closeSignIn: () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Ministry owner accounts that always receive admin access on the frontend,
// keeping the UI in sync with the backend's email-based admin rule.
const ADMIN_EMAILS = ['pastor.eryeza@gmail.com', 'ccndaily@gmail.com'];

// Send the verification email at most once per page load.
let verificationSent = false;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignIn, setShowSignIn] = useState(false);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  const openSignIn = useCallback(() => setShowSignIn(true), []);
  const closeSignIn = useCallback(() => { setShowSignIn(false); setRedirectError(null); }, []);

  useEffect(() => {
    // Without Firebase config, onAuthStateChanged never fires and the app hangs on a
    // spinner forever. Resolve loading and surface a clear message instead.
    if (!isFirebaseConfigured) {
      setRedirectError('Sign-in is temporarily unavailable. Please try again later.');
      setLoading(false);
      return;
    }

    const auth = getAuth();

    // Consume any pending redirect result — surface errors instead of silently dropping them
    getRedirectResult(auth)
      .then((result) => {
        // A non-null result means a Google redirect sign-in just completed — take the
        // user into the app instead of leaving them on the public landing page.
        if (result?.user) window.location.hash = '#/app/dashboard';
      })
      .catch((err: unknown) => {
      const code = (err as { code?: string }).code ?? '';
      // auth/null-user fires on every cold load with no pending redirect — not an error
      if (code && code !== 'auth/null-user') {
        const msg =
          code === 'auth/unauthorized-domain'
            ? 'Google sign-in is not yet enabled for this domain. Use email & password for now.'
            : code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request'
            ? null // user cancelled — no message needed
            : 'Google sign-in failed. Please try again or use email & password.';
        if (msg) {
          setRedirectError(msg);
          setShowSignIn(true); // reopen modal so the user can see the error
        }
      }
    });

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

        // Ministry owner emails are always admins (frontend mirror of the
        // backend's email-based admin rule), regardless of the stored role.
        if (ADMIN_EMAILS.includes((firebaseUser.email ?? '').toLowerCase())) {
          role = 'admin';
        }

        // Admin writes require a verified email (Firestore rules). Auto-send the
        // verification link once if a ministry admin hasn't verified yet.
        if (role === 'admin' && !firebaseUser.emailVerified && !verificationSent) {
          verificationSent = true;
          sendEmailVerification(firebaseUser).catch(() => {});
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

  const signIn = useCallback(async () => {
    // Redirect (not popup): the /__/auth proxy serves Firebase's handler from our own
    // origin, so the redirect-result cookie is same-origin and reliable — and it works
    // on mobile, where popups are routinely blocked. The result is consumed by
    // getRedirectResult on the next load (see the effect above).
    setRedirectError(null);
    try {
      await signInWithRedirect(getAuth(), new GoogleAuthProvider());
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setRedirectError(
        code === 'auth/unauthorized-domain'
          ? 'Google sign-in is not enabled for this domain yet. Use email & password for now.'
          : 'Google sign-in failed. Please try again or use email & password.',
      );
      throw err;
    }
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

  // Re-read the freshest Auth profile (e.g. after a photo/name update) so the UI
  // reflects the change without a full reload.
  const refreshUser = useCallback(async () => {
    const current = getAuth().currentUser;
    if (!current) return;
    await current.reload();
    const reloaded = getAuth().currentUser;
    if (!reloaded) return;
    setUser((prev) =>
      prev
        ? { ...prev, displayName: reloaded.displayName, photoURL: reloaded.photoURL, emailVerified: reloaded.emailVerified }
        : prev,
    );
  }, []);

  const value = useMemo(
    () => ({ user, loading, showSignIn, redirectError, openSignIn, closeSignIn, signIn, signOut, signInEmail, signUpEmail, sendPasswordReset, refreshUser }),
    [user, loading, showSignIn, redirectError, openSignIn, closeSignIn, signIn, signOut, signInEmail, signUpEmail, sendPasswordReset, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
