
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
        // Use the updated get_user_role function which now correctly uses privy_id
        const { data, error } = await supabase
          .rpc('get_user_role')
          .single();

        if (error) {
          console.error('Error checking admin status:', error);
          throw error;
        }
        
        // Set isAdmin based on the returned role
        setIsAdmin(data === 'admin');
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
