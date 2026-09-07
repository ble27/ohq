/** Deprecated — email/password signup removed; redirects to sign-in. */
import { Navigate } from 'react-router-dom';

export const EmailConfirmation = () => <Navigate to="/signin" replace />;
