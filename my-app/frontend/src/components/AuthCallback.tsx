import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { establishSession, getMeSupabase } from '../services/authService';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/context/AuthContextProvider';

/**
 * Google OAuth callback: PKCE code → Supabase session → httpOnly cookies → dashboard.
 *
 * [email/password — disabled for Google-only auth]
 * Email confirmation branches (token_hash, type=signup) are commented out below.
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
      // const type = searchParams.get('type');
      // const tokenHash = searchParams.get('token_hash');

      /*
      // [email/password — disabled for Google-only auth]
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

      if (type === 'signup' || type === 'email') {
        setStatus('Confirming your email…');
        sessionStorage.removeItem(PENDING_CONFIRM_EMAIL_KEY);
        navigate('/signin', {
          replace: true,
          state: { message: 'Email confirmed. Please sign in' },
        });
        return;
      }
      */

      if (!code) {
        setError('No code found in the callback URL');
        return;
      }

      setStatus('Signing you in…');

      const { data: existingSessionData } = await supabase.auth.getSession();
      let session = existingSessionData.session;

      if (!session) {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          const msg = exchangeError.message.toLowerCase();
          if (msg.includes('pkce') || msg.includes('code verifier') || msg.includes('flow state')) {
            setError(
              'Sign-in could not be completed — the link may have expired, or you started on www.queueble.app but returned on queueble.app (or vice versa). Open Log In on queueble.app and try again.',
            );
          } else if (msg.includes('already been used') || msg.includes('invalid grant')) {
            setError('This sign-in link was already used. Please start again from Log In.');
          } else {
            setError(exchangeError.message);
          }
          return;
        }
        session = data.session;
      }

      if (!session) {
        setError('No session returned from OAuth');
        return;
      }

      try {
        await establishSession(session.access_token, session.refresh_token);
        // Do not call signOut here: even scope='local' revokes the current
        // Supabase Auth session that these httpOnly cookies represent.

        // Confirm httpOnly cookies actually stuck before leaving this page —
        // previously we navigated to /dashboard even when /me returned 401,
        // which bounced users back to /signin and felt like a failed login.
        const me = await getMeSupabase();
        if (!me?.user) {
          setError(
            'Google sign-in succeeded but the app session could not be saved. Ensure cookies are enabled for queueble.app, then try again.',
          );
          return;
        }

        await refreshUser();
        navigate('/dashboard/home', { replace: true });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to establish session');
      }
    };

    void handleAuth();
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
