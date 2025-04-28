
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const usePaidInvoiceStatus = (userId: string | undefined) => {
  const [hasPaidInvoice, setHasPaidInvoice] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const checkPaidInvoiceStatus = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // First check if user is an admin - admins always have access
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, id')
          .eq('privy_id', userId)
          .maybeSingle();

        if (profileError) throw profileError;
        
        const userIsAdmin = profileData?.role === 'admin';
        setIsAdmin(userIsAdmin);
        
        // If user is admin, they have access regardless of invoice status
        if (userIsAdmin) {
          setHasPaidInvoice(true);
          setIsLoading(false);
          return;
        }

        // If not admin, check for paid invoices
        if (profileData?.id) {
          const { data: invoiceData, error: invoiceError } = await supabase
            .from('invoices')
            .select('id')
            .eq('profile_id', profileData.id)
            .eq('status', 'paid')
            .maybeSingle();

          if (invoiceError) throw invoiceError;
          setHasPaidInvoice(!!invoiceData);
        }
      } catch (error) {
        console.error('Error checking paid invoice status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPaidInvoiceStatus();
  }, [userId]);

  return { hasPaidInvoice, isLoading, isAdmin };
};
