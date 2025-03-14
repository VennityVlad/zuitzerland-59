
import { Invoice } from "@/types/invoice";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { format, subMonths, eachMonthOfInterval, parseISO, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";

interface RevenueByPeriodProps {
  invoices: Invoice[];
  showMonthlyTrend?: boolean;
}

export const RevenueByPeriod = ({ invoices, showMonthlyTrend = false }: RevenueByPeriodProps) => {
  // Get the date range (last 6 months)
  const today = new Date();
  const sixMonthsAgo = subMonths(today, 6);
  
  // Generate the array of months
  const months = eachMonthOfInterval({
    start: sixMonthsAgo,
    end: today
  });
  
  // Initialize data with all months
  const monthlyData = months.map(month => {
    const monthName = format(month, "MMM yyyy");
    return {
      month: monthName,
      paid: 0,
      pending: 0,
      overdue: 0,
      total: 0
    };
  });
  
  // Populate data with actual invoice amounts
  invoices.forEach(invoice => {
    const invoiceDate = parseISO(invoice.created_at);
    
    // Check if invoice is within our 6-month window
    if (isWithinInterval(invoiceDate, { start: sixMonthsAgo, end: today })) {
      const monthIndex = months.findIndex(month => 
        isWithinInterval(invoiceDate, {
          start: startOfMonth(month),
          end: endOfMonth(month)
        })
      );
      
      if (monthIndex !== -1) {
        const status = invoice.status;
        const amount = invoice.price;
        
        if (status === 'paid') {
          monthlyData[monthIndex].paid += amount;
        } else if (status === 'pending') {
          monthlyData[monthIndex].pending += amount;
        } else if (status === 'overdue') {
          monthlyData[monthIndex].overdue += amount;
        }
        
        monthlyData[monthIndex].total += amount;
      }
    }
  });

  if (showMonthlyTrend) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={monthlyData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `CHF ${value.toFixed(0)}`} />
          <Tooltip formatter={(value) => `CHF ${Number(value).toFixed(2)}`} />
          <Legend />
          <Line type="monotone" dataKey="total" name="Total Revenue" stroke="#8884d8" strokeWidth={2} />
          <Line type="monotone" dataKey="paid" name="Paid" stroke="#22c55e" />
          <Line type="monotone" dataKey="pending" name="Pending" stroke="#eab308" />
          <Line type="monotone" dataKey="overdue" name="Overdue" stroke="#ef4444" />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={monthlyData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(value) => `CHF ${value.toFixed(0)}`} />
        <Tooltip formatter={(value) => `CHF ${Number(value).toFixed(2)}`} />
        <Legend />
        <Bar dataKey="paid" name="Paid" stackId="a" fill="#22c55e" />
        <Bar dataKey="pending" name="Pending" stackId="a" fill="#eab308" />
        <Bar dataKey="overdue" name="Overdue" stackId="a" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  );
};
