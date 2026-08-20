import { Navigate } from "react-router-dom";

// Google-only auth: /signup redirects to /signin (OAuth handles both sign-up and sign-in).
export const Signup = () => <Navigate to="/signin" replace />;

/*
// [email/password — disabled for Google-only auth]
// Previous Signup implementation preserved for reference.

import { googleSignIn, PENDING_CONFIRM_EMAIL_KEY, signUp } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContextProvider";
import { Link } from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";
import { Google } from '@lobehub/icons'
import filter from 'leo-profanity'

export const Signup = () => {
    // ... email, password, name form and handleSignup ...
};
*/
