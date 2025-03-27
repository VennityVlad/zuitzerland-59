
import { useMemo } from "react";
import { Invoice } from "@/types/invoice";
import { InvoiceFilters } from "@/components/invoices/InvoiceFilter";
import { parseISO, subDays, subMonths } from "date-fns";

export const useFilteredInvoices = (invoices: Invoice[], filters: InvoiceFilters) => {
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

  // Apply filters to invoices
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

  return {
    roomTypes,
    filteredInvoices
  };
};
