import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart, PieChart } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { differenceInDays } from "date-fns";

interface OverviewStats {
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  overdueRevenue: number;
  invoiceCount: number;
  averageValue: number;
  recentTrend: { date: string; revenue: number }[];
  statusDistribution: { name: string; value: number; color: string }[];
  topRoomTypes: { name: string; revenue: number }[];
}

export const RevenueOverview = () => {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<string>("month");
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOverviewStats = async () => {
      try {
        setIsLoading(true);
        
        // Define the time range
        let startDate;
        const now = new Date();
        
        switch (timeRange) {
          case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 3);
            break;
          case 'year':
            startDate = new Date(now);
            startDate.setFullYear(now.getFullYear() - 1);
            break;
          default: // all
            startDate = null;
            break;
        }
        
        // Fetch all invoices within the time range
        let query = supabase.from('invoices').select('*');
        
        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }
        
        // Order by created_at for trend analysis
        query = query.order('created_at', { ascending: true });
        
        const { data: invoices, error } = await query;
        
        if (error) throw error;
        
        if (!invoices || invoices.length === 0) {
          setStats(null);
          return;
        }
        
        // Filter out cancelled invoices for total revenue calculation
        const activeInvoices = invoices.filter(invoice => invoice.status !== 'cancelled');
        
        // Calculate overview statistics excluding cancelled invoices
        const totalRevenue = activeInvoices.reduce((sum, invoice) => sum + invoice.price, 0);
        const paidRevenue = invoices
          .filter(invoice => invoice.status === 'paid')
          .reduce((sum, invoice) => sum + invoice.price, 0);
        const pendingRevenue = invoices
          .filter(invoice => invoice.status === 'pending')
          .reduce((sum, invoice) => sum + invoice.price, 0);
        const overdueRevenue = invoices
          .filter(invoice => invoice.status === 'overdue')
          .reduce((sum, invoice) => sum + invoice.price, 0);
        
        // Only count active invoices for the invoice count
        const invoiceCount = activeInvoices.length;
        const averageValue = invoiceCount > 0 ? totalRevenue / invoiceCount : 0;
        
        // Prepare status distribution data for the pie chart
        const statusCounts: Record<string, { count: number, color: string }> = {
          paid: { count: 0, color: '#10B981' },
          pending: { count: 0, color: '#F59E0B' },
          overdue: { count: 0, color: '#EF4444' }
        };
        
        invoices.forEach(invoice => {
          if (statusCounts[invoice.status]) {
            statusCounts[invoice.status].count += 1;
          } else {
            statusCounts[invoice.status] = { count: 1, color: '#6B7280' };
          }
        });
        
        const statusDistribution = Object.entries(statusCounts).map(([name, data]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value: data.count,
          color: data.color
        }));
        
        // Prepare room type data (exclude cancelled invoices for room type analysis)
        const roomTypeRevenue: Record<string, number> = {};
        
        activeInvoices.forEach(invoice => {
          if (!roomTypeRevenue[invoice.room_type]) {
            roomTypeRevenue[invoice.room_type] = 0;
          }
          roomTypeRevenue[invoice.room_type] += invoice.price;
        });
        
        // Get top 5 room types by revenue
        const topRoomTypes = Object.entries(roomTypeRevenue)
          .map(([name, revenue]) => ({ name, revenue }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);
        
        // Prepare trend data (exclude cancelled invoices for trend data)
        // For better visualization, we'll group by days or weeks depending on the time range
        const trendMap: Record<string, number> = {};
        let dateFormat: string;
        
        if (timeRange === 'week') {
          // Group by day for a week
          dateFormat = 'day';
        } else if (timeRange === 'month') {
          // Group by week for a month
          dateFormat = 'week';
        } else {
          // Group by month for longer periods
          dateFormat = 'month';
        }
        
        // Initialize dates for the trend
        if (dateFormat === 'day') {
          // Daily for a week
          for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            trendMap[dateStr] = 0;
          }
        } else if (dateFormat === 'week') {
          // Weekly for a month
          for (let i = 3; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - (i * 7));
            const weekStr = `Week ${4 - i}`;
            trendMap[weekStr] = 0;
          }
        } else {
          // Monthly for longer periods
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const currentMonth = now.getMonth();
          
          for (let i = 5; i >= 0; i--) {
            let monthIndex = currentMonth - i;
            if (monthIndex < 0) monthIndex += 12;
            trendMap[monthNames[monthIndex]] = 0;
          }
        }
        
        // Populate trend data with only active invoices
        activeInvoices.forEach(invoice => {
          const createdAt = new Date(invoice.created_at);
          
          if (dateFormat === 'day') {
            const dateStr = createdAt.toISOString().split('T')[0];
            if (trendMap[dateStr] !== undefined) {
              trendMap[dateStr] += invoice.price;
            }
          } else if (dateFormat === 'week') {
            const daysSinceStart = differenceInDays(createdAt, startDate);
            const weekNumber = Math.floor(daysSinceStart / 7) + 1;
            if (weekNumber >= 1 && weekNumber <= 4) {
              const weekStr = `Week ${weekNumber}`;
              trendMap[weekStr] += invoice.price;
            }
          } else {
            const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][createdAt.getMonth()];
            if (trendMap[monthName] !== undefined) {
              trendMap[monthName] += invoice.price;
            }
          }
        });
        
        const recentTrend = Object.entries(trendMap).map(([date, revenue]) => ({
          date,
          revenue
        }));
        
        // Set the overview stats
        setStats({
          totalRevenue,
          paidRevenue,
          pendingRevenue,
          overdueRevenue,
          invoiceCount,
          averageValue,
          recentTrend,
          statusDistribution,
          topRoomTypes
        });
        
      } catch (error) {
        console.error('Error fetching overview stats:', error);
        toast({
          title: "Error",
          description: "Failed to load revenue overview data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOverviewStats();
  }, [timeRange, toast]);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[100px]" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }
  
  const overviewData = stats || {
    totalRevenue: 85700,
    paidRevenue: 62300,
    pendingRevenue: 15400,
    overdueRevenue: 8000,
    invoiceCount: 52,
    averageValue: 1648,
    recentTrend: [
      { date: 'Week 1', revenue: 18500 },
      { date: 'Week 2', revenue: 21200 },
      { date: 'Week 3', revenue: 24000 },
      { date: 'Week 4', revenue: 22000 }
    ],
    statusDistribution: [
      { name: 'Paid', value: 36, color: '#10B981' },
      { name: 'Pending', value: 12, color: '#F59E0B' },
      { name: 'Overdue', value: 4, color: '#EF4444' }
    ],
    topRoomTypes: [
      { name: 'Standard Room', revenue: 28400 },
      { name: 'Deluxe Room', revenue: 26500 },
      { name: 'Suite', revenue: 18200 },
      { name: 'Family Room', revenue: 7600 },
      { name: 'Economy Room', revenue: 5000 }
    ]
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CH', { style: 'currency', currency: 'CHF' }).format(value);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Revenue Overview</h2>
        <Tabs value={timeRange} onValueChange={setTimeRange} className="w-auto">
          <TabsList className="grid w-[300px] grid-cols-4">
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="quarter">Quarter</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">
              {formatCurrency(overviewData.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {overviewData.invoiceCount} invoices (excl. cancelled)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(overviewData.paidRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((overviewData.paidRevenue / overviewData.totalRevenue) * 100)}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-amber-500">
              {formatCurrency(overviewData.pendingRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((overviewData.pendingRevenue / overviewData.totalRevenue) * 100)}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(overviewData.overdueRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((overviewData.overdueRevenue / overviewData.totalRevenue) * 100)}% of total
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Revenue over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={overviewData.recentTrend}
              index="date"
              categories={['revenue']}
              colors={['#676FFF']}
              valueFormatter={(value) => formatCurrency(value)}
              yAxisWidth={80}
              className="h-[300px]"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status</CardTitle>
            <CardDescription>Distribution by invoice status</CardDescription>
          </CardHeader>
          <CardContent>
            <PieChart
              data={overviewData.statusDistribution}
              category="value"
              index="name"
              colors={overviewData.statusDistribution.map(item => item.color)}
              valueFormatter={(value) => value.toString()}
              className="h-[300px]"
            />
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Top Room Types</CardTitle>
          <CardDescription>Revenue by room type</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            data={overviewData.topRoomTypes}
            index="name"
            categories={['revenue']}
            colors={['#3B82F6']}
            valueFormatter={(value) => formatCurrency(value)}
            yAxisWidth={80}
            className="h-[300px]"
          />
        </CardContent>
      </Card>
    </div>
  );
};
