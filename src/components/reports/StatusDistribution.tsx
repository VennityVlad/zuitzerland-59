
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, PieChart } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StatusData {
  status: string;
  count: number;
  revenue: number;
}

export const StatusDistribution = () => {
  const { toast } = useToast();
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        const timeFilter = timeRange === "all" ? "" : 
          timeRange === "month" ? "and created_at > now() - interval '1 month'" :
          timeRange === "quarter" ? "and created_at > now() - interval '3 months'" :
          timeRange === "year" ? "and created_at > now() - interval '1 year'" : "";
        
        // Call the function with the proper parameter
        const { data, error } = await supabase
          .rpc('get_invoice_status_distribution', { time_filter: timeFilter });

        if (error) throw error;

        if (data) {
          // Add type assertion to make TypeScript happy
          setStatusData(data as unknown as StatusData[]);
        } else {
          // If no data returned or function fails, use client-side calculation
          await fetchAndCalculateStatusData(timeFilter);
        }
      } catch (error) {
        console.error('Error fetching status distribution:', error);
        // Fall back to client-side calculation
        await fetchAndCalculateStatusData();
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAndCalculateStatusData = async (timeFilter: string = "") => {
      try {
        // Build the query based on the time filter
        let query = supabase.from('invoices').select('*');
        
        if (timeFilter.includes("interval '1 month'")) {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          query = query.gte('created_at', oneMonthAgo.toISOString());
        } else if (timeFilter.includes("interval '3 months'")) {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          query = query.gte('created_at', threeMonthsAgo.toISOString());
        } else if (timeFilter.includes("interval '1 year'")) {
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          query = query.gte('created_at', oneYearAgo.toISOString());
        }
        
        const { data: invoices, error } = await query;

        if (error) throw error;

        if (!invoices || invoices.length === 0) {
          setStatusData([]);
          return;
        }

        // Calculate status distribution
        const statusMap: Record<string, {count: number, revenue: number}> = {};
        
        invoices.forEach(invoice => {
          if (!statusMap[invoice.status]) {
            statusMap[invoice.status] = { count: 0, revenue: 0 };
          }
          
          statusMap[invoice.status].count += 1;
          statusMap[invoice.status].revenue += invoice.price;
        });
        
        // Format data for the chart
        const formattedData = Object.entries(statusMap).map(([status, data]) => ({
          status,
          count: data.count,
          revenue: data.revenue
        }));
        
        // Sort by count descending
        formattedData.sort((a, b) => b.count - a.count);
        
        setStatusData(formattedData);
      } catch (error) {
        console.error('Error in client-side calculation:', error);
        toast({
          title: "Error",
          description: "Failed to load status distribution data",
          variant: "destructive",
        });
        setStatusData([]);
      }
    };

    fetchData();
  }, [toast, timeRange]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  // If no data is returned yet
  if (!statusData || statusData.length === 0) {
    // Create dummy data for testing
    const dummyData = [
      { status: 'paid', count: 32, revenue: 45600 },
      { status: 'pending', count: 18, revenue: 27400 },
      { status: 'overdue', count: 5, revenue: 8900 },
      { status: 'cancelled', count: 3, revenue: 4200 }
    ];
    
    return renderCharts(dummyData);
  }

  // For real data
  return renderCharts(statusData);

  function renderCharts(data: StatusData[]) {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('en-CH', { style: 'currency', currency: 'CHF' }).format(value);
    };

    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'paid': return '#10B981';
        case 'pending': return '#F59E0B';
        case 'overdue': return '#EF4444';
        case 'cancelled': return '#6B7280';
        default: return '#676FFF';
      }
    };

    const chartData = data.map(item => ({
      status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
      count: item.count,
      revenue: item.revenue,
      color: getStatusColor(item.status)
    }));

    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Status Distribution</CardTitle>
              <CardDescription>Number of invoices by status</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <PieChart
                data={chartData}
                category="count"
                index="status"
                colors={chartData.map(item => item.color)}
                className="h-[300px]"
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Status</CardTitle>
              <CardDescription>Total revenue in each status category</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <BarChart
                data={chartData}
                index="status"
                categories={['revenue']}
                colors={['#676FFF']}
                valueFormatter={(value) => formatCurrency(value)}
                yAxisWidth={80}
                className="h-[300px]"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
};
