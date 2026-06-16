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
import type { SubscriptionTier } from '../types/pricing';
import { getUserSubscription } from '../services/purchaseService';

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

/**
 * Sync the signed-in Firebase user into the D1 `users` table and read back the
 * authoritative role. D1 `users.role` is the single source of truth for authority
 * (see the worker's isAdminRequest), so the UI must hydrate role from here rather
 * than from Firestore. The POST upserts the row (preserving any promoted role on
 * conflict) and returns it. Returns null if the sync fails, in which case callers
 * fall back to the Firestore role + the founder allowlist.
 */
const syncD1Profile = async (
  firebaseUser: import('firebase/auth').User,
): Promise<{ role: AppUser['role']; tier: SubscriptionTier } | null> => {
  try {
    const token = await firebaseUser.getIdToken();
    const res = await fetch('/api/auth/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.user?.role) return null;
    return { role: data.user.role as AppUser['role'], tier: (data.user.tier as SubscriptionTier) ?? 'free' };
  } catch {
    return null;
  }
};

const readTrustedTier = async (
  userId: string,
  fallbackTier: SubscriptionTier,
  role: AppUser['role'],
): Promise<SubscriptionTier> => {
  if (role === 'admin' || role === 'lead_developer') return 'max';
  try {
    const subscription = await getUserSubscription(userId);
    return subscription.status === 'active' ? subscription.tier : 'free';
  } catch {
    return fallbackTier;
  }
};

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
        let storedTier: SubscriptionTier = 'free';

        // Authoritative role comes from D1 (single source of truth). This call also
        // ensures the D1 users row exists so admin/role management sees every member.
        const d1Profile = await syncD1Profile(firebaseUser);
        if (d1Profile) {
          role = d1Profile.role ?? 'user';
          storedTier = d1Profile.tier ?? 'free';
        } else {
          // D1 unreachable — fall back to the legacy Firestore role so the UI still works.
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              role = (data.role as AppUser['role']) ?? 'user';
              storedTier = (data.tier as SubscriptionTier) ?? 'free';
            }
          } catch {
            // Firestore unavailable — default role is safe
          }
        }

        // Ministry owner emails are always admins (bootstrap super-admin: the un-removable
        // founder fallback that mirrors the worker's allowlist), regardless of stored role.
        if (ADMIN_EMAILS.includes((firebaseUser.email ?? '').toLowerCase())) {
          role = 'admin';
        }

        // Admin writes require a verified email (Firestore rules). Auto-send the
        // verification link once if a ministry admin hasn't verified yet.
        if (role === 'admin' && !firebaseUser.emailVerified && !verificationSent) {
          verificationSent = true;
          sendEmailVerification(firebaseUser).catch(() => {});
        }

        const tier = await readTrustedTier(firebaseUser.uid, storedTier, role);

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          isAnonymous: firebaseUser.isAnonymous,
          role,
          tier,
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
    const tier = await readTrustedTier(reloaded.uid, (user?.tier as SubscriptionTier) || 'free', user?.role || 'user');
    setUser((prev) =>
      prev
        ? { ...prev, displayName: reloaded.displayName, photoURL: reloaded.photoURL, emailVerified: reloaded.emailVerified, tier }
        : prev,
    );
  }, [user?.role, user?.tier]);

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
