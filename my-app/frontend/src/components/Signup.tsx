import { Navigate } from "react-router-dom";

// Google-only auth: /signup redirects to /signin.
export const Signup = () => <Navigate to="/signin" replace />;
