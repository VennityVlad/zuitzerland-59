
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
  }, [code]);

  return {
    displayCode,
    isLoading,
    error,
    isValid,
  };
};
