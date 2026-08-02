import { useEffect, useState } from "react";
import { signUp } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContextProvider";
import { Link } from "react-router-dom";

export const Signup = () => {
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

    const handleSignup = async () => {
        setSubmitting(true);
        try {
            await signUp(email, password);
            navigate('/dashboard/home');

        } catch(error: unknown) {
            const message = error instanceof Error ? error.message : 'Sign up failed';
            setError(message);
            console.log(`Failed to signup ${error}`);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
        <div className="h-screen gap-3 bg-black/70">
            <div className='flex flex-col absolute inset-0 m-auto items-center justify-center w-100 h-100 bg-white border-2 border-gray-300 rounded-xl shadow-md'>
                <h1 className='text-xl text-black'>Sign Up</h1>
                <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="border rounded px-3 py-2 mb-2"
                />
                <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="border rounded px-3 py-2 mb-2"
                />
                <button
                onClick={handleSignup}
                disabled={submitting}
                className="bg-black text-white rounded-lg px-3 py-2 hover:opacity-80 disabled:opacity-50"
                >
                {submitting ? "Signing up…" : "Sign Up"}
                </button>
                <div className='absolute bottom-2'> Already have an account? <Link to='/signin' className='text-blue-500 underline'>Sign In</Link></div>
                {error && <p className="text-red-500">{error}</p>}
            </div>
        </div>
        </>    
    )
}