import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRoleType } from '../../types';

interface RequireRoleProps {
  children: React.ReactNode;
  allowedRoles: UserRoleType[];
}

const RequireRole: React.FC<RequireRoleProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to pricing or home if not logged in
    return <Navigate to="/pricing" state={{ from: location }} replace />;
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
