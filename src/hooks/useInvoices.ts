
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

        // Admin users see all invoices, regular users only see their own
        const query = supabase
          .from('invoices')
          .select('*');
        
        // If not an admin, filter by user's Privy ID
        if (!isAdmin) {
          query.eq('privy_id', userId.toString());
        }
        
        // Order by created date, newest first
        query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;
        setInvoices(data || []);

        // Update invoice statuses in the background
        const { error: statusError } = await supabase.functions.invoke('get-invoice-status');
        if (statusError) throw statusError;

        // Fetch updated data
        const { data: updatedData, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setInvoices(updatedData || []);
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

    if (userId) {
      fetchInvoices();
    }
  }, [userId, isAdmin, toast]);

  return { invoices, isLoading };
};
