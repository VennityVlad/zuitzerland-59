
import { createContext, useContext, ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { SupabaseClient } from '@supabase/supabase-js';

interface SupabaseJwtContextType {
  authenticatedSupabase: SupabaseClient | null;
  loading: boolean;
  error: string | null;
  refreshJwt: () => Promise<any>;
  isAuthenticated: boolean;
}

const SupabaseJwtContext = createContext<SupabaseJwtContextType | undefined>(undefined);

export const SupabaseJwtProvider = ({ children }: { children: ReactNode }) => {
  const { authenticated, user } = usePrivy();
  const { supabase, loading, error, refreshJwt, isAuthenticated } = useAuthenticatedSupabase();
  
  return (
    <SupabaseJwtContext.Provider 
      value={{ 
        authenticatedSupabase: supabase,
        loading,
        error,
        refreshJwt,
        isAuthenticated,
      }}
    >
      {children}
    </SupabaseJwtContext.Provider>
  );
};

export const useSupabaseJwt = () => {
  const context = useContext(SupabaseJwtContext);
  if (context === undefined) {
    throw new Error('useSupabaseJwt must be used within a SupabaseJwtProvider');
  }
  return context;
};
