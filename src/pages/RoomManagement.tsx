
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageTitle } from "@/components/PageTitle";
import RoomsPage from "./rooms/RoomsPage";
import AssignmentsPage from "./rooms/AssignmentsPage";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const RoomManagement = () => {
  const [activeTab, setActiveTab] = useState("rooms");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Room Management - Auth status:", session ? "Authenticated" : "Not authenticated");
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
      console.log("Room Management - Redirecting to sign in");
      toast({
        title: "Authentication Required",
        description: "Please sign in to access room management.",
      });
      navigate("/signin");
    }
  }, [isAuthenticated, loading, navigate, toast]);

  if (loading) {
    return (
      <div className="container py-6 space-y-6">
        <PageTitle title="Room Management" />
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
      <PageTitle title="Room Management" />
      
      <Tabs defaultValue="rooms" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="rooms">Apartments</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rooms" className="mt-6">
          <RoomsPage />
        </TabsContent>
        
        <TabsContent value="assignments" className="mt-6">
          <AssignmentsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoomManagement;
