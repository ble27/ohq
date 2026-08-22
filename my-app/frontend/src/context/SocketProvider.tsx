import { createContext, useState, useEffect, useContext, type ReactNode } from 'react'
import { io, type Socket } from 'socket.io-client'
import axios from 'axios'
import { useAuth } from './AuthContextProvider';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider ({ children }: { children: ReactNode } ) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const { user, loading } = useAuth();
    
    useEffect(() => {
        // Only connect socket if user is signed in
        if (loading || !user) {
            return;
        }

        let cancelled = false;
        let instance: Socket | null = null;

        const connect = async () => {
            try {
                // Same-origin /api (Vercel proxy) — cookies available here.
                const { data } = await axios.get<{ token: string }>('/api/auth/socket-token', {
                    withCredentials: true,
                });
                if (cancelled || !data.token) return;

                // WebSockets still talk to Render directly.
                instance = io(
                    import.meta.env.VITE_API_URL ?? "http://localhost:3000",
                    {
                        withCredentials: true,
                        auth: { token: data.token },
                    },
                );
                if (cancelled) {
                    instance.disconnect();
                    return;
                }
                setSocket(instance);
            } catch (error) {
                console.error('[SOCKET] failed to connect:', error);
            }
        };

        void connect();

        return () => {
            cancelled = true;
            instance?.disconnect();
            setSocket(null);
        };
    }, [user, loading]); 

    return (
        <SocketContext.Provider value={user ? socket : null}>
            { children }
        </SocketContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => useContext(SocketContext);
