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
  const { showSignIn, closeSignIn, signIn, signInEmail, signUpEmail, sendPasswordReset, loading, redirectError } = useAuth();

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
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setError(
        msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')
          ? 'Invalid email or password.'
          : msg.includes('email-already-in-use')
          ? 'An account with this email already exists.'
          : msg.includes('weak-password')
          ? 'Password must be at least 6 characters.'
          : 'Something went wrong. Please try again.',
      );
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

  const inputClass =
    'w-full rounded-lg border border-brand-border bg-brand-secondary px-4 py-3 text-sm text-brand-text-primary outline-none transition-colors placeholder:text-brand-text-secondary/50 focus:border-brand-accent/70';

  return (
    <AnimatePresence>
      {showSignIn && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-md overflow-hidden border border-brand-border bg-brand-dark shadow-2xl sm:rounded-2xl"
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.38, ease }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top accent bar */}
              <div className="h-0.5 w-full bg-brand-accent" />

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-brand-text-secondary transition-colors hover:bg-brand-secondary hover:text-brand-text-primary"
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="px-8 py-8 pb-10">
                {/* Logo + brand */}
                <div className="mb-7 flex flex-col items-center">
                  <img
                    src="/flame-transparent.png"
                    alt="THE CCN DAILY"
                    className="mb-3 h-14 w-14 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <p className="text-[10px] font-display font-bold uppercase tracking-[0.22em] text-brand-accent">
                    THE CCN DAILY
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-bold text-brand-text-primary">
                    {emailMode === 'reset'
                      ? 'Reset password'
                      : emailMode === 'signup'
                      ? 'Create account'
                      : 'Sign in'}
                  </h2>
                  {emailMode === 'signin' && (
                    <p className="mt-1 text-xs text-brand-text-secondary text-center">
                      Sign in once — your profile is created automatically.
                    </p>
                  )}
                </div>

                {emailMode !== 'reset' && (
                  <>
                    {/* Tab switcher */}
                    <div className="mb-6 flex gap-1 rounded-lg bg-brand-secondary p-1">
                      <button
                        type="button"
                        onClick={() => { setActiveTab('email'); setError(''); }}
                        className={`flex-1 rounded-md py-2 text-sm font-display font-semibold transition-colors ${
                          activeTab === 'email'
                            ? 'bg-brand-dark text-brand-text-primary shadow-sm'
                            : 'text-brand-text-secondary hover:text-brand-text-primary'
                        }`}
                      >
                        Email
                      </button>
                      <button
                        type="button"
                        onClick={() => { setActiveTab('google'); setError(''); }}
                        className={`flex-1 rounded-md py-2 text-sm font-display font-semibold transition-colors ${
                          activeTab === 'google'
                            ? 'bg-brand-dark text-brand-text-primary shadow-sm'
                            : 'text-brand-text-secondary hover:text-brand-text-primary'
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
                          className="flex w-full items-center justify-center gap-3 rounded-lg border border-brand-border bg-brand-secondary py-3.5 font-display text-sm font-semibold text-brand-text-primary transition-all hover:border-brand-accent/40 hover:bg-brand-dark disabled:opacity-60"
                        >
                          <GoogleIcon className="h-5 w-5" />
                          Continue with Google
                        </button>

                        <AnimatePresence>
                          {(error || redirectError) && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400"
                            >
                              {redirectError || error}
                            </motion.p>
                          )}
                        </AnimatePresence>

                        <p className="text-center text-xs text-brand-text-secondary">
                          Your Google account is used only for sign-in.
                        </p>
                      </div>
                    )}

                    {activeTab === 'email' && (
                      <form onSubmit={handleEmailSubmit} className="space-y-3">
                        <input
                          type="email"
                          placeholder="Email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoFocus
                          className={inputClass}
                        />
                        <input
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          className={inputClass}
                        />
                        {emailMode === 'signup' && (
                          <input
                            type="password"
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className={inputClass}
                          />
                        )}

                        <AnimatePresence>
                          {error && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400"
                            >
                              {error}
                            </motion.p>
                          )}
                        </AnimatePresence>

                        <button
                          type="submit"
                          disabled={isSubmitting || loading}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent py-3.5 font-display text-sm font-semibold text-white transition-all hover:bg-brand-accent/90 disabled:opacity-60"
                        >
                          {isSubmitting ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          ) : emailMode === 'signup' ? 'Create account' : 'Sign in'}
                        </button>

                        <div className="flex items-center justify-between pt-1 text-xs font-display text-brand-text-secondary">
                          {emailMode === 'signin' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => { setEmailMode('signup'); setError(''); }}
                                className="transition-colors hover:text-brand-accent"
                              >
                                Create account
                              </button>
                              <button
                                type="button"
                                onClick={() => { setEmailMode('reset'); setError(''); }}
                                className="transition-colors hover:text-brand-accent"
                              >
                                Forgot password?
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { setEmailMode('signin'); setError(''); }}
                              className="transition-colors hover:text-brand-accent"
                            >
                              Back to sign in
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
                        <p className="text-sm text-brand-text-secondary">
                          If an account with that email exists, a reset link has been sent. Check your inbox.
                        </p>
                        <button
                          type="button"
                          onClick={() => { setEmailMode('signin'); setResetSent(false); setActiveTab('email'); }}
                          className="text-sm text-brand-accent transition-colors hover:text-brand-accent/80"
                        >
                          Back to sign in
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleReset} className="space-y-4">
                        <p className="text-sm text-brand-text-secondary">
                          Enter your email and we will send you a link to reset your password.
                        </p>
                        <input
                          type="email"
                          placeholder="Email address"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                          autoFocus
                          className={inputClass}
                        />
                        <button
                          type="submit"
                          className="flex w-full items-center justify-center rounded-lg bg-brand-accent py-3.5 font-display text-sm font-semibold text-white transition-all hover:bg-brand-accent/90"
                        >
                          Send reset link
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEmailMode('signin'); setActiveTab('email'); }}
                          className="block w-full text-center text-xs text-brand-text-secondary transition-colors hover:text-brand-accent"
                        >
                          Back to sign in
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
