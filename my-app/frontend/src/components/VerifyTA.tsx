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
        <div className="flex w-full h-screen m-0 p-0 overflow-hidden items-center justify-center bg-gray-500/50">
            <div className='relative flex flex-col items-center font-semibold text-black text-xl gap-2 px-5 py-10 bg-white rounded-lg h-1/5 w-1/2'>
                <div className='absolute top-5 text-lg'> Queuedex </div>
                {(!isLoading && !error) ? <div className='absolute top-15 text-base font-normal'> Click to verify your TA role </div> : 
                <div className="absolute top-15 text-base font-normal text-red-900">{error}</div>}
                <Button
                    size={'lg'}
                    variant='default'
                    onClick={() => { void handleVerification(); }}
                    className={'absolute bottom-10 bg-blue-500 hover:bg-blue-500/90'}
                    disabled={isLoading}
                >
                    {isLoading ? 'Verifying' : 'Verify'}
                </Button>

                {isLoading && <Spinner />}
            </div>
        </div>
    )
}
