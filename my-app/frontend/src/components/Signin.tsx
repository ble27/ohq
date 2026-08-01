import { useEffect, useState } from "react";
import { signIn } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContextProvider";

export const Signin = () => {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && user) {
            navigate("/dashboard/home");
        }
    }, [user, loading, navigate]);

    const handleSignin = async () => {
        setError("");
        setSubmitting(true);
        try {
            await signIn(email, password);
            navigate("/dashboard/home");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Sign in failed";
            setError(message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen gap-3 bg-gray-50">
            <h1>Sign In</h1>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <button
              onClick={handleSignin}
              disabled={submitting}
              className="bg-black text-white rounded-full px-3 py-2 hover:opacity-80 disabled:opacity-50"
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
            {error && <p className="text-red-500">{error}</p>}
        </div>
    )
};
