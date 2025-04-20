
import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import EditAssignmentPanel from "./EditAssignmentPanel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Calendar } from "lucide-react";
import AddAssignmentDialog from "./AddAssignmentDialog";

type Room = {
  id: string;
  name: string;
  building: string | null;
  floor: string | null;
  bedrooms: {
    id: string;
    name: string;
    beds: {
      id: string;
      name: string;
      bed_type: string;
    }[];
  }[];
};

type Assignment = {
  id: string;
  profile_id: string;
  location_id: string;
  bedroom_id: string | null;
  bed_id: string | null;
  start_date: string;
  end_date: string;
  notes: string | null;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
};

const AssignmentGrid = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRooms();
    fetchAssignments();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select(`
          id,
          name,
          building,
          floor,
          bedrooms (
            id,
            name,
            beds (
              id,
              name,
              bed_type
            )
          )
        `)
        .order('name');
      
      if (error) throw error;
      
      setRooms(data || []);
    } catch (error: any) {
      console.error("Error fetching rooms:", error);
      toast({
        variant: "destructive",
        title: "Error fetching rooms",
        description: error.message,
      });
    }
  };

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('room_assignments')
        .select(`
          id,
          profile_id,
          location_id,
          bedroom_id,
          bed_id,
          start_date,
          end_date,
          notes,
          profile:profiles (
            id,
            full_name,
            avatar_url,
            email
          )
        `);
      
      if (error) throw error;
      
      setAssignments(data as Assignment[] || []);
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching assignments:", error);
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

  const getAssignmentForBed = (roomId: string, bedroomId: string, bedId: string) => {
    return assignments.find(a => 
      a.location_id === roomId && 
      a.bedroom_id === bedroomId && 
      a.bed_id === bedId
    );
  };

  const handleAddDialogClose = () => {
    setIsAddDialogOpen(false);
    fetchAssignments();
  };

  const handleEditPanelClose = () => {
    setIsEditPanelOpen(false);
    fetchAssignments();
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Room Assignment Grid</h2>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Filter out rooms without bedrooms or beds
  const roomsWithBeds = rooms.filter(room => 
    room.bedrooms?.some(bedroom => bedroom.beds?.length > 0)
  );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Room Assignment Grid
          </h2>
          <p className="text-sm text-muted-foreground">
            View and edit room assignments by location
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>New Assignment</Button>
      </div>

      {roomsWithBeds.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No rooms with beds found. Add bedrooms and beds to get started.
        </div>
      ) : (
        <div className="space-y-8">
          {roomsWithBeds.map(room => (
            <div key={room.id} className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-3 border-b">
                <h3 className="font-semibold">
                  {room.name}
                  {room.building && <span className="text-sm font-normal text-muted-foreground ml-2">({room.building}{room.floor ? `, Floor ${room.floor}` : ''})</span>}
                </h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Bedroom</TableHead>
                    <TableHead className="w-[200px]">Bed</TableHead>
                    <TableHead className="w-[250px]">Assigned To</TableHead>
                    <TableHead className="hidden md:table-cell">Dates</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {room.bedrooms?.flatMap(bedroom => 
                    bedroom.beds?.map(bed => {
                      const assignment = getAssignmentForBed(room.id, bedroom.id, bed.id);
                      return (
                        <TableRow key={`${bedroom.id}-${bed.id}`}>
                          <TableCell className="font-medium">{bedroom.name}</TableCell>
                          <TableCell>{bed.name} <span className="text-xs text-muted-foreground">({bed.bed_type})</span></TableCell>
                          <TableCell>
                            {assignment ? (
                              <div 
                                className="flex items-center gap-3 cursor-pointer" 
                                onClick={() => handleEditAssignment(assignment)}
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={assignment.profile?.avatar_url || undefined} />
                                  <AvatarFallback>
                                    {assignment.profile?.full_name?.charAt(0) || '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{assignment.profile?.full_name || "Unknown User"}</p>
                                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                    {assignment.profile?.email}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <Button 
                                variant="ghost" 
                                className="text-muted-foreground h-auto p-2"
                                onClick={() => setIsAddDialogOpen(true)}
                              >
                                Unassigned
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {assignment ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm">
                                  {new Date(assignment.start_date).toLocaleDateString()} - {new Date(assignment.end_date).toLocaleDateString()}
                                </span>
                                
                                {assignment.notes && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Info className="h-4 w-4 text-muted-foreground" />
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        <p className="max-w-xs">{assignment.notes}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      )}

      {/* Add Assignment Dialog */}
      <AddAssignmentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddDialogClose}
      />
      
      {/* Edit Assignment Panel */}
      <Sheet open={isEditPanelOpen} onOpenChange={setIsEditPanelOpen}>
        <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto">
          <EditAssignmentPanel 
            assignment={selectedAssignment}
            onClose={handleEditPanelClose}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AssignmentGrid;
