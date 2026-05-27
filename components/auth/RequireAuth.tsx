import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import CcnLogo from '../CcnLogo';

interface RequireAuthProps {
  children: React.ReactNode;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (!user) {
      setOnboardingChecked(false);
      return;
    }

    // Admins and lead_developers bypass onboarding
    if (user.role === 'admin' || user.role === 'lead_developer') {
      setOnboardingChecked(true);
      return;
    }

    let cancelled = false;

    const checkOnboarding = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!cancelled) {
          const complete = userDoc.exists() && userDoc.data()?.onboardingComplete === true;
          if (!complete) {
            navigate('/onboarding', { replace: true });
          } else {
            setOnboardingChecked(true);
          }
        }
      } catch {
        // Firestore unavailable — let them through rather than blocking
        if (!cancelled) setOnboardingChecked(true);
      }
    };

    checkOnboarding();
    return () => { cancelled = true; };
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-secondary px-6">
        <div className="w-full max-w-sm text-center">
          {/* Real brand logo */}
          <div className="flex justify-center mb-8">
            <CcnLogo size="lg" />
          </div>
          <h1 className="font-display text-2xl font-bold text-brand-text-primary">
            Sign in to continue
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-brand-text-secondary">
            This section is for members. Sign in with Google to access your devotional,
            journal, courses, and community.
          </p>
          <button
            onClick={signIn}
            className="mt-8 w-full border border-brand-accent bg-brand-accent px-6 py-3 text-sm font-semibold text-brand-secondary hover:opacity-90 transition-opacity"
          >
            Sign in with Google
          </button>
          <p className="mt-4 text-xs text-brand-text-secondary">
            No account needed — sign in once and your profile is created automatically.
          </p>
        </div>
      </div>
    );
  }

  // Waiting for onboarding check
  if (!onboardingChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-accent" />
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireAuth;
