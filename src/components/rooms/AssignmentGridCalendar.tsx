
import { useState, useEffect, useMemo } from "react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays, isSameDay, parseISO } from "date-fns";
import { TeamBadge } from "@/components/TeamBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import EditAssignmentPanel from "./EditAssignmentPanel";
import { ChevronLeft, ChevronRight, Trash2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  team_id: string | null;
  housing_preferences: Record<string, any> | null;
  team: {
    id: string;
    name: string;
    color: string;
    logo_url: string | null;
  } | null;
};

type Assignment = {
  id: string;
  profile_id: string;
  apartment_id: string;
  bedroom_id: string | null;
  bed_id: string | null;
  start_date: string;
  end_date: string;
  notes: string | null;
  profile: Profile;
};

type Apartment = {
  id: string;
  name: string;
  bedrooms: Bedroom[];
};

type Bedroom = {
  id: string;
  name: string;
  beds: Bed[];
};

type Bed = {
  id: string;
  name: string;
  bed_type: string;
};

type AssignmentGridCalendarProps = {
  startDate: Date;
};

const AssignmentGridCalendar = ({ startDate }: AssignmentGridCalendarProps) => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [resizingAssignment, setResizingAssignment] = useState<{id: string, direction: 'left' | 'right'} | null>(null);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [newAssignmentData, setNewAssignmentData] = useState<{
    profileId?: string;
    apartmentId?: string;
    bedroomId?: string;
    bedId?: string;
    startDate?: Date;
    endDate?: Date;
  } | null>(null);
  
  const { toast } = useToast();

  // Generate array of dates for the week
  const dates = useMemo(() => {
    const weekStart = startOfWeek(startDate, { weekStartsOn: 1 }); // Week starts on Monday
    const weekEnd = endOfWeek(startDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [startDate]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log("Starting to fetch data...");
      
      const { data: apartmentsData, error: apartmentsError } = await supabase
        .from('apartments')
        .select('id, name')
        .order('name');
      
      if (apartmentsError) {
        console.error("Error fetching apartments:", apartmentsError);
        throw apartmentsError;
      }
      
      console.log("Apartments fetched:", apartmentsData?.length || 0);

      const fullApartments: Apartment[] = [];

      for (const apartment of apartmentsData || []) {
        const { data: bedroomsData, error: bedroomsError } = await supabase
          .from('bedrooms')
          .select('id, name')
          .eq('apartment_id', apartment.id)
          .order('name');
        
        if (bedroomsError) {
          console.error("Error fetching bedrooms:", bedroomsError);
          throw bedroomsError;
        }
        
        const bedrooms: Bedroom[] = [];

        for (const bedroom of bedroomsData || []) {
          const { data: bedsData, error: bedsError } = await supabase
            .from('beds')
            .select('id, name, bed_type')
            .eq('bedroom_id', bedroom.id)
            .order('name');
          
          if (bedsError) {
            console.error("Error fetching beds:", bedsError);
            throw bedsError;
          }

          bedrooms.push({
            ...bedroom,
            beds: bedsData || []
          });
        }

        fullApartments.push({
          ...apartment,
          bedrooms
        });
      }

      setApartments(fullApartments);

      const { data: assignmentsData, error: assignmentsError } = await supabase
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
          profile:profiles(
            full_name, 
            avatar_url,
            email,
            team_id,
            housing_preferences,
            team:teams(id, name, logo_url)
          )
        `);
      
      if (assignmentsError) {
        console.error("Error fetching assignments:", assignmentsError);
        throw assignmentsError;
      }
      
      console.log("Assignments fetched:", assignmentsData?.length || 0);
      
      // Process the assignments to add team color
      const processedAssignments = assignmentsData?.map(assignment => {
        if (assignment.profile && assignment.profile.team) {
          // Generate a consistent color based on team ID
          const color = generateTeamColor(assignment.profile.team.id);
          return {
            ...assignment,
            profile: {
              ...assignment.profile,
              team: {
                ...assignment.profile.team,
                color: color
              }
            }
          };
        }
        return assignment;
      }) as Assignment[];
      
      setAssignments(processedAssignments || []);
      setLoading(false);
    } catch (error: any) {
      console.error("Error in fetchData:", error);
      toast({
        variant: "destructive",
        title: "Error fetching data",
        description: error.message,
      });
      setLoading(false);
    }
  };

  // Function to generate a consistent color based on team ID
  const generateTeamColor = (teamId: string): string => {
    // Simple hash function to generate a consistent color
    let hash = 0;
    for (let i = 0; i < teamId.length; i++) {
      hash = teamId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert to hex color
    const colors = [
      '#4F46E5', // indigo-600
      '#EC4899', // pink-600
      '#10B981', // emerald-600
      '#F59E0B', // amber-500
      '#3B82F6', // blue-500
      '#8B5CF6', // violet-500
      '#EF4444', // red-500
      '#14B8A6', // teal-500
      '#F97316', // orange-500
      '#6366F1', // indigo-500
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Get housing preference details for tooltips
  const getHousingPreferenceDetails = (profile: Profile): React.ReactNode => {
    if (!profile.housing_preferences) {
      return <p className="text-xs italic">No housing preferences set</p>;
    }
    
    // Map of preference keys to display names
    const preferenceLabels: Record<string, string> = {
      sleepSchedule: "Sleep Schedule",
      noisePreference: "Noise Preference",
      cleanliness: "Cleanliness",
      personality: "Personality Type",
      // Add more as needed
    };
    
    // Format values for display
    const formatValue = (key: string, value: any): string => {
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      // Format camelCase or snake_case to Title Case
      if (typeof value === "string") {
        return value
          .replace(/([A-Z])/g, ' $1') // camelCase to space separated
          .replace(/_/g, ' ') // snake_case to space separated
          .replace(/^\w/, c => c.toUpperCase()); // capitalize first letter
      }
      return String(value);
    };
    
    return (
      <div className="space-y-1">
        {Object.entries(profile.housing_preferences).map(([key, value]) => {
          if (!value) return null;
          const label = preferenceLabels[key] || key
            .replace(/([A-Z])/g, ' $1') // camelCase to space separated
            .replace(/^\w/, c => c.toUpperCase()); // capitalize first letter
          
          return (
            <div key={key}>
              <span className="font-medium text-xs">{label}:</span>{" "}
              <span className="text-xs">{formatValue(key, value)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const createAssignment = (profileId: string, apartmentId: string, bedroomId: string, bedId: string, startDate: Date, endDate: Date) => {
    setNewAssignmentData({
      profileId,
      apartmentId,
      bedroomId,
      bedId,
      startDate,
      endDate
    });
    setIsEditPanelOpen(true);
  };

  const updateAssignment = async (id: string, newStartDate: Date, newEndDate: Date) => {
    try {
      console.log("Updating assignment:", { id, newStartDate, newEndDate });
      const { error } = await supabase
        .from('room_assignments')
        .update({
          start_date: newStartDate.toISOString().split('T')[0],
          end_date: newEndDate.toISOString().split('T')[0],
        })
        .eq('id', id);
      
      if (error) {
        console.error("Error updating assignment:", error);
        throw error;
      }
      
      toast({
        title: "Assignment updated",
        description: "The assignment has been updated successfully.",
      });
      
      fetchData();
    } catch (error: any) {
      console.error("Error in updateAssignment:", error);
      toast({
        variant: "destructive",
        title: "Error updating assignment",
        description: error.message,
      });
    }
  };

  const deleteAssignment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) {
      return;
    }
    
    try {
      console.log("Deleting assignment:", id);
      const { error } = await supabase
        .from('room_assignments')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error("Error deleting assignment:", error);
        throw error;
      }
      
      toast({
        title: "Assignment deleted",
        description: "The assignment has been deleted successfully.",
      });
      
      fetchData();
    } catch (error: any) {
      console.error("Error in deleteAssignment:", error);
      toast({
        variant: "destructive",
        title: "Error deleting assignment",
        description: error.message,
      });
    }
  };

  const handleDrop = (e: React.DragEvent, apartmentId: string, bedroomId: string, bedId: string, date: Date) => {
    e.preventDefault();
    
    try {
      const profileData = e.dataTransfer.getData("profile");
      if (!profileData) return;
      
      const profile = JSON.parse(profileData);
      console.log("Drop event:", { apartmentId, bedroomId, bedId, date, profile });
      
      // Create a one-week assignment by default
      createAssignment(
        profile.id,
        apartmentId,
        bedroomId,
        bedId,
        date,
        addDays(date, 6)
      );
    } catch (error) {
      console.error("Error processing drop event:", error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getAssignmentForCell = (bedId: string, date: Date) => {
    return assignments.find(assignment => 
      assignment.bed_id === bedId && 
      date >= parseISO(assignment.start_date) && 
      date <= parseISO(assignment.end_date)
    );
  };

  const handleAssignmentClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsEditPanelOpen(true);
  };

  const handleResizeStart = (e: React.MouseEvent, assignmentId: string, direction: 'left' | 'right') => {
    e.stopPropagation();
    setResizingAssignment({ id: assignmentId, direction });
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeMove = (e: React.MouseEvent, date: Date) => {
    e.preventDefault();
    if (!resizingAssignment) return;

    const assignment = assignments.find(a => a.id === resizingAssignment.id);
    if (!assignment) return;

    const currentStartDate = parseISO(assignment.start_date);
    const currentEndDate = parseISO(assignment.end_date);

    if (resizingAssignment.direction === 'left') {
      if (date > currentEndDate) return;
      updateAssignment(assignment.id, date, currentEndDate);
    } else {
      if (date < currentStartDate) return;
      updateAssignment(assignment.id, currentStartDate, date);
    }
  };

  const handleMouseUp = () => {
    setResizingAssignment(null);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleEditPanelClose = () => {
    setIsEditPanelOpen(false);
    setSelectedAssignment(null);
    setNewAssignmentData(null);
    fetchData();
  };

  const hasBeds = useMemo(() => {
    return apartments.some(apt => apt.bedrooms.some(br => br.beds.length > 0));
  }, [apartments]);

  if (loading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center">
        <div className="text-muted-foreground">Loading calendar...</div>
      </div>
    );
  }

  if (!hasBeds && apartments.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <h3 className="font-medium text-lg">No apartments found</h3>
        <p className="text-muted-foreground">
          You need to create apartments, bedrooms, and beds before you can assign people to them.
        </p>
        <Button 
          onClick={() => {
            const roomsTab = document.querySelector('[value="rooms"]') as HTMLButtonElement;
            if (roomsTab) roomsTab.click();
          }}
        >
          <Home className="mr-2 h-4 w-4" />
          Create Apartments
        </Button>
      </div>
    );
  }

  if (!hasBeds && apartments.length > 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <h3 className="font-medium text-lg">No beds found</h3>
        <p className="text-muted-foreground">
          You have apartments, but you need to add bedrooms and beds to them before you can assign people.
        </p>
        <Button 
          onClick={() => {
            const roomsTab = document.querySelector('[value="rooms"]') as HTMLButtonElement;
            if (roomsTab) roomsTab.click();
          }}
        >
          <Home className="mr-2 h-4 w-4" />
          Manage Apartments
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-[200px,repeat(7,1fr)] border-b bg-muted/30">
        <div className="p-2 font-semibold border-r">Room</div>
        {dates.map((date, i) => (
          <div 
            key={i} 
            className="p-2 text-center font-medium border-r"
          >
            <div className="text-xs text-muted-foreground">{format(date, 'EEE')}</div>
            <div>{format(date, 'd MMM')}</div>
          </div>
        ))}
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {apartments.map((apartment) => (
          <div key={apartment.id} className="mb-4">
            <div className="text-lg font-semibold p-2 bg-muted/20 sticky top-0 z-10">
              {apartment.name}
            </div>
            
            {apartment.bedrooms.flatMap((bedroom) => 
              bedroom.beds.map((bed) => (
                <div key={bed.id} className="grid grid-cols-[200px,repeat(7,1fr)] border-b hover:bg-muted/10">
                  <div className="p-2 border-r flex items-center">
                    <div>
                      <div className="font-medium">{bedroom.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        {bed.name} ({bed.bed_type})
                      </div>
                    </div>
                  </div>
                  
                  {dates.map((date, dateIndex) => {
                    const assignment = getAssignmentForCell(bed.id, date);
                    const isAssignmentStart = assignment && isSameDay(parseISO(assignment.start_date), date);
                    const isAssignmentEnd = assignment && isSameDay(parseISO(assignment.end_date), date);
                    
                    if (assignment && isAssignmentStart) {
                      const daysLength = differenceInDays(parseISO(assignment.end_date), parseISO(assignment.start_date)) + 1;
                      const displayDays = Math.min(daysLength, dates.length - dateIndex);
                      const teamColor = assignment.profile.team?.color || "#94a3b8";
                      
                      return (
                        <div 
                          key={dateIndex}
                          className="relative"
                          style={{ 
                            gridColumn: `span ${displayDays}`,
                            backgroundColor: `${teamColor}10` // Very light version of team color
                          }}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div 
                                  className="absolute top-0 left-0 right-0 bottom-0 m-1 border rounded-md flex items-center justify-between cursor-pointer"
                                  style={{ borderColor: teamColor, backgroundColor: `${teamColor}30` }}
                                  onClick={() => handleAssignmentClick(assignment)}
                                >
                                  <div 
                                    className="absolute left-0 top-0 bottom-0 w-4 flex items-center justify-center cursor-ew-resize"
                                    style={{ backgroundColor: `${teamColor}50` }}
                                    onMouseDown={(e) => handleResizeStart(e, assignment.id, 'left')}
                                  >
                                    <ChevronLeft className="h-3 w-3 text-white" />
                                  </div>
                                  
                                  <div className="flex-1 px-6 py-1 truncate flex items-center justify-center">
                                    <Avatar className="h-5 w-5 mr-1 flex-shrink-0">
                                      <AvatarImage src={assignment.profile.avatar_url || undefined} />
                                      <AvatarFallback className="text-[10px]">
                                        {assignment.profile.full_name?.charAt(0) || '?'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs truncate text-center flex-1">
                                      {assignment.profile.full_name}
                                    </span>
                                  </div>
                                  
                                  <div 
                                    className="absolute right-0 top-0 bottom-0 w-4 flex items-center justify-center cursor-ew-resize"
                                    style={{ backgroundColor: `${teamColor}50` }}
                                    onMouseDown={(e) => handleResizeStart(e, assignment.id, 'right')}
                                  >
                                    <ChevronRight className="h-3 w-3 text-white" />
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-2 max-w-[300px]">
                                  <div className="space-y-1">
                                    <p className="font-semibold">{assignment.profile.full_name}</p>
                                    {assignment.profile.team && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs text-muted-foreground">Team:</span>
                                        <TeamBadge team={assignment.profile.team} size="sm" />
                                      </div>
                                    )}
                                    <div className="text-xs text-muted-foreground">
                                      {format(parseISO(assignment.start_date), 'PP')} - {format(parseISO(assignment.end_date), 'PP')}
                                    </div>
                                  </div>
                                  
                                  {assignment.profile.housing_preferences && (
                                    <div className="border-t pt-1">
                                      <p className="text-xs font-medium mb-1">Housing Preferences:</p>
                                      {getHousingPreferenceDetails(assignment.profile)}
                                    </div>
                                  )}
                                  
                                  {assignment.notes && (
                                    <div className="border-t pt-1">
                                      <p className="text-xs font-medium">Notes:</p>
                                      <p className="text-xs">{assignment.notes}</p>
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-between items-center pt-1 border-t">
                                    <p className="text-xs text-muted-foreground">Drag edges to resize</p>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteAssignment(assignment.id);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      );
                    }
                    
                    if (assignment && !isAssignmentStart) {
                      return <div key={dateIndex} />;
                    }
                    
                    return (
                      <div 
                        key={dateIndex}
                        className="border-r min-h-[60px] p-1"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, apartment.id, bedroom.id, bed.id, date)}
                      />
                    );
                  })}
                </div>
              ))
            )}
          </div>
        ))}
      </div>

      <Sheet open={isEditPanelOpen} onOpenChange={setIsEditPanelOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <EditAssignmentPanel 
            assignment={selectedAssignment} 
            initialData={newAssignmentData}
            onClose={handleEditPanelClose}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AssignmentGridCalendar;
