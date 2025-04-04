
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User, BedDouble, Building } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Assignment = {
  id: string;
  profile_id: string;
  apartment_id: string | null;
  bedroom_id: string | null;
  bed_id: string | null;
  start_date: string;
  end_date: string;
  notes: string | null;
  profile: {
    full_name: string | null;
    email: string | null;
  };
  bedroom?: {
    name: string;
  } | null;
  bed?: {
    name: string;
    bed_type: string;
  } | null;
};

type RoomAssignmentsProps = {
  apartmentId: string;
};

const RoomAssignments = ({ apartmentId }: RoomAssignmentsProps) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('room_assignments')
        .select(`
          id,
          profile_id,
          apartment_id,
          bedroom_id,
          bed_id,
          start_date,
          end_date,
          notes,
          profile:profiles(full_name, email),
          bedroom:bedrooms(name),
          bed:beds(name, bed_type)
        `)
        .eq('apartment_id', apartmentId)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      
      setAssignments(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching assignments",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [apartmentId]);

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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">Loading assignments...</div>
        </CardContent>
      </Card>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No assignments found for this room. Use the Assignments page to allocate users to this room.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {assignments.map(assignment => (
        <Card key={assignment.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-[1fr_auto] border-b">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">
                    {assignment.profile.full_name || assignment.profile.email || "Unnamed user"}
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Check-in</p>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>{format(new Date(assignment.start_date), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Check-out</p>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>{format(new Date(assignment.end_date), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
                
                {assignment.bedroom && (
                  <div className="mt-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Door className="h-3 w-3 text-muted-foreground" />
                      <span>{assignment.bedroom.name}</span>
                      
                      {assignment.bed && (
                        <>
                          <span className="mx-1">•</span>
                          <BedDouble className="h-3 w-3 text-muted-foreground" />
                          <span>{assignment.bed.name}</span>
                          <span className="text-xs px-1 py-0.5 bg-primary/10 text-primary rounded ml-1">
                            {assignment.bed.bed_type}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {assignment.notes && (
                  <p className="mt-2 text-sm text-muted-foreground">{assignment.notes}</p>
                )}
              </div>
              
              <div className="flex items-center p-4">
                <Button variant="ghost" size="sm" onClick={() => handleDeleteAssignment(assignment.id)}>
                  Remove
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RoomAssignments;
