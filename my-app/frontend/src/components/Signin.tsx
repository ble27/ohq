import { useEffect, useState } from "react";
import { PENDING_CONFIRM_EMAIL_KEY, signIn } from "../services/authService";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContextProvider";
import { LuArrowLeft } from "react-icons/lu";
import { Google } from '@lobehub/icons'
import { googleSignIn } from "../services/authService";

export const Signin = () => {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading, refreshUser } = useAuth();

    useEffect(() => {
        const message = (location.state as { message?: string } | null)?.message;
        if (message) setInfo(message);
    }, [location.state]);

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
            sessionStorage.removeItem(PENDING_CONFIRM_EMAIL_KEY);
            await refreshUser();
            navigate("/dashboard/home");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Sign in failed";
            setError(message);
        } finally {
            setSubmitting(false);
        }
    }

    
    return (
        <div className="fixed inset-0 z-0 flex flex-col items-center justify-center gap-3 bg-black/90 text-white">
            <button
                type="button"
                onClick={() => navigate('/')}
                aria-label="Back to home"
                className="absolute top-5 left-5 z-10 text-white hover:opacity-80"
            >
                <LuArrowLeft size={25} />
            </button>

            <div className="w-full max-w-[684px] px-5">
                <div className="relative flex w-full flex-col justify-center rounded-lg p-10 shadow-inner">
                    <h1 className="mb-8 items-start text-2xl font-medium"> Sign In </h1>
                    {info && <p className="mb-4 text-sm text-emerald-400">{info}</p>}
                    <div className="mb-5 flex flex-col">
                        <label htmlFor="email" className="mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            placeholder="my123@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-0 rounded border-[1.5px] border-gray-500/50 px-2 py-2 outline-none"
                        />
                    </div>
                    <div className="mb-8 flex flex-col">
                        <label htmlFor="password" className="mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="rounded border-[1.5px] border-gray-500/50 px-3 py-2 outline-none"
                        />
                    </div>

                    <div className='flex flex-col gap-3'>
                        <button
                            onClick={handleSignin}
                            disabled={submitting}
                            className="rounded-lg bg-red-900 px-3 py-2 text-white transition-opacity duration-200 ease-in-out hover:opacity-80 disabled:opacity-50"
                        >
                            {submitting ?'Signing in…' : 'Sign in'}
                        </button>

                        <span className="flex items-center justify-center"> or </span>

                        <button
                            onClick={googleSignIn}
                            disabled={submitting}
                            className="rounded-lg px-3 py-2 bg-white text-black transition-opacity duration-200 ease-in-out hover:opacity-80 disabled:opacity-50"
                        >   
                        <div className='flex flex-row items-center justify-center gap-3'>
                            <Google.Color size={20}/>
                            {submitting ? 'Signing in…' : 'Sign in with Google'}
                        </div>
                        </button>
                    </div>
                    {error && <p className="text-red-500">{error}</p>}
                </div>
            </div>
        </div>
    );
};
