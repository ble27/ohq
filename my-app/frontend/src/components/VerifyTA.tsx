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
                setError(response?.message ?? 'Failed to verify TA\'s status');
            }
        }
        catch (err: unknown) {
            localStorage.removeItem(TA_VERIFIED_KEY);
            const msg = 'Failed to verify TA\'s status';
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
        <div className='bg-red-900 w-screen h-screen flex flex-col items-center justify-center'>
            <div className='flex flex-col items-center font-bold justify-center text-center text-white text-xl gap-2'>
                <div> Verify your TA's status here </div>
                <Button
                    size={'lg'}
                    variant='default'
                    onClick={() => { void handleVerification(); }}
                    disabled={isLoading}
                >
                    {isLoading ? 'Verifying' : 'Verify'}
                </Button>
                {isLoading && <Spinner />}
                {error && <div className="text-sm font-normal">{error}</div>}
            </div>
        </div>
    )
}
