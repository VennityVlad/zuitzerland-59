
// Fix imports and add type assertion for Supabase query
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, PieChart } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RoomTypeData {
  roomType: string;
  count: number;
  revenue: number;
  averageRevenue: number;
}

export const RevenueByRoomType = () => {
  const { toast } = useToast();
  const [roomTypeData, setRoomTypeData] = useState<RoomTypeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>("year");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Define the time range filter
        let startDate;
        const now = new Date();
        
        switch (timeRange) {
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
          case 'quarter':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            break;
          case 'year':
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
          default: // all
            startDate = null;
            break;
        }
        
        // Fetch all invoices with optional time filter
        let query = supabase.from('invoices').select('*');
        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }
        
        const { data: invoices, error } = await query;

        if (error) throw error;

        if (!invoices || invoices.length === 0) {
          setRoomTypeData([]);
          return;
        }

        // Aggregate data by room type
        const roomTypeMap: Record<string, { count: number; revenue: number }> = {};
        
        invoices.forEach(invoice => {
          if (!roomTypeMap[invoice.room_type]) {
            roomTypeMap[invoice.room_type] = { count: 0, revenue: 0 };
          }
          
          roomTypeMap[invoice.room_type].count += 1;
          roomTypeMap[invoice.room_type].revenue += invoice.price;
        });
        
        // Format the data for the charts
        const formattedData = Object.entries(roomTypeMap).map(([roomType, data]) => ({
          roomType,
          count: data.count,
          revenue: data.revenue,
          averageRevenue: data.revenue / data.count
        }));
        
        // Sort by revenue (highest first)
        formattedData.sort((a, b) => b.revenue - a.revenue);
        
        setRoomTypeData(formattedData);
      } catch (error) {
        console.error('Error fetching room type revenue data:', error);
        toast({
          title: "Error",
          description: "Failed to load room type revenue data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
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

  // If no data yet, use dummy data
  const chartData = roomTypeData.length > 0 ? roomTypeData : [
    { roomType: 'Deluxe Room', count: 45, revenue: 58500, averageRevenue: 1300 },
    { roomType: 'Standard Room', count: 62, revenue: 68200, averageRevenue: 1100 },
    { roomType: 'Suite', count: 28, revenue: 50400, averageRevenue: 1800 },
    { roomType: 'Family Room', count: 35, revenue: 52500, averageRevenue: 1500 },
    { roomType: 'Economy Room', count: 40, revenue: 36000, averageRevenue: 900 }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CH', { style: 'currency', currency: 'CHF' }).format(value);
  };

  // Generate colors array for the charts
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#EC4899', '#6366F1', '#0EA5E9', '#84CC16', '#14B8A6'
  ];
  
  // Ensure we have enough colors for all room types
  while (colors.length < chartData.length) {
    colors.push(...colors);
  }

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case 'month': return 'Past Month';
      case 'quarter': return 'Past Quarter';
      case 'year': return 'Past Year';
      default: return 'All Time';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="month">Past Month</SelectItem>
            <SelectItem value="quarter">Past Quarter</SelectItem>
            <SelectItem value="year">Past Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Room Type</CardTitle>
            <CardDescription>{getTimeRangeLabel(timeRange)}</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={chartData}
              index="roomType"
              categories={['revenue']}
              colors={[colors[0]]}
              valueFormatter={(value) => formatCurrency(value)}
              yAxisWidth={80}
              className="h-[300px]"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Room Type Distribution</CardTitle>
            <CardDescription>By number of bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <PieChart
              data={chartData}
              category="count"
              index="roomType"
              colors={colors.slice(0, chartData.length)}
              valueFormatter={(value) => value.toString()}
              className="h-[300px]"
            />
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Average Revenue per Room Type</CardTitle>
          <CardDescription>{getTimeRangeLabel(timeRange)}</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            data={chartData}
            index="roomType"
            categories={['averageRevenue']}
            colors={[colors[2]]}
            valueFormatter={(value) => formatCurrency(value)}
            yAxisWidth={80}
            className="h-[300px]"
            />
        </CardContent>
      </Card>
    </div>
  );
};
