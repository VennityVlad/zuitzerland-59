
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

const Invoices = () => {
  const { user } = usePrivy();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { invoices, isLoading: invoicesLoading } = useInvoices(user?.id, isAdmin);
  const [filters, setFilters] = useState<InvoiceFilters>({
    status: null,
    name: null,
    email: null,
    roomType: null,
    dateRange: null,
  });

  // Extract unique room types from invoices
  const roomTypes = useMemo(() => {
    const types = new Set<string>();
    invoices.forEach((invoice) => {
      if (invoice.room_type) {
        types.add(invoice.room_type);
      }
    });
    return Array.from(types);
  }, [invoices]);

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

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      // Filter by status
      if (filters.status && invoice.status !== filters.status) {
        return false;
      }

      // Filter by name (case insensitive)
      if (filters.name) {
        const fullName = `${invoice.first_name} ${invoice.last_name}`.toLowerCase();
        if (!fullName.includes(filters.name.toLowerCase())) {
          return false;
        }
      }

      // Filter by email (case insensitive)
      if (filters.email && !invoice.email.toLowerCase().includes(filters.email.toLowerCase())) {
        return false;
      }

      // Filter by room type
      if (filters.roomType && invoice.room_type !== filters.roomType) {
        return false;
      }

      // Filter by date range
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
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-hotel-navy">
              {isAdmin ? 'All Invoices (Admin View)' : 'My Invoices'}
            </h1>
          </div>
          
          {!invoicesLoading && (
            <InvoiceFilter 
              filters={filters} 
              onFilterChange={handleFilterChange} 
              onClearFilters={clearFilters} 
              isAdmin={isAdmin}
              roomTypes={roomTypes}
            />
          )}
          
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
  );
};

export default Invoices;
