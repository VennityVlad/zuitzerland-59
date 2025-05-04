
import { useState, useEffect, useMemo } from "react";
import { useSupabaseJwt } from "@/components/SupabaseJwtProvider";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { usePaidInvoiceStatus } from "@/hooks/usePaidInvoiceStatus";
import { PageTitle } from "@/components/PageTitle";
import { CreateAppSheet } from "@/components/zulink/CreateAppSheet";
import { AppCard } from "@/components/zulink/AppCard";
import { AppsFilter } from "@/components/zulink/AppsFilter";
import { useToast } from "@/hooks/use-toast";
import { AppWindow, Loader2 } from "lucide-react";

interface AppData {
  id: string;
  name: string;
  url: string;
  description: string | null;
  image_url: string | null;
  status: string;
  created_by: string;
  created_at: string;
  approved_at: string | null;
}

export default function ZuLinkApps() {
  const [apps, setApps] = useState<AppData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { authenticatedSupabase, isAuthenticated } = useSupabaseJwt();
  const { toast } = useToast();
  
  // Fix: Get user ID from session instead of accessing .user directly
  const [userId, setUserId] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (authenticatedSupabase) {
      authenticatedSupabase.auth.getSession().then(({ data }) => {
        setUserId(data.session?.user.id);
      });
    }
  }, [authenticatedSupabase]);
  
  const { isAdmin } = useAdminStatus(userId);
  const { hasPaidInvoice, isLoading: isInvoiceLoading } = usePaidInvoiceStatus(userId);

  const fetchApps = async () => {
    if (!authenticatedSupabase) return;
    
    setLoading(true);
    try {
      const { data, error } = await authenticatedSupabase
        .from('zulink_apps')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setApps(data || []);
    } catch (error) {
      console.error("Error fetching apps:", error);
      toast({
        title: "Error loading apps",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchApps();
    }
  }, [isAuthenticated, authenticatedSupabase]);

  const filteredApps = useMemo(() => {
    if (!apps || !userId) return [];

    switch (filter) {
      case "pending":
        return apps.filter(app => app.status === "pending");
      case "my":
        return apps.filter(app => app.created_by === userId);
      default:
        // For "all", regular users see only approved apps, admins see all
        return isAdmin 
          ? apps 
          : apps.filter(app => 
              app.status === "approved" || app.created_by === userId
            );
    }
  }, [apps, filter, isAdmin, userId]);

  const pendingAppsCount = useMemo(() => {
    return apps.filter(app => app.status === "pending").length;
  }, [apps]);

  const myAppsCount = useMemo(() => {
    if (!userId) return 0;
    return apps.filter(app => app.created_by === userId).length;
  }, [apps, userId]);

  if (!isAuthenticated) {
    return (
      <div className="container py-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Please sign in to access ZuLink Apps</h2>
      </div>
    );
  }

  return (
    <div>
      <PageTitle 
        title="ZuLink Apps" 
        description="Discover and share useful applications"
        icon={<AppWindow size={24} />}
        actions={
          <CreateAppSheet 
            onAppCreated={fetchApps}
            hasPaidInvoice={hasPaidInvoice}
          />
        }
      />

      <div className="container py-6">
        <AppsFilter 
          onFilterChange={setFilter}
          filter={filter}
          isAdmin={isAdmin}
          pendingCount={pendingAppsCount}
          myAppsCount={myAppsCount}
        />

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredApps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredApps.map((app) => (
              <AppCard
                key={app.id}
                id={app.id}
                name={app.name}
                url={app.url}
                description={app.description}
                imageUrl={app.image_url}
                status={app.status}
                isAdmin={isAdmin}
                createdBy={app.created_by}
                onStatusUpdate={fetchApps}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-500 mb-2">
              {filter === "pending" ? "No pending apps found" : 
               filter === "my" ? "You haven't submitted any apps yet" : 
               "No apps available"}
            </h3>
            <p className="text-gray-400">
              {filter === "my" && hasPaidInvoice ? "Click 'Submit App' to add your first app" : 
               filter === "my" && !hasPaidInvoice ? "You need a paid invoice to submit apps" : 
               "Check back later for new additions"}
            </p>
          </div>
        )}

        {!hasPaidInvoice && !isInvoiceLoading && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="font-medium text-yellow-800">Want to submit your app?</h3>
            <p className="text-yellow-700 text-sm mt-1">
              You need to have a paid invoice to submit apps to the ZuLink App Store.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
