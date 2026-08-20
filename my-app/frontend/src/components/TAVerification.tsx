import { useState, useEffect, type ReactNode } from 'react'
import { useAuth } from '@/context/AuthContextProvider'
import { verifyTA } from '@/services/authQueueManager';
import { Button } from './ui/button';
import { Spinner } from "@/components/ui/spinner"

const TA_VERIFIED_KEY = 'ta-verified-id';

interface VerifyTAProps {
    children: ReactNode;
}

export const VerifyTA = ({ children }: VerifyTAProps) => {
    const { user, role } = useAuth();
    const [isTA, setIsTA] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Reverify status if role or user id changes
    useEffect(() => {
        if (!user?.id || role != 'TA') {
            setIsTA(false);
            return;
        }
        const verifiedId = localStorage.getItem(TA_VERIFIED_KEY);
        setIsTA(verifiedId === user.id);
    }, [user?.id, role]);

    const handleVerification = async () => {
        const id = user?.id as string;

        setIsLoading(true);
        setError(null);
        try {
            const response = await verifyTA(id);
            if (response?.status === 200) {
                localStorage.setItem(TA_VERIFIED_KEY, id);
                setIsTA(true);
            } else {
                localStorage.removeItem(TA_VERIFIED_KEY);
                setError(response?.message ?? 'Access authorized to TAs only');
            }
        }
        catch (err: unknown) {
            localStorage.removeItem(TA_VERIFIED_KEY);
            const msg = 'Access authorized to TAs only';
            setError(msg);
            console.log(msg, err);
        } finally {
            setIsLoading(false);
        }
    }

    if (isTA) {
        return <>{children}</>;
    }

    return (
        // Background
        <div className="flex min-h-screen m-0 p-0 overflow-hidden items-center justify-center">
            <div className='relative flex flex-col items-center font-semibold text-black text-xl gap-2 px-6 py-8 bg-neutral-100 border border-black/50 rounded-lg w-[300px] max-w-[684px]'>
                {(!isLoading && !error) ? <h1 className='text-base font-medium text-center'> Are you a TA?<br/>Click here to manage queues</h1> : 
                <div className="text-base font-normal text-red-900">{error}</div>}
                <button
                    className='transition duration-300 ease-in-out rounded-full border-2 border-green-800
                            hover:bg-green-800 hover:text-white hover:bg-green-800 text-green-800
                            px-2 py-1 text-base'
                    onClick={() => { void handleVerification() } }
                    disabled={isLoading}>
                    {isLoading ? 'Verifying' : 'Verify'}
                </button>
                {isLoading && <Spinner />}
            </div>
        </div>
    )
}
