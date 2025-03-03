
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Invoice } from "@/types/invoice";

interface InvoiceTableProps {
  invoices: Invoice[];
  isAdmin: boolean;
  onPaymentClick: (paymentLink: string) => void;
}

export const InvoiceTable = ({ invoices, isAdmin, onPaymentClick }: InvoiceTableProps) => {
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d');
  };

  const formatDateWithYear = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d, yyyy');
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
            <TableHead>Action</TableHead>
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
                <Button
                  onClick={() => onPaymentClick(invoice.payment_link)}
                  variant="outline"
                  size="sm"
                  disabled={invoice.status === 'paid' || invoice.status === 'cancelled'}
                  className="flex items-center gap-2"
                >
                  Payment <ExternalLink className="h-4 w-4" />
                </Button>
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
