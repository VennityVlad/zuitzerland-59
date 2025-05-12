
import { createContext, useContext, ReactNode, useEffect } from 'react';
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
  
  // Add debug logging
  useEffect(() => {
    console.log("[SupabaseJwtProvider] Provider state:", {
      privyAuthenticated: authenticated,
      privyUserId: user?.id,
      supabaseAuthenticated: isAuthenticated,
      loading,
      hasError: !!error
    });
  }, [authenticated, user, isAuthenticated, loading, error]);

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

  // Add debug call to trace when this hook is being used
  console.log("[useSupabaseJwt] Hook used with state:", {
    isAuthenticated: context.isAuthenticated,
    loading: context.loading,
    hasError: !!context.error
  });
  
  return context;
};
