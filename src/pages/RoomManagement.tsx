
import { useState, useEffect } from "react";
import { PageTitle } from "@/components/PageTitle";
import LocationsPage from "./rooms/RoomsPage";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Building } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useAdminStatus } from "@/hooks/useAdminStatus";

const LocationManagement = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, authenticated, ready } = usePrivy();
  const { isAdmin, isLoading: isAdminLoading } = useAdminStatus(user?.id);

  useEffect(() => {
    if (ready && !authenticated && !loading) {
      console.log("Location Management - Not authenticated");
      toast({
        title: "Authentication Required",
        description: "Please sign in to access location management.",
      });
      navigate("/signin");
    }
  }, [ready, authenticated, loading, navigate, toast]);

  useEffect(() => {
    if (!isAdminLoading && !isAdmin && authenticated) {
      console.log("Location Management - Not admin");
      toast({
        title: "Access Restricted",
        description: "Only administrators can access this page.",
      });
      navigate("/book");
    }

    if (!isAdminLoading && authenticated) {
      setLoading(false);
    }
  }, [isAdmin, isAdminLoading, authenticated, navigate, toast]);

  if (loading || !ready || isAdminLoading) {
    return (
      <div className="container py-6 space-y-6">
        <PageTitle title="Location Management" icon={<Building className="h-5 w-5" />} />
        <div className="h-10 w-[400px] bg-muted animate-pulse rounded-md"></div>
        <div className="h-[300px] bg-muted/30 animate-pulse rounded-md"></div>
      </div>
    );
  }

  if (!authenticated || !isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container py-6 space-y-6">
      <PageTitle title="Location Management" icon={<Building className="h-5 w-5" />} />
      <LocationsPage />
    </div>
  );
};

export default LocationManagement;
