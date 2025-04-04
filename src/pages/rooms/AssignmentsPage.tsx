
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Search, Calendar, User, BedDouble, Building } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import AssignmentCard from "@/components/rooms/AssignmentCard";
import AddAssignmentDialog from "@/components/rooms/AddAssignmentDialog";
import { DateRange } from "@/components/ui/calendar";

type Assignment = {
  id: string;
  profile_id: string;
  apartment_id: string | null;
  bedroom_id: string | null;
  bed_id: string | null;
  start_date: string;
  end_date: string;
  notes: string | null;
  apartment: {
    name: string;
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
  };
};

const AssignmentsPage = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState<DateRange | undefined>();
  const [filterRoom, setFilterRoom] = useState<string>("all");
  const [rooms, setRooms] = useState<{id: string, name: string}[]>([]);
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
          apartment:apartments(name),
          bedroom:bedrooms(name),
          bed:beds(name, bed_type),
          profile:profiles(full_name, email)
        `)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      
      setAssignments(data || []);
      setFilteredAssignments(data || []);
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

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('apartments')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      
      setRooms(data || []);
    } catch (error: any) {
      console.error("Error fetching rooms:", error);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchRooms();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterDate, filterRoom, assignments]);

  const applyFilters = () => {
    let filtered = [...assignments];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(assignment => 
        assignment.profile.full_name?.toLowerCase().includes(term) ||
        assignment.profile.email?.toLowerCase().includes(term) ||
        assignment.apartment?.name.toLowerCase().includes(term) ||
        assignment.bedroom?.name.toLowerCase().includes(term) ||
        assignment.bed?.name.toLowerCase().includes(term)
      );
    }
    
    // Apply date filter
    if (filterDate?.from) {
      const fromDate = new Date(filterDate.from);
      filtered = filtered.filter(assignment => {
        const endDate = new Date(assignment.end_date);
        return endDate >= fromDate;
      });
    }
    
    if (filterDate?.to) {
      const toDate = new Date(filterDate.to);
      filtered = filtered.filter(assignment => {
        const startDate = new Date(assignment.start_date);
        return startDate <= toDate;
      });
    }
    
    // Apply room filter
    if (filterRoom !== "all") {
      filtered = filtered.filter(assignment => 
        assignment.apartment_id === filterRoom
      );
    }
    
    setFilteredAssignments(filtered);
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

  const handleAddAssignment = () => {
    fetchAssignments();
    setAddDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold">Room Assignments</h2>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Assignment
        </Button>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or room..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select
              value={filterRoom}
              onValueChange={(value) => setFilterRoom(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by room" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                {rooms.map(room => (
                  <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center whitespace-nowrap">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="mr-2">Date Range:</span>
              <AddAssignmentDialog 
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onSubmit={handleAddAssignment}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Assignment List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="animate-pulse">Loading assignments...</div>
            </CardContent>
          </Card>
        ) : filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No assignments found matching the selected filters.</p>
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map(assignment => (
            <AssignmentCard 
              key={assignment.id}
              assignment={assignment}
              onDelete={() => handleDeleteAssignment(assignment.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AssignmentsPage;
