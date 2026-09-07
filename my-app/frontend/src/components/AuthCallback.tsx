import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { establishSession, getMeSupabase } from '../services/authService';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/context/AuthContextProvider';

/**
 * Google OAuth callback: PKCE code → Supabase session → httpOnly cookies → dashboard.
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

      if (!code) {
        setError('No code found in the callback URL');
        return;
      }

      setStatus('Signing you in…');

      // Always exchange the OAuth code — a stale Supabase session in localStorage
      // must not override the Google account the user just selected.
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

      const session = data.session;

      if (!session) {
        setError('No session returned from OAuth');
        return;
      }

      try {
        await establishSession(session.access_token, session.refresh_token);
        // Do not call signOut here — it would revoke the session these cookies represent.

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
