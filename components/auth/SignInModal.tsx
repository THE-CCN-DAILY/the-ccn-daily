/**
 * SignInModal — supports Google sign-in and email/password (sign-in + sign-up + reset).
 * Opened via AuthContext.openSignIn() / closed automatically after successful auth.
 */
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';

type AuthTab = 'google' | 'email';
type EmailMode = 'signin' | 'signup' | 'reset';

const ease = [0.22, 1, 0.36, 1] as const;

const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335" />
  </svg>
);

const SignInModal: React.FC = () => {
  const { showSignIn, closeSignIn, signIn, signInEmail, signUpEmail, sendPasswordReset, loading } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthTab>('email');
  const [emailMode, setEmailMode] = useState<EmailMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setResetEmail('');
    setResetSent(false);
    setEmailMode('signin');
    setActiveTab('email');
  };

  const handleClose = () => {
    reset();
    closeSignIn();
  };

  const handleGoogleSignIn = async () => {
    setError('');
    await signIn();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (emailMode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setIsSubmitting(false);
          return;
        }
        await signUpEmail(email, password);
      } else {
        await signInEmail(email, password);
      }
      // Modal auto-closes via onAuthStateChanged → closeSignIn()
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendPasswordReset(resetEmail);
    setResetSent(true);
  };

  if (!showSignIn) return null;

  return (
    <AnimatePresence>
      {showSignIn && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-md rounded-2xl border border-on-surface/12 bg-surface shadow-2xl overflow-hidden"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.35, ease }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-on-surface/40 transition-colors hover:bg-surface-high hover:text-on-surface"
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="p-8">
                {/* Logo */}
                <div className="mb-6 flex flex-col items-center">
                  <img
                    src="/brand/flame.svg"
                    alt="THE CCN DAILY"
                    className="mb-3 h-10 w-10 object-contain"
                  />
                  <p className="text-[11px] font-display uppercase tracking-[0.18em] text-primary-brand">
                    THE CCN DAILY
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-semibold text-on-surface">
                    {emailMode === 'reset' ? 'Reset your password' : emailMode === 'signup' ? 'Create an account' : 'Sign in'}
                  </h2>
                </div>

                {emailMode !== 'reset' && (
                  <>
                    {/* Tab switcher */}
                    <div className="mb-6 flex gap-1 rounded-xl bg-surface-high p-1">
                      <button
                        type="button"
                        onClick={() => { setActiveTab('email'); setError(''); }}
                        className={`flex-1 rounded-lg py-2.5 text-sm font-display font-semibold transition-colors ${
                          activeTab === 'email'
                            ? 'bg-surface text-on-surface shadow-sm'
                            : 'text-on-surface/50 hover:text-on-surface'
                        }`}
                      >
                        Email
                      </button>
                      <button
                        type="button"
                        onClick={() => { setActiveTab('google'); setError(''); }}
                        className={`flex-1 rounded-lg py-2.5 text-sm font-display font-semibold transition-colors ${
                          activeTab === 'google'
                            ? 'bg-surface text-on-surface shadow-sm'
                            : 'text-on-surface/50 hover:text-on-surface'
                        }`}
                      >
                        Google
                      </button>
                    </div>

                    {activeTab === 'google' && (
                      <div className="space-y-4">
                        <button
                          type="button"
                          onClick={handleGoogleSignIn}
                          disabled={loading}
                          className="flex w-full items-center justify-center gap-3 rounded-xl border border-on-surface/15 bg-surface py-3.5 font-display text-sm font-semibold text-on-surface transition-all hover:bg-surface-high disabled:opacity-60"
                        >
                          <GoogleIcon className="h-5 w-5" />
                          Continue with Google
                        </button>
                        <p className="text-center text-xs text-on-surface/40 font-display">
                          Your Google account is used only for sign-in.
                        </p>
                      </div>
                    )}

                    {activeTab === 'email' && (
                      <form onSubmit={handleEmailSubmit} className="space-y-4">
                        <input
                          type="email"
                          placeholder="Email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoFocus
                          className="w-full rounded-xl border border-on-surface/12 bg-bg px-4 py-3.5 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface/35 focus:border-primary-brand/60"
                        />
                        <input
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          className="w-full rounded-xl border border-on-surface/12 bg-bg px-4 py-3.5 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface/35 focus:border-primary-brand/60"
                        />
                        {emailMode === 'signup' && (
                          <input
                            type="password"
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full rounded-xl border border-on-surface/12 bg-bg px-4 py-3.5 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface/35 focus:border-primary-brand/60"
                          />
                        )}

                        <AnimatePresence>
                          {error && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-500"
                            >
                              {error}
                            </motion.p>
                          )}
                        </AnimatePresence>

                        <button
                          type="submit"
                          disabled={isSubmitting || loading}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-brand py-3.5 font-display text-sm font-semibold text-on-primary-brand transition-all hover:bg-primary-brand/90 disabled:opacity-60"
                        >
                          {isSubmitting ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary-brand/30 border-t-on-primary-brand" />
                          ) : emailMode === 'signup' ? 'Create account' : 'Sign in'}
                        </button>

                        <div className="flex items-center justify-between text-xs font-display text-on-surface/50">
                          {emailMode === 'signin' ? (
                            <>
                              <button type="button" onClick={() => { setEmailMode('signup'); setError(''); }} className="transition-colors hover:text-primary-brand">
                                Create account
                              </button>
                              <button type="button" onClick={() => { setEmailMode('reset'); setError(''); }} className="transition-colors hover:text-primary-brand">
                                Forgot password?
                              </button>
                            </>
                          ) : (
                            <button type="button" onClick={() => { setEmailMode('signin'); setError(''); }} className="transition-colors hover:text-primary-brand">
                              ← Back to sign in
                            </button>
                          )}
                        </div>
                      </form>
                    )}
                  </>
                )}

                {/* Password reset flow */}
                {emailMode === 'reset' && (
                  <div>
                    {resetSent ? (
                      <div className="space-y-4 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                          <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-sm text-on-surface/70 font-display">
                          If an account with that email exists, a reset link has been sent. Check your inbox.
                        </p>
                        <button
                          type="button"
                          onClick={() => { setEmailMode('signin'); setResetSent(false); setActiveTab('email'); }}
                          className="font-display text-sm text-primary-brand transition-colors hover:text-primary-brand/80"
                        >
                          Back to sign in
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleReset} className="space-y-4">
                        <p className="text-sm text-on-surface/60 font-display">
                          Enter your email and we'll send you a link to reset your password.
                        </p>
                        <input
                          type="email"
                          placeholder="Email address"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                          autoFocus
                          className="w-full rounded-xl border border-on-surface/12 bg-bg px-4 py-3.5 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface/35 focus:border-primary-brand/60"
                        />
                        <button
                          type="submit"
                          className="flex w-full items-center justify-center rounded-xl bg-primary-brand py-3.5 font-display text-sm font-semibold text-on-primary-brand transition-all hover:bg-primary-brand/90"
                        >
                          Send reset link
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEmailMode('signin'); setActiveTab('email'); }}
                          className="block w-full text-center font-display text-xs text-on-surface/50 transition-colors hover:text-primary-brand"
                        >
                          ← Back to sign in
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SignInModal;
