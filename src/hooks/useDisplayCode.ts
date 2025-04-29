
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type DisplayCode = {
  id: string;
  code: string;
  name: string;
  location_filter?: string | null;
  tag_filter?: string | null;
  created_at: string;
  expires_at?: string | null;
};

export const useDisplayCode = (code: string | null) => {
  const [displayCode, setDisplayCode] = useState<DisplayCode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateCode = async () => {
      if (!code) {
        setError("No access code provided");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('display_codes')
          .select('*')
          .eq('code', code)
          .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        if (!data) {
          setError("Invalid access code");
          setIsLoading(false);
          return;
        }

        // Check if the code has expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setError("This access code has expired");
          setIsLoading(false);
          return;
        }

        setDisplayCode(data);
        setIsValid(true);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error validating display code:', err);
        setError(err.message || "Failed to verify access code");
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    validateCode();
    
    // Subscribe to changes in the display_codes table
    const channel = supabase
      .channel('display_codes_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'display_codes',
          filter: `code=eq.${code}` 
        }, 
        (payload) => {
          console.log('Display code changed:', payload);
          // If the code was deleted
          if (payload.eventType === 'DELETE') {
            setError("This access code has been deleted");
            setIsValid(false);
            setDisplayCode(null);
            return;
          }
          
          // For updates and inserts
          const updatedCode = payload.new as DisplayCode;
          
          // Check if code has expired
          if (updatedCode.expires_at && new Date(updatedCode.expires_at) < new Date()) {
            setError("This access code has expired");
            setIsValid(false);
            setDisplayCode(null);
            return;
          }
          
          setDisplayCode(updatedCode);
          setIsValid(true);
          setError(null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code]);

  return {
    displayCode,
    isLoading,
    error,
    isValid,
  };
};
