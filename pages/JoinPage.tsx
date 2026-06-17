import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LandingPage from './LandingPage';

/**
 * /join — the shareable invite link (theccndaily.com/join).
 *
 * Lands a visitor on the public landing page with the sign-up form already open, so a
 * shared link drops people straight into joining. Signed-in users are sent into the app
 * instead of being asked to sign up again.
 */
const JoinPage: React.FC = () => {
  const { user, loading, openSignIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user) {
      navigate('/app/dashboard', { replace: true });
      return;
    }
    openSignIn('signup');
  }, [user, loading, openSignIn, navigate]);

  return <LandingPage />;
};

export default JoinPage;
