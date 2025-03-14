
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Invoice } from "@/types/invoice";
import { BadgeDollarSign, Calendar, CheckCircle2, AlertTriangle } from "lucide-react";
import { format, isThisMonth, isPast, parseISO } from "date-fns";

interface RevenueOverviewProps {
  invoices: Invoice[];
}

export const RevenueOverview = ({ invoices }: RevenueOverviewProps) => {
  // Calculate total revenue (paid invoices)
  const totalRevenue = invoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.price, 0);
  
  // Calculate monthly revenue (this month's paid invoices)
  const monthlyRevenue = invoices
    .filter(invoice => 
      invoice.status === 'paid' && 
      isThisMonth(parseISO(invoice.created_at))
    )
    .reduce((sum, invoice) => sum + invoice.price, 0);
  
  // Calculate pending revenue (invoices not yet paid or overdue)
  const pendingRevenue = invoices
    .filter(invoice => invoice.status === 'pending')
    .reduce((sum, invoice) => sum + invoice.price, 0);
  
  // Calculate overdue revenue (overdue invoices)
  const overdueRevenue = invoices
    .filter(invoice => invoice.status === 'overdue')
    .reduce((sum, invoice) => sum + invoice.price, 0);

  // Format currency to CHF with 2 decimal places
  const formatCurrency = (amount: number) => {
    return `CHF ${amount.toFixed(2)}`;
  };

  const stats = [
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: <BadgeDollarSign className="h-5 w-5 text-green-500" />,
      className: "bg-green-50",
    },
    {
      title: "This Month",
      value: formatCurrency(monthlyRevenue),
      icon: <Calendar className="h-5 w-5 text-blue-500" />,
      className: "bg-blue-50",
    },
    {
      title: "Pending",
      value: formatCurrency(pendingRevenue),
      icon: <CheckCircle2 className="h-5 w-5 text-amber-500" />,
      className: "bg-amber-50",
    },
    {
      title: "Overdue",
      value: formatCurrency(overdueRevenue),
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      className: "bg-red-50",
    },
  ];

  return (
    <>
      {stats.map((stat, index) => (
        <Card key={index} className={stat.className}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};
