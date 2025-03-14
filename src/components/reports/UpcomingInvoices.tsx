
import { Invoice } from "@/types/invoice";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";
import { ExternalLink, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface UpcomingInvoicesProps {
  invoices: Invoice[];
  showOverdue?: boolean;
}

export const UpcomingInvoices = ({ invoices, showOverdue = false }: UpcomingInvoicesProps) => {
  const navigate = useNavigate();
  const today = new Date();
  const thirtyDaysFromNow = addDays(today, 30);
  
  const filteredInvoices = showOverdue
    ? invoices.filter(invoice => invoice.status === 'overdue')
    : invoices.filter(invoice => {
        const dueDate = parseISO(invoice.due_date);
        return (
          invoice.status === 'pending' &&
          isAfter(dueDate, today) &&
          isBefore(dueDate, thirtyDaysFromNow)
        );
      });

  const sortedInvoices = filteredInvoices.sort((a, b) => {
    const dateA = parseISO(a.due_date);
    const dateB = parseISO(b.due_date);
    return dateA.getTime() - dateB.getTime();
  });

  if (sortedInvoices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No {showOverdue ? 'overdue' : 'upcoming'} invoices
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedInvoices.map((invoice) => (
        <div
          key={invoice.id}
          className="flex items-center justify-between p-4 rounded-lg border bg-card"
        >
          <div className="flex flex-col">
            <span className="font-medium">
              {invoice.first_name} {invoice.last_name}
            </span>
            <span className="text-sm text-muted-foreground">
              Due: {format(parseISO(invoice.due_date), "MMM d, yyyy")}
            </span>
            <span className="text-sm font-semibold">
              CHF {invoice.price.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => window.open(invoice.payment_link, '_blank')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Pay
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(`/invoices?filter=${invoice.email}`)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Contact
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
