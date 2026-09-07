import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
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
  updatePrismaUser: (patch: Partial<PrismaUser>) => void;
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
  const refreshGeneration = useRef(0);

  const refreshUser = useCallback(async () => {
    const generation = ++refreshGeneration.current;
    try {
      const me = await getMeSupabase();
      // Ignore stale /me responses during OAuth callback races.
      if (generation !== refreshGeneration.current) return;
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
      if (generation !== refreshGeneration.current) return;
      setUser(null);
      setPrismaUser(null);
      setRole(null);
    } finally {
      if (generation === refreshGeneration.current) {
        setLoading(false);
      }
    }
  }, []);

  const updatePrismaUser = useCallback((patch: Partial<PrismaUser>) => {
    setPrismaUser((previous) => (previous ? { ...previous, ...patch } : previous));
    if (patch.role !== undefined) {
      setRole(patch.role);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load session from cookie on mount
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, prismaUser, role, loading, refreshUser, updatePrismaUser }}>
      {children}
    </AuthContext.Provider>
  );
};
