import { usePrivy } from "@privy-io/react-auth";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageTitle } from "@/components/PageTitle";
import { InvoiceLoader } from "@/components/invoices/InvoiceLoader";
import { NoInvoicesMessage } from "@/components/invoices/NoInvoicesMessage";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { Button } from "@/components/ui/button";
import { Download, Plus, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImportInvoiceDialog } from "@/components/invoices/ImportInvoiceDialog";
import { InvoiceMassActions } from "@/components/invoices/InvoiceMassActions";
import { useInvoiceFilters } from "./hooks/useInvoiceFilters";
import { useFilteredInvoices } from "./hooks/useFilteredInvoices";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { useProfileInvitationStatus } from "./hooks/useProfileInvitationStatus";
import { useInvoiceExport } from "./hooks/useInvoiceExport";
import { InvoiceFilterPanel } from "./components/InvoiceFilterPanel";
import { useInvoices } from "@/hooks/useInvoices";

const InvoicesPage = () => {
  const { user } = usePrivy();
  const isMobile = useIsMobile();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>(undefined);

  const { isAdmin, isLoading: isAdminLoading } = useAdminStatus(user?.id);
  const { invoices, isLoading: invoicesLoading, refetchInvoices } = useInvoices(user?.id, isAdmin);
  const { filters, handleFilterChange, clearFilters } = useInvoiceFilters();
  const { roomTypes, filteredInvoices } = useFilteredInvoices(invoices, filters);
  const { profileInvitationStatus } = useProfileInvitationStatus(isAdmin, invoicesLoading, invoices);
  const { isExporting, handleExportCSV } = useInvoiceExport(filteredInvoices);

  const handlePaymentClick = (paymentLink: string) => {
    window.open(paymentLink, '_blank');
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsImportDialogOpen(true);
  };

  const renderActionButtons = () => {
    if (!isAdmin) return null;

    return (
      <>
        <Button
          onClick={() => setIsImportDialogOpen(true)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Import Invoice
        </Button>
        
        <Button
          onClick={handleExportCSV}
          size="sm"
          disabled={isExporting || filteredInvoices.length === 0}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </>
    );
  };

  if (isAdminLoading) {
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
      <PageTitle 
        title="Invoices" 
        actions={renderActionButtons()} 
      />
      <div className={`py-4 ${isMobile ? 'px-0' : 'px-4'} flex-grow`}>
        <div className={`container ${isMobile ? 'mx-0 max-w-none' : 'mx-auto'}`}>
          <div className={`bg-white ${isMobile ? 'mobile-full-width' : 'rounded-lg shadow-lg'} p-4 md:p-8`}>
            <InvoiceFilterPanel 
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
              isAdmin={isAdmin}
              roomTypes={roomTypes}
              isLoading={invoicesLoading}
            />
            
            {isAdmin && filteredInvoices.length > 0 && (
              <InvoiceMassActions 
                invoices={filteredInvoices} 
                onComplete={refetchInvoices}
                profileInvitationStatus={profileInvitationStatus}
              />
            )}
            
            {invoicesLoading ? (
              <InvoiceLoader />
            ) : filteredInvoices.length === 0 ? (
              <EmptyInvoiceState 
                hasFilters={!!filters.status || !!filters.name || !!filters.email || !!filters.roomType || !!filters.dateRange} 
                onClearFilters={clearFilters}
              />
            ) : (
              <InvoiceTable 
                invoices={filteredInvoices} 
                isAdmin={isAdmin} 
                onPaymentClick={handlePaymentClick} 
                useCardView={true}
                profileInvitationStatus={profileInvitationStatus}
              />
            )}
          </div>
        </div>
      </div>
      
      {isAdmin && (
        <ImportInvoiceDialog 
          open={isImportDialogOpen}
          onOpenChange={(open) => {
            setIsImportDialogOpen(open);
            if (!open) {
              setSelectedInvoice(undefined);
            }
          }}
          onSuccess={() => {
            refetchInvoices();
            setSelectedInvoice(undefined);
          }}
          existingInvoice={selectedInvoice}
        />
      )}
    </div>
  );
};

const EmptyInvoiceState = ({ hasFilters, onClearFilters }: { hasFilters: boolean, onClearFilters: () => void }) => {
  if (hasFilters) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No invoices match your filters</p>
        <Button 
          onClick={onClearFilters} 
          variant="link" 
          className="mt-2"
        >
          Clear all filters
        </Button>
      </div>
    );
  }
  
  return <NoInvoicesMessage />;
};

export default InvoicesPage;
