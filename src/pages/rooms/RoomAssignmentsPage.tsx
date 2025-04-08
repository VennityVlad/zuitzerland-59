
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3X3, Calendar, LayoutGrid } from "lucide-react";
import AssignmentGrid from "@/components/rooms/AssignmentGrid";
import RoomAssignments from "@/components/rooms/RoomAssignments";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { PageTitle } from "@/components/PageTitle";
import { usePrivy } from "@privy-io/react-auth";
import { useAdminStatus } from "@/hooks/useAdminStatus";

const RoomAssignmentsPage = () => {
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, authenticated, ready } = usePrivy();
  const { isAdmin, isLoading: isAdminLoading } = useAdminStatus(user?.id);

  useEffect(() => {
    if (ready && !authenticated && !loading) {
      console.log("Room Assignments - Not authenticated");
      toast({
        title: "Authentication Required",
        description: "Please sign in to access room assignments.",
      });
      navigate("/signin");
    }
  }, [ready, authenticated, loading, navigate, toast]);

  useEffect(() => {
    if (!isAdminLoading && !isAdmin && authenticated) {
      console.log("Room Assignments - Not admin");
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
        <PageTitle title="Room Assignments" icon={<Grid3X3 className="h-5 w-5" />} />
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

  if (!authenticated || !isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container py-6 space-y-6">
      <PageTitle title="Room Assignments" icon={<Grid3X3 className="h-5 w-5" />} />
      
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
