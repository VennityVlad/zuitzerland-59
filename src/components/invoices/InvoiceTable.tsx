
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink, Mail } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Invoice } from "@/types/invoice";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InvoiceTableProps {
  invoices: Invoice[];
  isAdmin: boolean;
  onPaymentClick: (paymentLink: string) => void;
}

export const InvoiceTable = ({ invoices, isAdmin, onPaymentClick }: InvoiceTableProps) => {
  const { toast } = useToast();
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d');
  };

  const formatDateWithYear = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d, yyyy');
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleSendReminder = async (invoice: Invoice) => {
    try {
      setLoadingInvoiceId(invoice.id);
      
      const response = await supabase.functions.invoke('send-email-reminder', {
        body: {
          invoiceId: invoice.id,
          email: invoice.email,
          firstName: invoice.first_name,
          lastName: invoice.last_name,
          invoiceAmount: invoice.price,
          dueDate: formatDateWithYear(invoice.due_date),
          paymentLink: invoice.payment_link
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send reminder');
      }

      toast({
        title: "Reminder Sent",
        description: `Payment reminder sent to ${invoice.email}`,
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Failed to Send Reminder",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  // Admin view includes additional user information columns
  if (isAdmin) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>First Name</TableHead>
            <TableHead>Last Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Room Type</TableHead>
            <TableHead>Stay Period</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Reminder</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>
                {formatDateWithYear(invoice.created_at)}
              </TableCell>
              <TableCell>{invoice.first_name}</TableCell>
              <TableCell>{invoice.last_name}</TableCell>
              <TableCell>{invoice.email}</TableCell>
              <TableCell>{invoice.room_type}</TableCell>
              <TableCell>
                {formatDate(invoice.checkin)} - {formatDateWithYear(invoice.checkout)}
              </TableCell>
              <TableCell>CHF {invoice.price.toFixed(2)}</TableCell>
              <TableCell>
                {formatDateWithYear(invoice.due_date)}
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(invoice.status)}`}>
                  {invoice.status}
                </span>
              </TableCell>
              <TableCell>
                {invoice.last_reminder_sent ? (
                  <div className="text-xs">
                    <div>{formatDateTime(invoice.last_reminder_sent)}</div>
                    <div className="text-gray-500">
                      {invoice.reminder_count && invoice.reminder_count > 0 
                        ? `Sent ${invoice.reminder_count} ${invoice.reminder_count === 1 ? 'time' : 'times'}` 
                        : ''}
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500 text-xs">Never sent</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => onPaymentClick(invoice.payment_link)}
                    variant="outline"
                    size="sm"
                    disabled={invoice.status === 'paid' || invoice.status === 'cancelled'}
                    className="flex items-center gap-2"
                  >
                    Payment <ExternalLink className="h-4 w-4" />
                  </Button>
                  
                  {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                    <Button
                      onClick={() => handleSendReminder(invoice)}
                      variant="outline"
                      size="sm"
                      disabled={loadingInvoiceId === invoice.id}
                      className="flex items-center gap-2"
                    >
                      {loadingInvoiceId === invoice.id ? 'Sending...' : 'Reminder'} <Mail className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  // Regular user view
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Room Type</TableHead>
          <TableHead>Stay Period</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell>
              {formatDateWithYear(invoice.created_at)}
            </TableCell>
            <TableCell>{invoice.room_type}</TableCell>
            <TableCell>
              {formatDate(invoice.checkin)} - {formatDateWithYear(invoice.checkout)}
            </TableCell>
            <TableCell>CHF {invoice.price.toFixed(2)}</TableCell>
            <TableCell>
              {formatDateWithYear(invoice.due_date)}
            </TableCell>
            <TableCell>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(invoice.status)}`}>
                {invoice.status}
              </span>
            </TableCell>
            <TableCell>
              <Button
                onClick={() => onPaymentClick(invoice.payment_link)}
                variant="outline"
                size="sm"
                disabled={invoice.status === 'paid' || invoice.status === 'cancelled'}
                className="flex items-center gap-2"
              >
                Pay Now <ExternalLink className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
