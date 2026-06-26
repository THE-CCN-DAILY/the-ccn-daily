import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CcnLogo from '../CcnLogo';
import type { UserRoleType } from '../../types';

interface RequireRoleProps {
  children: React.ReactNode;
  allowedRoles: UserRoleType[];
}

const RequireRole: React.FC<RequireRoleProps> = ({ children, allowedRoles }) => {
  const { user, loading, openSignIn } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-secondary px-6">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-8">
            <CcnLogo size="lg" />
          </div>
          <h1 className="font-display text-2xl font-bold text-brand-text-primary">
            Admin Studio Sign In
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-brand-text-secondary">
            This section is restricted to administrators and leaders. Please sign in to access the CommandCenter.
          </p>
          <button
            onClick={() => openSignIn()}
            className="mt-8 w-full border border-brand-accent bg-brand-accent px-6 py-3 text-sm font-semibold text-brand-secondary hover:opacity-90 transition-opacity"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  // Admin bypasses all checks
  if (user.role === 'admin') {
    return <>{children}</>;
  }

  if (!allowedRoles.includes(user.role)) {
    // If they don't have the role, redirect to sanctuary home
    return <Navigate to="/guided-journey" replace />;
  }

  return <>{children}</>;
};

export default RequireRole;
