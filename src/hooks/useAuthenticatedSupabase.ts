
import { useState, useEffect, useCallback } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { usePrivy } from '@privy-io/react-auth';
import { useToast } from './use-toast';

import { config } from '@/lib/config';

const SUPABASE_URL = config.supabase.url;
const SUPABASE_PUBLISHABLE_KEY = config.supabase.anonKey;

interface JwtData {
  jwt: string;
  expiresAt: number; // Timestamp in milliseconds
}

export const useAuthenticatedSupabase = () => {
  const { user, authenticated, ready } = usePrivy();
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const [jwtData, setJwtData] = useState<JwtData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  console.log("[useAuthenticatedSupabase] Hook initialized with:", {
    privyAuthenticated: authenticated,
    privyUserId: user?.id,
    ready,
    hasJwtData: !!jwtData,
    supabaseAuthenticated: isAuthenticated
  });

  const refreshJwt = useCallback(async () => {
    if (!authenticated || !user?.id) {
      console.log("[useAuthenticatedSupabase] Cannot refresh JWT - not authenticated or no user ID");
      setJwtData(null);
      setIsAuthenticated(false);
      return;
    }

    try {
      console.log("[useAuthenticatedSupabase] Fetching new Supabase JWT for Privy user:", user.id);
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-supabase-jwt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ privyUserId: user.id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[useAuthenticatedSupabase] JWT refresh failed - response not OK:", errorData);
        throw new Error(errorData.error || 'Failed to refresh JWT');
      }

      const newJwtData = await response.json();
      console.log("[useAuthenticatedSupabase] New JWT received:", {
        expiresAt: new Date(newJwtData.expiresAt).toISOString(),
        jwtPreview: newJwtData.jwt.substring(0, 20) + '...',
      });

      // Try to parse JWT payload for debugging
      try {
        const [, payloadBase64] = newJwtData.jwt.split('.');
        const payload = JSON.parse(atob(payloadBase64));
        console.log("[useAuthenticatedSupabase] JWT payload:", {
          sub: payload.sub,
          role: payload.role,
          expires: new Date(payload.exp * 1000).toISOString(),
          userMetadata: payload.user_metadata
        });
      } catch (parseErr) {
        console.error("[useAuthenticatedSupabase] Could not parse JWT payload:", parseErr);
      }
      
      setJwtData(newJwtData);
      setIsAuthenticated(true);
      
      // Update the JWT claims in the backend for reference
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/update-privy-jwt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            jwt: newJwtData.jwt, 
            userId: user.id 
          })
        });
      } catch (updateErr) {
        console.error("[useAuthenticatedSupabase] Error updating JWT claims:", updateErr);
        // Non-fatal error, so we continue
      }
      
      return newJwtData;
    } catch (err) {
      console.error("[useAuthenticatedSupabase] Error refreshing JWT:", err);
      setError((err as Error).message);
      setIsAuthenticated(false);
      toast({
        title: "Authentication Error",
        description: "Failed to refresh authentication. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  }, [authenticated, user?.id, toast]);

  // Initialize with JWT when authenticated
  useEffect(() => {
    if (!ready) {
      console.log("[useAuthenticatedSupabase] Privy not ready yet");
      return;
    }

    const initializeClient = async () => {
      setLoading(true);
      setError(null);

      if (!authenticated || !user?.id) {
        console.log("[useAuthenticatedSupabase] Not authenticated, using anonymous Supabase client");
        const anonClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
        setSupabaseClient(anonClient);
        setJwtData(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        console.log("[useAuthenticatedSupabase] Initializing authenticated client for user:", user.id);
        const newJwtData = await refreshJwt();
        
        if (newJwtData?.jwt) {
          console.log("[useAuthenticatedSupabase] Creating authenticated Supabase client with JWT");
          const authClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            global: {
              headers: {
                Authorization: `Bearer ${newJwtData.jwt}`,
              },
            },
          });
          
          // Test the authenticated client with a simple query
          try {
            console.log("[useAuthenticatedSupabase] Testing authenticated client...");
            const { data: authTest, error: authError } = await authClient.rpc('get_auth_context');
            console.log("[useAuthenticatedSupabase] Auth context test:", { authTest, authError });
            
            // Get profile to compare IDs
            const { data: profileData, error: profileError } = await authClient
              .from('profiles')
              .select('id, privy_id')
              .eq('privy_id', user.id)
              .maybeSingle();
              
            console.log("[useAuthenticatedSupabase] Profile data:", { 
              profileData, 
              profileError,
              authContextId: authTest,
              match: profileData?.id === authTest 
            });
          } catch (testErr) {
            console.error("[useAuthenticatedSupabase] Error testing authenticated client:", testErr);
          }
          
          setSupabaseClient(authClient);
          setIsAuthenticated(true);
        } else {
          // Fall back to anonymous client if JWT fetch fails
          console.warn("[useAuthenticatedSupabase] Failed to get JWT, falling back to anonymous client");
          const anonClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
          setSupabaseClient(anonClient);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error("[useAuthenticatedSupabase] Error initializing authenticated client:", err);
        setError((err as Error).message);
        setIsAuthenticated(false);
        
        // Fall back to anonymous client
        const anonClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
        setSupabaseClient(anonClient);
        
        toast({
          title: "Authentication Error",
          description: "Failed to initialize authenticated client. Some features may be limited.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initializeClient();
  }, [authenticated, user?.id, ready, refreshJwt, toast]);

  // Set up automatic JWT refresh
  useEffect(() => {
    if (!jwtData) return;

    // Calculate when to refresh the token (5 minutes before expiry)
    const refreshTime = jwtData.expiresAt - Date.now() - (5 * 60 * 1000);
    
    // Don't schedule if already expired
    if (refreshTime <= 0) {
      console.log("[useAuthenticatedSupabase] JWT already expired, refreshing immediately");
      refreshJwt();
      return;
    }
    
    console.log(`[useAuthenticatedSupabase] Scheduling JWT refresh in ${refreshTime / 1000 / 60} minutes`);
    const refreshTimer = setTimeout(() => {
      console.log("[useAuthenticatedSupabase] Executing scheduled JWT refresh");
      refreshJwt();
    }, refreshTime);

    return () => clearTimeout(refreshTimer);
  }, [jwtData, refreshJwt]);

  return {
    supabase: supabaseClient,
    loading,
    error,
    refreshJwt,
    isAuthenticated,
  };
};
