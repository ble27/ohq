import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  PENDING_CONFIRM_EMAIL_KEY,
  resendConfirmation,
} from '../services/authService';

type CheckEmailLocationState = {
  email?: string;
};

export const EmailConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stateEmail = (location.state as CheckEmailLocationState | null)?.email;

  const email = useMemo(() => {
    return stateEmail ?? sessionStorage.getItem(PENDING_CONFIRM_EMAIL_KEY) ?? '';
  }, [stateEmail]);

  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);

  // Only reachable right after signup (state or sessionStorage from signup)
  useEffect(() => {
    if (!email) {
      navigate('/signup', { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (!email || countdown > 0 || resending) return;
    setError('');
    setMessage('');
    setResending(true);
    try {
      await resendConfirmation(email);
      setCountdown(60);
      setMessage('A new confirmation link has been sent!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend email');
    } finally {
      setResending(false);
    }
  };

  const goToSignIn = () => {
    sessionStorage.removeItem(PENDING_CONFIRM_EMAIL_KEY);
    navigate('/signin');
  };

  if (!email) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-black/90 px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-900/40 text-3xl">
          ✉
        </div>

        <h2 className="mb-3 text-2xl font-bold tracking-tight">
          Check your email
        </h2>

        <p className="mb-2 text-base text-gray-300">
          We sent a verification link to <br />
          <span className="break-all font-semibold text-white">{email}</span>
        </p>

        <p className="mb-8 text-sm leading-relaxed text-gray-400">
          Click the link in that email to verify your account, then sign in to get started.
        </p>

        <button
          type="button"
          onClick={() => { void handleResend(); }}
          disabled={countdown > 0 || resending}
          className={`w-full rounded-xl px-4 py-3 text-base font-semibold text-white shadow-sm transition-colors duration-200
            ${countdown > 0 || resending
              ? 'cursor-not-allowed bg-gray-600'
              : 'bg-red-900 hover:opacity-80'
            }`}
        >
          {resending
            ? 'Sending…'
            : countdown > 0
              ? `Resend email (${countdown}s)`
              : 'Resend email'}
        </button>

        {message && (
          <p className="mt-4 text-sm font-medium text-emerald-400">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 text-sm font-medium text-red-400">
            {error}
          </p>
        )}

        <div className="mt-8 border-t border-white/10 pt-6">
          <button
            type="button"
            onClick={goToSignIn}
            className="text-sm font-medium text-blue-400 hover:underline"
          >
            ← Back to sign in
          </button>
          <p className="mt-3 text-xs text-gray-500">
            Wrong email?{' '}
            <Link to="/signup" className="text-blue-400 hover:underline" onClick={() => sessionStorage.removeItem(PENDING_CONFIRM_EMAIL_KEY)}>
              Sign up again
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
