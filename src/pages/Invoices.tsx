import { usePrivy } from "@privy-io/react-auth";
import { useState, useEffect, useMemo } from "react";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { InvoiceLoader } from "@/components/invoices/InvoiceLoader";
import { NoInvoicesMessage } from "@/components/invoices/NoInvoicesMessage";
import { useInvoices } from "@/hooks/useInvoices";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceFilter, InvoiceFilters } from "@/components/invoices/InvoiceFilter";
import { Button } from "@/components/ui/button";
import { parseISO, subDays, subMonths } from "date-fns";
import { PageTitle } from "@/components/PageTitle";
import { useIsMobile } from "@/hooks/use-mobile";
import { Download } from "lucide-react";
import { convertInvoicesToCSV, downloadCSV } from "@/utils/exportUtils";
import { useToast } from "@/hooks/use-toast";

const Invoices = () => {
  const { user } = usePrivy();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<InvoiceFilters>({
    status: null,
    name: null,
    email: null,
    roomType: null,
    dateRange: null,
  });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

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
      checkAdminStatus();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  const { invoices, isLoading: invoicesLoading } = useInvoices(user?.id, isAdmin);

  const roomTypes = useMemo(() => {
    const types = new Set<string>();
    invoices.forEach((invoice) => {
      if (invoice.room_type) {
        types.add(invoice.room_type);
      }
    });
    return Array.from(types);
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      if (filters.status && invoice.status !== filters.status) {
        return false;
      }

      if (filters.name) {
        const fullName = `${invoice.first_name} ${invoice.last_name}`.toLowerCase();
        if (!fullName.includes(filters.name.toLowerCase())) {
          return false;
        }
      }

      if (filters.email && !invoice.email.toLowerCase().includes(filters.email.toLowerCase())) {
        return false;
      }

      if (filters.roomType && invoice.room_type !== filters.roomType) {
        return false;
      }

      if (filters.dateRange) {
        const createdAt = parseISO(invoice.created_at);
        const now = new Date();
        
        switch (filters.dateRange) {
          case 'week':
            return createdAt >= subDays(now, 7);
          case 'month':
            return createdAt >= subMonths(now, 1);
          case 'quarter':
            return createdAt >= subMonths(now, 3);
          default:
            return true;
        }
      }

      return true;
    });
  }, [invoices, filters]);

  const handleFilterChange = (newFilters: InvoiceFilters) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      status: null,
      name: null,
      email: null,
      roomType: null,
      dateRange: null,
    });
  };

  const handlePaymentClick = (paymentLink: string) => {
    window.open(paymentLink, '_blank');
  };

  const handleExportCSV = () => {
    try {
      setIsExporting(true);
      
      const date = new Date();
      const filename = `invoices_export_${date.toISOString().slice(0, 10)}.csv`;
      
      const csvContent = convertInvoicesToCSV(filteredInvoices);
      downloadCSV(csvContent, filename);
      
      toast({
        title: "Export successful",
        description: `${filteredInvoices.length} invoices exported to ${filename}`,
      });
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast({
        title: "Export failed",
        description: "An error occurred while exporting the data.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageTitle title="Invoices" />
        <div className={`py-4 ${isMobile ? 'px-0' : 'px-4'} flex-grow`}>
          <div className={`container ${isMobile ? 'mx-0 max-w-none' : 'mx-auto'}`}>
            <InvoiceLoader />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageTitle title={isAdmin ? 'All Invoices (Admin View)' : 'My Invoices'} />
      <div className={`py-4 ${isMobile ? 'px-0' : 'px-4'} flex-grow`}>
        <div className={`container ${isMobile ? 'mx-0 max-w-none' : 'mx-auto'}`}>
          <div className={`bg-white ${isMobile ? 'mobile-full-width' : 'rounded-lg shadow-lg'} p-4 md:p-8`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              {!invoicesLoading && (
                <InvoiceFilter 
                  filters={filters} 
                  onFilterChange={handleFilterChange} 
                  onClearFilters={clearFilters} 
                  isAdmin={isAdmin}
                  roomTypes={roomTypes}
                />
              )}
              
              {isAdmin && (
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  size="sm"
                  disabled={isExporting || filteredInvoices.length === 0}
                  className="flex items-center gap-2 mt-4 md:mt-0"
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? 'Exporting...' : 'Export CSV'}
                </Button>
              )}
            </div>
            
            {invoicesLoading ? (
              <InvoiceLoader />
            ) : filteredInvoices.length === 0 ? (
              filters.status || filters.name || filters.email || filters.roomType || filters.dateRange ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No invoices match your filters</p>
                  <Button 
                    onClick={clearFilters} 
                    variant="link" 
                    className="mt-2"
                  >
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <NoInvoicesMessage />
              )
            ) : (
              <InvoiceTable 
                invoices={filteredInvoices} 
                isAdmin={isAdmin} 
                onPaymentClick={handlePaymentClick} 
                useCardView={true}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoices;
