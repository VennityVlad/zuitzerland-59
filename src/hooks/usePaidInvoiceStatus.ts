
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
          
        // Check if user has paid invoices
        const invoicePromise = supabase
          .from('invoices')
          .select('status')
          .eq('user_id', userId)
          .eq('status', 'paid')
          .maybeSingle();
          
        // Wait for both requests to complete
        const [adminResult, invoiceResult] = await Promise.all([
          adminPromise, 
          invoicePromise
        ]);
        
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
