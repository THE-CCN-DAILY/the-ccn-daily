import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { auth, googleProvider, signInWithPopup, firebaseSignOut, onAuthStateChanged } from '../firebase';
import type { AppUser } from '../types';
import { syncCloudflareUserProfile } from '../services/userProfileService';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { toast } from 'sonner';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = useCallback(async (firebaseUser: any): Promise<AppUser> => {
    try {
      return await syncCloudflareUserProfile(firebaseUser);
    } catch (error) {
      console.error("Cloudflare profile sync failed:", error);
      const isDefaultAdmin = firebaseUser.email === "pastor.eryeza@gmail.com";
      return {
        ...firebaseUser,
        role: isDefaultAdmin ? 'admin' : 'user',
        tier: isDefaultAdmin ? 'max' : 'free',
      } as AppUser;
    }
  }, []);

  useEffect(() => {
    // Safety timeout to prevent infinite "authenticating" hang
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
      console.warn("Auth safety timeout reached. Forcing loading to false.");
    }, 10000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(safetyTimeout);
      try {
        if (firebaseUser) {
          // Use a timeout for the profile fetch to avoid hanging the app
          const profilePromise = fetchUserRole(firebaseUser);
          const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
          
          const appUser = await Promise.race([profilePromise, timeoutPromise]);
          
          if (appUser) {
            setUser(appUser as AppUser);
          } else {
            console.warn("Profile fetch timed out after 5s, using default user data to prevent hang");
            setUser({ ...firebaseUser, role: 'user' } as AppUser);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchUserRole]);

  const signIn = useCallback(async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error during sign-in:", error);
      toast.error("Could not sign in. Please ensure popups are allowed.");
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error during sign-out:", error);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    signIn,
    signOut,
  }), [user, loading, signIn, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
