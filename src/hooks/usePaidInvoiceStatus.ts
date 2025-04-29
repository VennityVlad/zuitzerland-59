
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePaidInvoiceStatus = (userId: string | undefined) => {
  const [hasPaidInvoice, setHasPaidInvoice] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const checkStatus = async () => {
      try {
        // First check if user is admin (do this in parallel)
        const adminPromise = supabase
          .from('profiles')
          .select('role')
          .eq('privy_id', userId)
          .maybeSingle();
          
        // Check if user has paid invoices - using profile_id instead of user_id
        // First get the profile id
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('privy_id', userId)
          .maybeSingle();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return;
        }
        
        // Now check for paid invoices using profile_id
        const invoicePromise = profileData?.id 
          ? supabase
              .from('invoices')
              .select('status')
              .eq('profile_id', profileData.id)
              .eq('status', 'paid')
              .maybeSingle()
          : Promise.resolve({ data: null, error: null });
          
        // Wait for both requests to complete
        const adminResult = await adminPromise;
        const invoiceResult = await invoicePromise;
        
        if (adminResult.error) {
          console.error('Error checking admin status:', adminResult.error);
        } else {
          setIsAdmin(adminResult.data?.role === 'admin');
        }
        
        if (invoiceResult.error) {
          console.error('Error checking invoice status:', invoiceResult.error);
        } else {
          setHasPaidInvoice(!!invoiceResult.data);
        }
      } catch (error) {
        console.error('Error in usePaidInvoiceStatus:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [userId]);

  return { hasPaidInvoice, isLoading, isAdmin };
};
