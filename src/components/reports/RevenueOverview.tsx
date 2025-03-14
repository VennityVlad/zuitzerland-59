
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart, PieChart } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format, subMonths, isAfter } from "date-fns";

interface RevenueStats {
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  overdueRevenue: number;
  revenueByMonth: { month: string; revenue: number }[];
  comparisonPercentage: number;
}

export const RevenueOverview = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all invoices
        const { data: invoices, error } = await supabase
          .from('invoices')
          .select('*');

        if (error) throw error;

        if (!invoices || invoices.length === 0) {
          setStats({
            totalRevenue: 0,
            paidRevenue: 0,
            pendingRevenue: 0,
            overdueRevenue: 0,
            revenueByMonth: [],
            comparisonPercentage: 0
          });
          setIsLoading(false);
          return;
        }

        // Calculate revenue stats
        const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.price, 0);
        const paidRevenue = invoices
          .filter(invoice => invoice.status === 'paid')
          .reduce((sum, invoice) => sum + invoice.price, 0);
        const pendingRevenue = invoices
          .filter(invoice => invoice.status === 'pending')
          .reduce((sum, invoice) => sum + invoice.price, 0);
        const overdueRevenue = invoices
          .filter(invoice => invoice.status === 'overdue')
          .reduce((sum, invoice) => sum + invoice.price, 0);

        // Group by month for the chart
        const sixMonthsAgo = subMonths(new Date(), 6);
        const recentInvoices = invoices.filter(invoice => 
          isAfter(new Date(invoice.created_at), sixMonthsAgo)
        );

        const monthlyData = recentInvoices.reduce((acc, invoice) => {
          const month = format(new Date(invoice.created_at), 'MMM yyyy');
          if (!acc[month]) {
            acc[month] = 0;
          }
          acc[month] += invoice.price;
          return acc;
        }, {} as Record<string, number>);

        const revenueByMonth = Object.entries(monthlyData)
          .map(([month, revenue]) => ({ month, revenue }))
          .sort((a, b) => {
            const aDate = new Date(a.month);
            const bDate = new Date(b.month);
            return aDate.getTime() - bDate.getTime();
          });

        // Calculate comparison with previous period (last 3 months vs 3 months before that)
        const threeMonthsAgo = subMonths(new Date(), 3);
        const sixMonthsAgoDate = subMonths(new Date(), 6);
        
        const recentPeriodRevenue = invoices
          .filter(invoice => 
            isAfter(new Date(invoice.created_at), threeMonthsAgo)
          )
          .reduce((sum, invoice) => sum + invoice.price, 0);
          
        const previousPeriodRevenue = invoices
          .filter(invoice => 
            isAfter(new Date(invoice.created_at), sixMonthsAgoDate) && 
            !isAfter(new Date(invoice.created_at), threeMonthsAgo)
          )
          .reduce((sum, invoice) => sum + invoice.price, 0);
          
        const comparisonPercentage = previousPeriodRevenue === 0 
          ? 100 
          : ((recentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100;

        setStats({
          totalRevenue,
          paidRevenue,
          pendingRevenue,
          overdueRevenue,
          revenueByMonth,
          comparisonPercentage
        });
      } catch (error) {
        console.error('Error fetching revenue data:', error);
        toast({
          title: "Error",
          description: "Failed to load revenue data",
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader>
            <Skeleton className="h-8 w-[250px]" />
            <Skeleton className="h-4 w-[300px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
        <Skeleton className="h-[150px]" />
        <Skeleton className="h-[150px]" />
        <Skeleton className="h-[150px]" />
      </div>
    );
  }

  if (!stats) return null;

  const { totalRevenue, paidRevenue, pendingRevenue, overdueRevenue, revenueByMonth, comparisonPercentage } = stats;

  const revenueChartData = revenueByMonth.map(item => ({
    name: item.month,
    revenue: item.revenue
  }));

  const distributionData = [
    { name: 'Paid', value: paidRevenue, color: '#10B981' },
    { name: 'Pending', value: pendingRevenue, color: '#F59E0B' },
    { name: 'Overdue', value: overdueRevenue, color: '#EF4444' }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CH', { style: 'currency', currency: 'CHF' }).format(value);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <div className="mt-1 flex items-center text-xs text-muted-foreground">
              <Badge variant={comparisonPercentage >= 0 ? "default" : "destructive"} className="mr-1">
                {comparisonPercentage >= 0 ? '↑' : '↓'} {Math.abs(comparisonPercentage).toFixed(1)}%
              </Badge>
              vs previous period
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(paidRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {((paidRevenue / totalRevenue) * 100).toFixed(1)}% of total revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingRevenue + overdueRevenue)}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>
                Pending: {formatCurrency(pendingRevenue)}
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                Overdue: {formatCurrency(overdueRevenue)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
            <CardDescription>Revenue over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart
              data={revenueChartData}
              categories={['revenue']}
              index="name"
              colors={['#676FFF']}
              valueFormatter={(value) => formatCurrency(value)}
              yAxisWidth={80}
              className="h-[300px]"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Revenue Distribution</CardTitle>
            <CardDescription>By invoice status</CardDescription>
          </CardHeader>
          <CardContent>
            <PieChart
              data={distributionData}
              category="value"
              index="name"
              colors={distributionData.map(item => item.color)}
              valueFormatter={(value) => formatCurrency(value)}
              className="h-[300px]"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
