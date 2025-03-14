
import { useEffect, useState } from "react";
import { PageTitle } from "@/components/PageTitle";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueOverview } from "@/components/reports/RevenueOverview";
import { StatusDistribution } from "@/components/reports/StatusDistribution";
import { RevenueByPeriod } from "@/components/reports/RevenueByPeriod";
import { UpcomingInvoices } from "@/components/reports/UpcomingInvoices";
import { Invoice } from "@/types/invoice";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecentTransactions } from "@/components/reports/RecentTransactions";
import { format, subMonths } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

const Reports = () => {
  const { user } = usePrivy();
  const [isAdmin, setIsAdmin] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) {
        navigate("/");
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('privy_id', user.id)
          .maybeSingle();

        if (error) throw error;
        
        const userIsAdmin = data?.role === 'admin';
        setIsAdmin(userIsAdmin);
        
        if (!userIsAdmin) {
          navigate("/");
          return;
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        navigate("/");
      }
    };

    checkAdminStatus();
  }, [user, navigate]);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!isAdmin) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setInvoices(data || []);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAdmin) {
      fetchInvoices();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return null;
  }

  const today = new Date();
  const sixMonthsAgo = subMonths(today, 6);

  return (
    <div className="flex flex-col h-full">
      <PageTitle title="Sales Reports" />
      <div className={`py-4 ${isMobile ? 'px-2' : 'px-6'} flex-grow`}>
        <div className={`container ${isMobile ? 'mx-0 max-w-none' : 'mx-auto'}`}>
          <Tabs defaultValue="overview" className="w-full space-y-6">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <Skeleton className="h-5 w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-8 w-1/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <RevenueOverview invoices={invoices} />
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {isLoading ? (
                  <>
                    <Card>
                      <CardHeader>
                        <Skeleton className="h-5 w-1/3" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-[200px] w-full" />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <Skeleton className="h-5 w-1/3" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-[200px] w-full" />
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Revenue by Month</CardTitle>
                        <CardDescription>
                          {format(sixMonthsAgo, "MMM yyyy")} - {format(today, "MMM yyyy")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <RevenueByPeriod invoices={invoices} />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Invoice Status Distribution</CardTitle>
                        <CardDescription>
                          Breakdown of current invoice statuses
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <StatusDistribution invoices={invoices} />
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>
                      The latest invoice activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : (
                      <RecentTransactions invoices={invoices.slice(0, 5)} />
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Revenue Tab */}
            <TabsContent value="revenue" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Revenue Trends</CardTitle>
                  <CardDescription>
                    Six-month revenue analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  {isLoading ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <RevenueByPeriod invoices={invoices} showMonthlyTrend={true} />
                  )}
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Room Type</CardTitle>
                    <CardDescription>
                      Revenue distribution across different room types
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {isLoading ? (
                      <Skeleton className="h-full w-full" />
                    ) : (
                      <StatusDistribution 
                        invoices={invoices} 
                        showRoomTypeRevenue={true}
                      />
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Status-based Revenue</CardTitle>
                    <CardDescription>
                      Revenue by invoice status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {isLoading ? (
                      <Skeleton className="h-full w-full" />
                    ) : (
                      <StatusDistribution 
                        invoices={invoices} 
                        showStatusRevenue={true}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Invoices Tab */}
            <TabsContent value="invoices" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Due Invoices</CardTitle>
                    <CardDescription>
                      Invoices due in the next 30 days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : (
                      <UpcomingInvoices invoices={invoices} />
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Overdue Invoices</CardTitle>
                    <CardDescription>
                      Invoices past their due date
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : (
                      <UpcomingInvoices 
                        invoices={invoices.filter(inv => inv.status === 'overdue')}
                        showOverdue={true}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Reports;
