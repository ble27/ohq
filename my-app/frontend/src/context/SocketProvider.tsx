import { createContext, useState, useEffect, useContext, type ReactNode } from 'react'
import { supabase } from '@/services/supabase';
import { io, type Socket } from 'socket.io-client'
import { useAuth } from './AuthContextProvider';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider ({ children }: { children: ReactNode } ) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const { user, loading } = useAuth();

    useEffect(() => {
        // Only connect socket if user is signed in
        if (loading || user) {
            setSocket(null);
            return;
        }

        // Initialize connection with auth token
        const instance = io(
            import.meta.env.VITE_API_URL ?? "http://localhost:3000",
            { withCredentials: true },
        );

        setSocket(instance);

        // Cleanup socket
        return () => {
            instance.disconnect();
        }
        // Trigger when the token changes
    }, [user, loading]); 

    return (
        <SocketContext.Provider value={socket}>
            { children }
        </SocketContext.Provider>
    )
}

export const useSocket = () => useContext(SocketContext);