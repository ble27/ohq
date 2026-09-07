import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContextProvider";
import { LuArrowLeft } from "react-icons/lu";
import { GoogleAuthButton } from "./GoogleAuthButton";

export const Signin = () => {
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading } = useAuth();

    useEffect(() => {
        const message = (location.state as { message?: string } | null)?.message;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- read navigation state on mount
        if (message) setInfo(message);
    }, [location.state]);

    useEffect(() => {
        if (!loading && user) {
            navigate("/dashboard/home");
        }
    }, [user, loading, navigate]);

    return (
        <div className="fixed inset-0 z-0 flex flex-col items-center justify-center gap-3 overflow-y-auto overscroll-contain bg-black/90 text-white">
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
                    <h1 className="mb-3 items-start text-2xl font-medium">Sign in to Queueble</h1>
                    <p className="mb-8 text-sm text-gray-400">
                        Sign in with your Google account to join office-hour queues.
                    </p>
                    {info && <p className="mb-4 text-sm text-emerald-400">{info}</p>}

                    <GoogleAuthButton
                        label="Continue with Google"
                        onError={setError}
                    />

                    {error && <p className="mt-4 text-red-500">{error}</p>}
                </div>
            </div>
        </div>
    );
};
