
import { InvoiceFilter, InvoiceFilters } from "@/components/invoices/InvoiceFilter";

interface InvoiceFilterPanelProps {
  filters: InvoiceFilters;
  onFilterChange: (filters: InvoiceFilters) => void;
  onClearFilters: () => void;
  isAdmin: boolean;
  roomTypes: string[];
  isLoading: boolean;
}

export const InvoiceFilterPanel = ({
  filters,
  onFilterChange,
  onClearFilters,
  isAdmin,
  roomTypes,
  isLoading
}: InvoiceFilterPanelProps) => {
  if (isLoading) return null;

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <InvoiceFilter 
        filters={filters} 
        onFilterChange={onFilterChange} 
        onClearFilters={onClearFilters} 
        isAdmin={isAdmin}
        roomTypes={roomTypes}
      />
    </div>
  );
};
