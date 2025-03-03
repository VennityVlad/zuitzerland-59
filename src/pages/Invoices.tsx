
import { usePrivy } from "@privy-io/react-auth";
import { useState, useEffect } from "react";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { InvoiceLoader } from "@/components/invoices/InvoiceLoader";
import { NoInvoicesMessage } from "@/components/invoices/NoInvoicesMessage";
import { useInvoices } from "@/hooks/useInvoices";
import { supabase } from "@/integrations/supabase/client";

const Invoices = () => {
  const { user } = usePrivy();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { invoices, isLoading: invoicesLoading } = useInvoices(user?.id, isAdmin);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('privy_id', user.id)
          .maybeSingle();

        if (error) throw error;
        
        setIsAdmin(data?.role === 'admin');
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  const handlePaymentClick = (paymentLink: string) => {
    window.open(paymentLink, '_blank');
  };

  // Show loading state while checking admin status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary/30 py-12">
        <div className="container mx-auto px-4">
          <InvoiceLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-hotel-navy">
              {isAdmin ? 'All Invoices (Admin View)' : 'My Invoices'}
            </h1>
          </div>
          
          {invoicesLoading ? (
            <InvoiceLoader />
          ) : invoices.length === 0 ? (
            <NoInvoicesMessage />
          ) : (
            <div className="overflow-x-auto">
              <InvoiceTable 
                invoices={invoices} 
                isAdmin={isAdmin} 
                onPaymentClick={handlePaymentClick} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Invoices;
