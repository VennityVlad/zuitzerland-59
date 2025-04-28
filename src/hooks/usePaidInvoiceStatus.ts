
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const usePaidInvoiceStatus = (userId: string | undefined) => {
  const [hasPaidInvoice, setHasPaidInvoice] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const checkPaidInvoiceStatus = async () => {
      console.log("Checking paid invoice status for userId:", userId);
      if (!userId) {
        console.log("No userId provided, setting hasPaidInvoice to false");
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

        if (profileError) {
          console.error("Error fetching profile data:", profileError);
          throw profileError;
        }
        
        console.log("Profile data retrieved:", profileData);
        
        const userIsAdmin = profileData?.role === 'admin';
        setIsAdmin(userIsAdmin);
        
        // If user is admin, they have access regardless of invoice status
        if (userIsAdmin) {
          console.log("User is admin, granting access regardless of invoice status");
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

          if (invoiceError) {
            console.error("Error fetching invoice data:", invoiceError);
            throw invoiceError;
          }
          
          console.log("Invoice data retrieved:", invoiceData);
          setHasPaidInvoice(!!invoiceData);
          console.log("Has paid invoice set to:", !!invoiceData);
        } else {
          console.log("No profile ID found, setting hasPaidInvoice to false");
          setHasPaidInvoice(false);
        }
      } catch (error) {
        console.error('Error checking paid invoice status:', error);
        setHasPaidInvoice(false); // Explicitly set to false on error
      } finally {
        setIsLoading(false);
      }
    };

    checkPaidInvoiceStatus();
  }, [userId]);

  return { hasPaidInvoice, isLoading, isAdmin };
};
