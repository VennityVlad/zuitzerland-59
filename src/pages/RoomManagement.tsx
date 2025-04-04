
import { useState, useEffect } from "react";
import { PageTitle } from "@/components/PageTitle";
import RoomsPage from "./rooms/RoomsPage";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Building } from "lucide-react";

const RoomManagement = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Apartment Management - Auth status:", session ? "Authenticated" : "Not authenticated");
        setIsAuthenticated(!!session);
        setLoading(false);
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isAuthenticated === false && !loading) {
      console.log("Apartment Management - Redirecting to sign in");
      toast({
        title: "Authentication Required",
        description: "Please sign in to access apartment management.",
      });
      navigate("/signin");
    }
  }, [isAuthenticated, loading, navigate, toast]);

  if (loading) {
    return (
      <div className="container py-6 space-y-6">
        <PageTitle title="Apartment Management" icon={<Building className="h-5 w-5" />} />
        <div className="h-10 w-[400px] bg-muted animate-pulse rounded-md"></div>
        <div className="h-[300px] bg-muted/30 animate-pulse rounded-md"></div>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container py-6 space-y-6">
      <PageTitle title="Apartment Management" icon={<Building className="h-5 w-5" />} />
      <RoomsPage />
    </div>
  );
};

export default RoomManagement;
