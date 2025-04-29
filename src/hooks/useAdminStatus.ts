
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAdminStatus = (userId: string | undefined) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!userId) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        // Query the profiles table directly to check admin status
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('privy_id', userId)
          .maybeSingle();

        if (error) {
          console.error('Error checking admin status:', error);
          throw error;
        }
        
        // Set isAdmin based on the returned role
        setIsAdmin(data?.role === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      checkAdminStatus();
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  return { isAdmin, isLoading };
};
