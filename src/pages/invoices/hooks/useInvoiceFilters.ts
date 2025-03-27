
import { useState } from "react";
import { InvoiceFilters } from "@/components/invoices/InvoiceFilter";

export const useInvoiceFilters = () => {
  const [filters, setFilters] = useState<InvoiceFilters>({
    status: null,
    name: null,
    email: null,
    roomType: null,
    dateRange: null,
  });

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

  return {
    filters,
    handleFilterChange,
    clearFilters
  };
};
