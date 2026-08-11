import { useEffect, useState } from "react";
import { googleSignIn, PENDING_CONFIRM_EMAIL_KEY, signUp } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContextProvider";
import { Link } from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";
import { Google } from '@lobehub/icons'
import filter from 'leo-profanity'

export const Signup = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const { user, loading, refreshUser } = useAuth();

    useEffect(() => {
        if (!loading && user) {
            navigate("/dashboard/home");
        }
    }, [user, loading, navigate]);

    const handleSignup = async () => {
        setError("");
        setSubmitting(true);
        try {
            if (filter.check(name)) {
                alert('Please remove inappropriate language from Full Name field');
                return;
            }
            const result = await signUp(email, password, name);

            if (result.needsConfirmation) {
                const confirmEmail = result.email || email;
                sessionStorage.setItem(PENDING_CONFIRM_EMAIL_KEY, confirmEmail);
                // Attach state which can be extracted via location.state
                navigate('/check-email', { state: { email: confirmEmail } });
                return;
            }

            // Confirm-email disabled in Supabase — cookies already set by signup
            await refreshUser();
            navigate('/dashboard/home');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Sign up failed';
            setError(message);
            console.log(`Failed to signup ${error}`);
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
                    <h1 className="mb-8 items-start text-2xl font-medium">Create your account today</h1>
                    <div className="mb-5 flex flex-col">
                        <label htmlFor="full_name" className="mb-2">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="full_name"
                            placeholder="First Last"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-0 rounded border-[1.5px] border-gray-500/50 px-2 py-2 outline-none"
                        />
                    </div>

                    <div className="mb-5 flex flex-col">
                        <label htmlFor="email" className="mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            placeholder="johndoe@email.com"
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
                            onClick={handleSignup}
                            disabled={submitting}
                            className="rounded-lg bg-red-900 px-3 py-2 text-white transition-opacity duration-200 ease-in-out hover:opacity-80 disabled:opacity-50"
                        >
                            {submitting ? 'Signing up…' : 'Sign Up'}
                        </button>
                        <span className='flex flex-row justify-center'> or </span>
                        <button
                            onClick={googleSignIn}
                            disabled={submitting}
                            className="rounded-lg bg-white text-black px-3 py-2 transition-opacity duration-200 ease-in-out hover:opacity-80 disabled:opacity-50"
                        >
                            <div className="flex flex-row gap-3 items-center justify-center">
                                <Google.Color size={20} />
                                {submitting ? 'Signing up…' : 'Continue with Google'}
                            </div>
                            
                        </button>

                        <div className="mt-8 flex justify-center">
                            Already have an account?{' '}
                            <Link to="/signin" className="ml-1 text-blue-500 hover:underline">
                                Sign in here
                            </Link>
                        </div>
                    </div>
                    {error && <p className="text-red-500">{error}</p>}
                </div>
            </div>
        </div>
    );
};
