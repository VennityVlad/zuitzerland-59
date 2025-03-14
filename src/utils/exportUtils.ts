
import { Invoice } from "@/types/invoice";
import { format, parseISO } from "date-fns";

/**
 * Converts an array of invoices to CSV format
 */
export const convertInvoicesToCSV = (invoices: Invoice[]): string => {
  // Define CSV header
  const headers = [
    "Date",
    "First Name",
    "Last Name",
    "Email",
    "Room Type",
    "Check-in",
    "Check-out",
    "Amount (CHF)",
    "Due Date",
    "Status",
    "Payment Type",
    "Last Reminder"
  ];

  // Format data rows
  const rows = invoices.map(invoice => {
    return [
      format(parseISO(invoice.created_at), 'yyyy-MM-dd'),
      invoice.first_name,
      invoice.last_name,
      invoice.email,
      invoice.room_type,
      format(parseISO(invoice.checkin), 'yyyy-MM-dd'),
      format(parseISO(invoice.checkout), 'yyyy-MM-dd'),
      invoice.price.toFixed(2),
      format(parseISO(invoice.due_date), 'yyyy-MM-dd'),
      invoice.status,
      invoice.payment_type,
      invoice.last_reminder_sent ? format(parseISO(invoice.last_reminder_sent), 'yyyy-MM-dd HH:mm') : '-'
    ].map(value => `"${value || ''}"`).join(',');
  });

  // Combine header and rows
  return [headers.join(','), ...rows].join('\n');
};

/**
 * Triggers download of CSV data as a file
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
