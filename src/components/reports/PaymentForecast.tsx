
// Fix imports and add type assertion for Supabase query
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { addDays, addMonths, format, isAfter, parseISO, startOfDay, startOfWeek, startOfMonth } from "date-fns";

interface ForecastData {
  period: string;
  expected: number;
  overdue: number;
}

export const PaymentForecast = () => {
  const { toast } = useToast();
  const [weeklyForecast, setWeeklyForecast] = useState<ForecastData[]>([]);
  const [monthlyForecast, setMonthlyForecast] = useState<ForecastData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch pending and overdue invoices
        const { data: invoices, error } = await supabase
          .from('invoices')
          .select('*')
          .in('status', ['pending', 'overdue']);

        if (error) throw error;

        if (!invoices || invoices.length === 0) {
          setWeeklyForecast([]);
          setMonthlyForecast([]);
          return;
        }

        // Process weekly forecast
        const today = startOfDay(new Date());
        const weeksData: Record<string, { expected: number; overdue: number }> = {};
        
        // Initialize next 4 weeks
        for (let i = 0; i < 4; i++) {
          const weekStart = addDays(startOfWeek(today), i * 7);
          const weekEnd = addDays(weekStart, 6);
          const weekLabel = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;
          weeksData[weekLabel] = { expected: 0, overdue: 0 };
        }
        
        // Process monthly forecast
        const monthsData: Record<string, { expected: number; overdue: number }> = {};
        
        // Initialize next 6 months
        for (let i = 0; i < 6; i++) {
          const month = addMonths(startOfMonth(today), i);
          const monthLabel = format(month, 'MMM yyyy');
          monthsData[monthLabel] = { expected: 0, overdue: 0 };
        }
        
        // Process each invoice
        invoices.forEach(invoice => {
          const dueDate = parseISO(invoice.due_date);
          const isOverdue = invoice.status === 'overdue';
          
          // Process weekly data
          for (let i = 0; i < 4; i++) {
            const weekStart = addDays(startOfWeek(today), i * 7);
            const weekEnd = addDays(weekStart, 6);
            const weekLabel = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;
            
            if (dueDate >= weekStart && dueDate <= weekEnd) {
              if (isOverdue) {
                weeksData[weekLabel].overdue += invoice.price;
              } else {
                weeksData[weekLabel].expected += invoice.price;
              }
            }
          }
          
          // Process monthly data
          for (let i = 0; i < 6; i++) {
            const monthStart = startOfMonth(addMonths(today, i));
            const monthEnd = startOfMonth(addMonths(today, i + 1));
            const monthLabel = format(monthStart, 'MMM yyyy');
            
            if (dueDate >= monthStart && dueDate < monthEnd) {
              if (isOverdue) {
                monthsData[monthLabel].overdue += invoice.price;
              } else {
                monthsData[monthLabel].expected += invoice.price;
              }
            }
          }
        });
        
        // Format data for charts
        const formattedWeeklyData = Object.entries(weeksData).map(([period, data]) => ({
          period,
          expected: data.expected,
          overdue: data.overdue
        }));
        
        const formattedMonthlyData = Object.entries(monthsData).map(([period, data]) => ({
          period,
          expected: data.expected,
          overdue: data.overdue
        }));
        
        setWeeklyForecast(formattedWeeklyData);
        setMonthlyForecast(formattedMonthlyData);
      } catch (error) {
        console.error('Error fetching payment forecast data:', error);
        toast({
          title: "Error",
          description: "Failed to load payment forecast data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[350px]" />
        <Skeleton className="h-[350px]" />
      </div>
    );
  }

  // If no data, use dummy data
  const weeklyData = weeklyForecast.length > 0 ? weeklyForecast : [
    { period: 'Nov 1 - Nov 7', expected: 12500, overdue: 3200 },
    { period: 'Nov 8 - Nov 14', expected: 15800, overdue: 0 },
    { period: 'Nov 15 - Nov 21', expected: 14200, overdue: 0 },
    { period: 'Nov 22 - Nov 28', expected: 18900, overdue: 0 }
  ];
  
  const monthlyData = monthlyForecast.length > 0 ? monthlyForecast : [
    { period: 'Nov 2023', expected: 45000, overdue: 8500 },
    { period: 'Dec 2023', expected: 52000, overdue: 0 },
    { period: 'Jan 2024', expected: 38000, overdue: 0 },
    { period: 'Feb 2024', expected: 42000, overdue: 0 },
    { period: 'Mar 2024', expected: 46500, overdue: 0 },
    { period: 'Apr 2024', expected: 51000, overdue: 0 }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CH', { style: 'currency', currency: 'CHF' }).format(value);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Payment Forecast</CardTitle>
          <CardDescription>Expected payments over the next 4 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            data={weeklyData}
            index="period"
            categories={['expected', 'overdue']}
            colors={['#676FFF', '#EF4444']}
            valueFormatter={(value) => formatCurrency(value)}
            yAxisWidth={80}
            className="h-[350px]"
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Monthly Payment Forecast</CardTitle>
          <CardDescription>Expected payments over the next 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <LineChart
            data={monthlyData}
            index="period"
            categories={['expected', 'overdue']}
            colors={['#676FFF', '#EF4444']}
            valueFormatter={(value) => formatCurrency(value)}
            yAxisWidth={80}
            className="h-[350px]"
          />
        </CardContent>
      </Card>
    </div>
  );
};
