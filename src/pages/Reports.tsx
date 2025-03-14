
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle } from "@/components/PageTitle";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RevenueOverview } from "@/components/reports/RevenueOverview";
import { StatusDistribution } from "@/components/reports/StatusDistribution";
import { MonthlyRevenue } from "@/components/reports/MonthlyRevenue";
import { RevenueByRoomType } from "@/components/reports/RevenueByRoomType";
import { PaymentForecast } from "@/components/reports/PaymentForecast";
import { CardSkeleton } from "@/components/reports/CardSkeleton";

const Reports = () => {
  const { user } = usePrivy();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('privy_id', user.id)
          .maybeSingle();

        if (error) throw error;
        
        setIsAdmin(data?.role === 'admin');
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to verify admin access",
          variant: "destructive",
        });
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user?.id, toast]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageTitle title="Revenue Reports" />
        <div className={`py-4 ${isMobile ? 'px-0' : 'px-4'} flex-grow`}>
          <div className={`container ${isMobile ? 'mx-0 max-w-none' : 'mx-auto'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <CardSkeleton className="lg:col-span-2" height="md" />
              <CardSkeleton height="md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect non-admin users
  if (isAdmin === false) {
    toast({
      title: "Access Denied",
      description: "You need admin privileges to view this page",
      variant: "destructive",
    });
    return <Navigate to="/book" replace />;
  }

  return (
    <div className="flex flex-col h-full">
      <PageTitle title="Revenue Reports" />
      <div className={`py-4 ${isMobile ? 'px-0' : 'px-4'} flex-grow`}>
        <div className={`container ${isMobile ? 'mx-0 max-w-none' : 'mx-auto'}`}>
          <div className={`bg-white ${isMobile ? 'mobile-full-width' : 'rounded-lg shadow-lg'} p-4 md:p-6`}>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="status">By Status</TabsTrigger>
                <TabsTrigger value="room-types">By Room Type</TabsTrigger>
                <TabsTrigger value="forecast">Forecast</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <RevenueOverview />
              </TabsContent>
              
              <TabsContent value="monthly" className="space-y-4">
                <MonthlyRevenue />
              </TabsContent>
              
              <TabsContent value="status" className="space-y-4">
                <StatusDistribution />
              </TabsContent>
              
              <TabsContent value="room-types" className="space-y-4">
                <RevenueByRoomType />
              </TabsContent>
              
              <TabsContent value="forecast" className="space-y-4">
                <PaymentForecast />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
