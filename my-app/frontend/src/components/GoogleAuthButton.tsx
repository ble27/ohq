import { useState } from 'react';
import { Google } from '@lobehub/icons';
import { googleSignIn } from '../services/authService';

interface GoogleAuthButtonProps {
  label?: string;
  loadingLabel?: string;
  onError?: (message: string) => void;
}

export function GoogleAuthButton({
  label = 'Continue with Google',
  loadingLabel = 'Signing in…',
  onError,
}: GoogleAuthButtonProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleClick = async () => {
    setSubmitting(true);
    try {
      await googleSignIn();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      onError?.(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={submitting}
      className="rounded-lg bg-white px-3 py-2 text-black transition-opacity duration-200 ease-in-out hover:opacity-80 disabled:opacity-50"
    >
      <div className="flex flex-row items-center justify-center gap-3">
        <Google.Color size={20} />
        {submitting ? loadingLabel : label}
      </div>
    </button>
  );
}
