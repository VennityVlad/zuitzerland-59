
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Invoice } from "@/types/invoice";

export const useInvoices = (userId: string | undefined, isAdmin: boolean) => {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);

        if (!userId) {
          console.error('No user ID available');
          setInvoices([]);
          return;
        }

        // First get the profile id for the current user
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('privy_id', userId)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          toast({
            title: "Error",
            description: "Failed to load user profile.",
            variant: "destructive",
          });
          setInvoices([]);
          return;
        }

        if (!profileData && !isAdmin) {
          console.warn('No profile found for user ID:', userId);
          setInvoices([]);
          return;
        }

        // Create the query based on user role
        let query = supabase.from('invoices').select('*');
        
        // Non-admin users only see their own invoices
        if (!isAdmin && profileData) {
          query = query.eq('profile_id', profileData.id);
        }
        
        // Order by created date, newest first
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;
        setInvoices(data || []);

        // Only update invoice statuses if we have invoices to update
        if (data && data.length > 0) {
          // Update invoice statuses in the background
          const { error: statusError } = await supabase.functions.invoke('get-invoice-status');
          
          if (statusError) {
            console.error('Error updating invoice statuses:', statusError);
          } else {
            // Fetch updated data only if status update was successful
            const { data: updatedData, error: fetchError } = await query;
            
            if (fetchError) {
              console.error('Error fetching updated invoices:', fetchError);
            } else {
              setInvoices(updatedData || []);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
        toast({
          title: "Error",
          description: "Failed to load invoices. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch invoices when userId is available
    if (userId !== undefined) {
      fetchInvoices();
    }
  }, [userId, isAdmin, toast]);

  return { invoices, isLoading };
};
