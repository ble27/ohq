import { useEffect, useState } from "react";
import { signIn } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContextProvider";
import { LuArrowLeft } from "react-icons/lu";

export const Signin = () => {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const { user, loading, refreshUser } = useAuth();

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
        <div className="flex flex-col items-center justify-center h-screen gap-3 bg-black/90 text-white">
            <div className='w-screen max-w-[684px]'>
                <div className='absolute top-5 left-5'>
                    <LuArrowLeft 
                        onClick={() => {navigate('/')}}
                        size={25}
                        className='hover:opacity-80'    
                    />
                </div>
                
                <div className='relative shadow-inner flex flex-col 
                    w-full p-10 justify-center rounded-lg'>
                    <h1 className='items-start font-medium text-2xl mb-8'>Login</h1>
                    <div className='mb-5 flex flex-col'>
                        <label htmlFor="email" className='mb-2'>Email</label>
                        <input
                        type="email"
                        id="email"
                        placeholder="my123@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="border rounded px-2 py-2 mt-0 outline-none border-gray-500/50 border-[1.5px]"
                        />
                    </div>
                    <div className='mb-8 flex flex-col'>
                        <label htmlFor="password" className='mb-2'>Password</label>
                        <input
                        type="password"
                        placeholder="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="border rounded px-3 py-2 outline-none border-gray-500/50 border-[1.5px]"
                        />
                    </div>
                    
                    <button
                        onClick={handleSignin}
                        disabled={submitting}
                        className="bg-red-900 text-white transition-opacity duration-200 ease-in-out rounded-lg px-3 py-2 hover:opacity-80 disabled:opacity-50"
                    >
                    {submitting ? "Signing in…" : "Sign In"}
                    </button>
                    
                    {error && <p className="text-red-500">{error}</p>}
                </div>
            </div>
            
        </div>
    )
};
