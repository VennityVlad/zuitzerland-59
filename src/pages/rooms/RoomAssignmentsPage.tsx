
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Grid3X3, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { PageTitle } from "@/components/PageTitle";
import { usePrivy } from "@privy-io/react-auth";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { format, addWeeks, subWeeks } from "date-fns";
import AssignmentGridCalendar from "@/components/rooms/AssignmentGridCalendar";
import PeopleSidebar from "@/components/rooms/PeopleSidebar";

const RoomAssignmentsPage = () => {
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
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

  const navigateWeek = (direction: "next" | "prev") => {
    if (direction === "next") {
      setCurrentWeek(addWeeks(currentWeek, 1));
    } else {
      setCurrentWeek(subWeeks(currentWeek, 1));
    }
  };

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
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentWeek(new Date())}>
              <Calendar className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateWeek("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-4 py-2 font-medium">
              {format(currentWeek, "MMMM d, yyyy")}
            </div>
            <Button variant="outline" size="icon" onClick={() => navigateWeek("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <PeopleSidebar />
          
          <div className="flex-1 overflow-x-auto">
            <Card className="min-h-[600px]">
              <CardContent className="p-4">
                <AssignmentGridCalendar startDate={currentWeek} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomAssignmentsPage;
