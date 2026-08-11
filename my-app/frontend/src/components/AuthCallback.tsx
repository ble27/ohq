import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { establishSession, PENDING_CONFIRM_EMAIL_KEY } from '../services/authService';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/context/AuthContextProvider';

/**
 * Shared landing for:
 * - Email confirmation (server signup → link with type=signup): email is already
 *   verified by Supabase before redirect; do NOT exchangeCodeForSession (no PKCE verifier).
 * - Google OAuth (client PKCE → ?code=): use session from detectSessionInUrl when
 *   present, otherwise exchange the code, then copy tokens into httpOnly cookies.
 */
export const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Working…');
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const handleAuth = async () => {
      const code = searchParams.get('code');
      const type = searchParams.get('type');
      const tokenHash = searchParams.get('token_hash');

      // Email confirmation via custom template: ?token_hash=...&type=signup
      if (tokenHash && type) {
        setStatus('Confirming your email…');
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as 'signup' | 'email' | 'invite' | 'magiclink' | 'recovery' | 'email_change',
        });
        if (otpError) {
          setError(otpError.message);
          return;
        }
        await supabase.auth.signOut();
        sessionStorage.removeItem(PENDING_CONFIRM_EMAIL_KEY);
        navigate('/signin', {
          replace: true,
          state: { message: 'Email confirmed. Please sign in' },
        });
        return;
      }

      // Email confirmation via default Supabase link → redirect with ?code=&type=signup
      // Clicking the link already confirmed the email; skip PKCE exchange (no browser verifier).
      if (type === 'signup' || type === 'email') {
        setStatus('Confirming your email…');
        sessionStorage.removeItem(PENDING_CONFIRM_EMAIL_KEY);
        navigate('/signin', {
          replace: true,
          state: { message: 'Email confirmed. Please sign in' },
        });
        return;
      }

      if (!code) {
        setError('No code found in the callback URL');
        return;
      }

      // OAuth (Google): supabase-js detectSessionInUrl often exchanges first;
      // only call exchangeCodeForSession if that did not already produce a session.
      setStatus('Signing you in…');

      const { data: existingSessionData } = await supabase.auth.getSession();
      let session = existingSessionData.session;

      // Exchange code only if there are no sessions
      if (!session) {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
        session = data.session;
      }

      if (!session) {
        setError('No session returned from OAuth');
        return;
      }

      // Persist httpOnly cookies for the Express API
      try {
        await establishSession(session.access_token, session.refresh_token);
        await refreshUser();
        navigate('/dashboard/home', { replace: true });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to establish session');
      }
    };

    handleAuth();
  }, [searchParams, navigate, refreshUser]);

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <p className="text-red-600">{error}</p>
        <button onClick={() => navigate('/signin')} className="mt-4 underline">
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black/90 text-white">
      <p className="text-sm text-gray-300">{status}</p>
    </div>
  );
};
