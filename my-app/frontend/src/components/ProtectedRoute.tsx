import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContextProvider'
import { Spinner } from '@/components/ui/spinner'

interface ProtectedRouteProps {
    children: ReactNode;
}

// Guards /dashboard/* — without this, an unauthenticated visitor could load
// the dashboard shell directly and see it briefly before every data call
// fails with 401. Redirects to /signin, preserving the intended destination.
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/signin" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
