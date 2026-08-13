import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User as PrismaUser } from '@shared/types';
import type { Role } from '@shared/types';
import { getMeSupabase } from '../services/authService';

interface AuthContextValue {
  user: SupabaseUser | null;
  prismaUser: PrismaUser | null;
  role: Role | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthContextProvider');
  }
  return context;
};

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [prismaUser, setPrismaUser] = useState<PrismaUser | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  // GET /api/auth/me → { user: SupabaseUser, profile: PrismaUser | null }
  // Update both the Prisma and Supababse user models
  const refreshUser = useCallback(async () => {
    try {
      const me = await getMeSupabase();
      if (!me?.user) {
        setUser(null);
        setPrismaUser(null);
        setRole(null);
        return;
      }
      setUser(me.user);
      setPrismaUser(me.profile ?? null);
      setRole(me.profile?.role ?? null);
    } catch {
      setUser(null);
      setPrismaUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user from httpOnly auth cookie on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, prismaUser, role, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
