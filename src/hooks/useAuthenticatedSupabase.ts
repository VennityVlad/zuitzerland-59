
import { useState, useEffect, useCallback } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { usePrivy } from '@privy-io/react-auth';
import { useToast } from './use-toast';

const SUPABASE_URL = "https://cluqnvnxjexrhhgddoxu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsdXFudm54amV4cmhoZ2Rkb3h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5MzM0MzQsImV4cCI6MjA1NDUwOTQzNH0.1F5eYt59BKGemUfRHD0bHhlIQ_k1hmSDLh7ixa03w6k";

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
  const { toast } = useToast();

  const refreshJwt = useCallback(async () => {
    if (!authenticated || !user?.id) {
      setJwtData(null);
      return;
    }

    try {
      console.log("Fetching new Supabase JWT for Privy user:", user.id);
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
        throw new Error(errorData.error || 'Failed to refresh JWT');
      }

      const newJwtData = await response.json();
      console.log("New JWT received, expires at:", new Date(newJwtData.expiresAt).toISOString());
      
      setJwtData(newJwtData);
      return newJwtData;
    } catch (err) {
      console.error("Error refreshing JWT:", err);
      setError((err as Error).message);
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
    if (!ready) return;

    const initializeClient = async () => {
      setLoading(true);
      setError(null);

      if (!authenticated || !user?.id) {
        console.log("Not authenticated, using anonymous Supabase client");
        const anonClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
        setSupabaseClient(anonClient);
        setJwtData(null);
        setLoading(false);
        return;
      }

      try {
        const newJwtData = await refreshJwt();
        
        if (newJwtData?.jwt) {
          console.log("Creating authenticated Supabase client");
          const authClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            global: {
              headers: {
                Authorization: `Bearer ${newJwtData.jwt}`,
              },
            },
          });
          
          setSupabaseClient(authClient);
        } else {
          // Fall back to anonymous client if JWT fetch fails
          const anonClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
          setSupabaseClient(anonClient);
        }
      } catch (err) {
        console.error("Error initializing authenticated client:", err);
        setError((err as Error).message);
        
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
      refreshJwt();
      return;
    }
    
    console.log(`Scheduling JWT refresh in ${refreshTime / 1000 / 60} minutes`);
    const refreshTimer = setTimeout(() => {
      console.log("Executing scheduled JWT refresh");
      refreshJwt();
    }, refreshTime);

    return () => clearTimeout(refreshTimer);
  }, [jwtData, refreshJwt]);

  return {
    supabase: supabaseClient,
    loading,
    error,
    refreshJwt,
    isAuthenticated: !!jwtData?.jwt,
  };
};
