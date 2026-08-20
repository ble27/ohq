/** Deprecated — email/password signup removed. Google OAuth only. */
import { Navigate } from 'react-router-dom';

export const EmailConfirmation = () => <Navigate to="/signin" replace />;

/*
// [email/password — disabled for Google-only auth]
// Previous EmailConfirmation implementation preserved for reference.

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  PENDING_CONFIRM_EMAIL_KEY,
  resendConfirmation,
} from '../services/authService';
// ...
*/
