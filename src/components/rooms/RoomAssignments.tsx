
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, User, Building, Home, BedDouble, MapPin } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import AssignmentCard from "./AssignmentCard";
import EditAssignmentPanel from "./EditAssignmentPanel";

type Assignment = {
  id: string;
  profile_id: string;
  location_id: string | null;
  bedroom_id: string | null;
  bed_id: string | null;
  start_date: string;
  end_date: string;
  notes: string | null;
  location: {
    name: string;
    type: string;
  } | null;
  bedroom: {
    name: string;
  } | null;
  bed: {
    name: string;
    bed_type: string;
  } | null;
  profile: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
};

type RoomAssignmentsProps = {
  locationId?: string;
};

const RoomAssignments = ({ locationId }: RoomAssignmentsProps) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAssignments();
  }, [locationId]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('room_assignments')
        .select(`
          *,
          profile:profiles(full_name, email, avatar_url),
          location:locations(name, type),
          bedroom:bedrooms(name),
          bed:beds(name, bed_type)
        `)
        .order('start_date', { ascending: false });
      
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setAssignments(data as unknown as Assignment[]);
      setLoading(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching assignments",
        description: error.message,
      });
      setLoading(false);
    }
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsEditPanelOpen(true);
  };

  const handleAddAssignment = () => {
    setSelectedAssignment(null);
    setIsEditPanelOpen(true);
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('room_assignments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Assignment deleted",
        description: "The assignment has been deleted successfully.",
      });
      
      fetchAssignments();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting assignment",
        description: error.message,
      });
    }
  };

  const handleEditPanelClose = () => {
    setIsEditPanelOpen(false);
    setSelectedAssignment(null);
    fetchAssignments();
  };

  const getLocationIcon = (type: string | undefined) => {
    if (!type) return <Building className="h-5 w-5 text-primary" />;
    
    switch (type.toLowerCase()) {
      case 'apartment':
        return <Home className="h-5 w-5 text-primary" />;
      case 'meeting room':
        return <MapPin className="h-5 w-5 text-indigo-500" />;
      default:
        return <Building className="h-5 w-5 text-primary" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Room Assignments</h3>
            <p className="text-sm text-muted-foreground">Loading assignments...</p>
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Room Assignments
          </h3>
          <p className="text-sm text-muted-foreground">
            {assignments.length} {assignments.length === 1 ? 'assignment' : 'assignments'} found
          </p>
        </div>
        
        <Button 
          onClick={handleAddAssignment}
          disabled={!!locationId}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Assignment
        </Button>
      </div>
      
      {assignments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            {locationId 
              ? "No assignments found for this location. Click 'Add Assignment' from the main Assignments page to add the first one."
              : "No assignments found. Click 'Add Assignment' to assign a profile to a location."
            }
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <AssignmentCard 
              key={assignment.id} 
              assignment={assignment}
              onEdit={() => handleEditAssignment(assignment)}
              onDelete={() => handleDeleteAssignment(assignment.id)}
            />
          ))}
        </div>
      )}

      <Sheet open={isEditPanelOpen} onOpenChange={setIsEditPanelOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <EditAssignmentPanel 
            assignment={selectedAssignment} 
            onClose={handleEditPanelClose}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default RoomAssignments;
