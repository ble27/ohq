import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PENDING_CONFIRM_EMAIL_KEY } from '../services/authService';

/**
 * Landing page for Supabase email confirmation links (emailRedirectTo).
 * After confirming, user signs in — we don't auto-set cookies from the hash here.
 */
export const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.removeItem(PENDING_CONFIRM_EMAIL_KEY);
    navigate('/signin', {
      replace: true,
      state: { message: 'Email confirmed. Please sign in.' },
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black/90 text-white">
      <p className="text-sm text-gray-300">Confirming your email…</p>
    </div>
  );
};
