
import { Invoice } from "@/types/invoice";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface RecentTransactionsProps {
  invoices: Invoice[];
}

export const RecentTransactions = ({ invoices }: RecentTransactionsProps) => {
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

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No recent transactions
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invoices.map((invoice) => (
        <div
          key={invoice.id}
          className="flex items-center justify-between p-4 rounded-lg border bg-card"
        >
          <div className="flex flex-col">
            <span className="font-medium">
              {invoice.first_name} {invoice.last_name}
            </span>
            <span className="text-sm text-muted-foreground">
              {format(parseISO(invoice.created_at), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold">
              CHF {invoice.price.toFixed(2)}
            </span>
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              getStatusStyle(invoice.status)
            )}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
