
import { usePrivy } from "@privy-io/react-auth";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { InvoiceLoader } from "@/components/invoices/InvoiceLoader";
import { NoInvoicesMessage } from "@/components/invoices/NoInvoicesMessage";
import { useInvoices } from "@/hooks/useInvoices";

const Invoices = () => {
  const { user } = usePrivy();
  const { roles } = useSupabaseAuth();
  const isAdmin = roles.admin;
  const { invoices, isLoading } = useInvoices(user?.id, isAdmin);

  const handlePaymentClick = (paymentLink: string) => {
    window.open(paymentLink, '_blank');
  };

  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-hotel-navy">
              {isAdmin ? 'All Invoices (Admin View)' : 'My Invoices'}
            </h1>
          </div>
          
          {isLoading ? (
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
