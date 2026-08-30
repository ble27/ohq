import { createContext, useState, useEffect, useContext, type ReactNode } from 'react'
import { io, type Socket } from 'socket.io-client'
import axios from 'axios'
import { useAuth } from './AuthContextProvider';

const SocketContext = createContext<Socket | null>(null);

/** Dev: same-origin (Vite proxies /socket.io). Prod: Render host (Vercel has no WS proxy). */
function getSocketServerUrl() {
    if (import.meta.env.DEV) {
        return window.location.origin;
    }
    return import.meta.env.VITE_API_URL ?? window.location.origin;
}

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

                if (instance) {
                    instance.auth = { token: data.token };
                    if (!instance.connected) {
                        instance.connect();
                    }
                    return;
                }

                instance = io(getSocketServerUrl(), {
                    withCredentials: true,
                    auth: { token: data.token },
                });
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

        const onVisibilityChange = () => {
            if (document.visibilityState !== 'visible' || cancelled) return;
            if (!instance?.connected) {
                void connect();
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            cancelled = true;
            document.removeEventListener('visibilitychange', onVisibilityChange);
            instance?.disconnect();
            setSocket(null);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reconnect only when user id changes, not on refreshUser reference churn
    }, [user?.id, loading]);

    return (
        <SocketContext.Provider value={user ? socket : null}>
            { children }
        </SocketContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => useContext(SocketContext);
