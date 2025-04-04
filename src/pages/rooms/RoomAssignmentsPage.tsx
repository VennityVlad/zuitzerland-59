
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Calendar, LayoutGrid } from "lucide-react";
import AssignmentGrid from "@/components/rooms/AssignmentGrid";
import RoomAssignments from "@/components/rooms/RoomAssignments";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle } from "@/components/PageTitle";

const RoomAssignmentsPage = () => {
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Auth session:", session ? "Authenticated" : "Not authenticated");
        setIsAuthenticated(!!session);
        setLoading(false);
      } catch (error) {
        console.error("Error checking authentication:", error);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Please try signing in again.",
        });
        setIsAuthenticated(false);
        setLoading(false);
      }
    };

    checkAuth();
  }, [toast]);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isAuthenticated === false && !loading) {
      console.log("Redirecting to sign in page");
      toast({
        title: "Authentication Required",
        description: "Please sign in to view room assignments.",
      });
      navigate("/signin");
    }
  }, [isAuthenticated, loading, navigate, toast]);

  if (loading) {
    return (
      <div className="container py-6 space-y-6">
        <PageTitle title="Room Assignments" />
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Room Assignments</h2>
            <div className="w-[250px] h-10 bg-muted animate-pulse rounded-md"></div>
          </div>
          <Card>
            <CardContent className="p-4 min-h-[300px] flex items-center justify-center">
              <div className="text-muted-foreground">Loading assignments...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container py-6 space-y-6">
      <PageTitle title="Room Assignments" />
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Room Assignments</h2>
          
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "grid")} className="w-[250px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grid">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Grid
              </TabsTrigger>
              <TabsTrigger value="list">
                <Calendar className="h-4 w-4 mr-2" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card>
          <CardContent className="p-4">
            <TabsContent value="grid" className="mt-0">
              <AssignmentGrid />
            </TabsContent>
            
            <TabsContent value="list" className="mt-0">
              <RoomAssignments />
            </TabsContent>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoomAssignmentsPage;
