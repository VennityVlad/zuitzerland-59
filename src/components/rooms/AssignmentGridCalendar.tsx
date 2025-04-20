import { useState, useEffect, useMemo } from "react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays, isSameDay, parseISO, parse, isAfter, isBefore, isWithinInterval } from "date-fns";
import { TeamBadge } from "@/components/TeamBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import EditAssignmentPanel from "./EditAssignmentPanel";
import { ChevronLeft, ChevronRight, Trash2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  location_id: string;
  bedroom_id: string | null;
  bed_id: string | null;
  start_date: string;
  end_date: string;
  notes: string | null;
  profile: Profile;
};

type Location = {
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
  onAssignmentChange?: () => void;
};

const AssignmentGridCalendar = ({ startDate, onAssignmentChange }: AssignmentGridCalendarProps) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [resizingState, setResizingState] = useState<{
    id: string | null;
    direction: 'left' | 'right' | null;
    active: boolean;
    initialMouseX: number | null;
    initialStartDate: Date | null;
    initialEndDate: Date | null;
  }>({
    id: null,
    direction: null,
    active: false,
    initialMouseX: null,
    initialStartDate: null,
    initialEndDate: null
  });
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [newAssignmentData, setNewAssignmentData] = useState<{
    profileId?: string;
    locationId?: string;
    bedroomId?: string;
    bedId?: string;
    startDate?: Date;
    endDate?: Date;
  } | null>(null);
  
  const { toast } = useToast();

  const dates = useMemo(() => {
    const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(startDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [startDate]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (resizingState.active) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingState.active]);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log("Starting to fetch data...");
      
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');
      
      if (locationsError) {
        console.error("Error fetching locations:", locationsError);
        throw locationsError;
      }
      
      console.log("Locations fetched:", locationsData?.length || 0);

      const fullLocations: Location[] = [];

      for (const location of locationsData || []) {
        const { data: bedroomsData, error: bedroomsError } = await supabase
          .from('bedrooms')
          .select('id, name')
          .eq('location_id', location.id)
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

        fullLocations.push({
          ...location,
          bedrooms
        });
      }

      setLocations(fullLocations);

      const { data: assignmentsData, error: assignmentsError } = await supabase
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
          profile:profiles(
            id,
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
      
      const processedAssignments = assignmentsData?.map(assignment => {
        if (assignment.profile && assignment.profile.team) {
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

  const generateTeamColor = (teamId: string): string => {
    let hash = 0;
    for (let i = 0; i < teamId.length; i++) {
      hash = teamId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      '#4F46E5',
      '#EC4899',
      '#10B981',
      '#F59E0B',
      '#3B82F6',
      '#8B5CF6',
      '#EF4444',
      '#14B8A6',
      '#F97316',
      '#6366F1',
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  const getHousingPreferenceDetails = (profile: Profile): React.ReactNode => {
    if (!profile.housing_preferences) {
      return <p className="text-xs italic">No housing preferences set</p>;
    }
    
    const preferenceLabels: Record<string, string> = {
      sleepSchedule: "Sleep Schedule",
      noisePreference: "Noise Preference",
      cleanliness: "Cleanliness",
      personality: "Personality Type",
    };
    
    const formatValue = (key: string, value: any): string => {
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      if (typeof value === "string") {
        return value
          .replace(/([A-Z])/g, ' $1')
          .replace(/_/g, ' ')
          .replace(/^\w/, c => c.toUpperCase());
      }
      return String(value);
    };
    
    return (
      <div className="space-y-1">
        {Object.entries(profile.housing_preferences).map(([key, value]) => {
          if (!value) return null;
          const label = preferenceLabels[key] || key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^\w/, c => c.toUpperCase());
          
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

  const createAssignment = (profileId: string, locationId: string, bedroomId: string, bedId: string, startDate: Date, endDate: Date) => {
    setNewAssignmentData({
      profileId,
      locationId,
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
      
      if (onAssignmentChange) {
        onAssignmentChange();
      }
    } catch (error: any) {
      console.error("Error in deleteAssignment:", error);
      toast({
        variant: "destructive",
        title: "Error deleting assignment",
        description: error.message,
      });
    }
  };

  const handleDrop = (e: React.DragEvent, locationId: string, bedroomId: string, bedId: string, date: Date) => {
    e.preventDefault();
    
    try {
      const profileData = e.dataTransfer.getData("profile");
      if (!profileData) return;
      
      const profile = JSON.parse(profileData);
      console.log("Drop event:", { locationId, bedroomId, bedId, date, profile });
      
      createAssignment(
        profile.id,
        locationId,
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

  const handleAssignmentClick = (assignment: Assignment, e: React.MouseEvent) => {
    if (!resizingState.active) {
      setSelectedAssignment(assignment);
      setIsEditPanelOpen(true);
    }
    e.stopPropagation();
  };

  const handleResizeStart = (e: React.MouseEvent, assignmentId: string, direction: 'left' | 'right') => {
    e.stopPropagation();
    e.preventDefault();
    
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    setResizingState({
      id: assignmentId,
      direction,
      active: true,
      initialMouseX: e.clientX,
      initialStartDate: parseISO(assignment.start_date),
      initialEndDate: parseISO(assignment.end_date)
    });
  };

  const adjustDisplayDaysForAssignment = (assignment: Assignment, dateIndex: number, dates: Date[]) => {
    const assignmentStart = parseISO(assignment.start_date);
    const assignmentEnd = parseISO(assignment.end_date);
    const totalDaysLength = differenceInDays(assignmentEnd, assignmentStart) + 1;
    
    const daysRemainingInView = dates.length - dateIndex;
    
    return Math.min(totalDaysLength, daysRemainingInView);
  };

  const isAssignmentContinuingBeyondView = (assignment: Assignment, dateIndex: number, dates: Date[]) => {
    const assignmentEnd = parseISO(assignment.end_date);
    const visibleEnd = dates[dates.length - 1];
    return isAfter(assignmentEnd, visibleEnd);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizingState.active || !resizingState.initialMouseX || 
        !resizingState.initialStartDate || !resizingState.initialEndDate || 
        !resizingState.id || !resizingState.direction) {
      return;
    }

    e.preventDefault();
    
    const dayWidth = 100;
    const deltaX = e.clientX - resizingState.initialMouseX;
    const dayDelta = Math.round(deltaX / dayWidth);
    
    if (dayDelta === 0) return;

    const assignment = assignments.find(a => a.id === resizingState.id);
    if (!assignment) return;
    
    let newStartDate = resizingState.initialStartDate;
    let newEndDate = resizingState.initialEndDate;
    
    if (resizingState.direction === 'left') {
      newStartDate = addDays(resizingState.initialStartDate, dayDelta);
      if (newStartDate >= newEndDate) {
        newStartDate = addDays(newEndDate, -1);
      }
    } else {
      newEndDate = addDays(resizingState.initialEndDate, dayDelta);
      if (newEndDate <= newStartDate) {
        newEndDate = addDays(newStartDate, 1);
      }
    }
    
    const updatedAssignments = assignments.map(a => {
      if (a.id === resizingState.id) {
        return {
          ...a,
          start_date: newStartDate.toISOString().split('T')[0],
          end_date: newEndDate.toISOString().split('T')[0]
        };
      }
      return a;
    });
    
    setAssignments(updatedAssignments);
  };

  const handleMouseUp = async () => {
    if (!resizingState.active || !resizingState.id) {
      return;
    }
    
    const assignment = assignments.find(a => a.id === resizingState.id);
    if (!assignment) return;
    
    try {
      await updateAssignment(
        resizingState.id,
        parseISO(assignment.start_date),
        parseISO(assignment.end_date)
      );
    } catch (error) {
      console.error("Error updating assignment during resize:", error);
    }
    
    setResizingState({
      id: null,
      direction: null,
      active: false,
      initialMouseX: null,
      initialStartDate: null,
      initialEndDate: null
    });
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded-md mb-4 w-1/3 mx-auto"></div>
          <div className="h-[500px] bg-muted/50 rounded-md"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
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
        {locations.map((location) => (
          <div key={location.id} className="mb-4">
            <div className="text-lg font-semibold p-2 bg-muted/20 sticky top-0 z-10">
              {location.name}
            </div>
            
            {location.bedrooms.flatMap((bedroom) => 
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
                    const continuesBeyondView = assignment && isAssignmentStart && 
                      isAssignmentContinuingBeyondView(assignment, dateIndex, dates);
                    
                    if (assignment && isAssignmentStart) {
                      const displayDays = adjustDisplayDaysForAssignment(assignment, dateIndex, dates);
                      const teamColor = assignment.profile.team?.color || "#94a3b8";
                      
                      return (
                        <div 
                          key={dateIndex}
                          className="relative"
                          style={{ gridColumn: `span ${displayDays}` }}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div 
                                  className="absolute top-0 left-0 right-0 bottom-0 m-1 border rounded-md flex items-center justify-between cursor-pointer"
                                  style={{ borderColor: teamColor, backgroundColor: `${teamColor}30` }}
                                  onClick={(e) => handleAssignmentClick(assignment, e)}
                                >
                                  <div 
                                    className="absolute left-0 top-0 bottom-0 w-4 flex items-center justify-center cursor-ew-resize"
                                    style={{ backgroundColor: `${teamColor}50` }}
                                    onMouseDown={(e) => handleResizeStart(e, assignment.id, 'left')}
                                  >
                                    <ChevronLeft className="h-3 w-3 text-white" />
                                  </div>
                                  
                                  <div className="flex-1 px-6 py-1 truncate flex flex-col items-center justify-center">
                                    <div className="flex items-center gap-1">
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
                                    {assignment.profile.email && (
                                      <span className="text-[10px] truncate text-muted-foreground">
                                        {assignment.profile.email}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {(!continuesBeyondView) ? (
                                    <div 
                                      className="absolute right-0 top-0 bottom-0 w-4 flex items-center justify-center cursor-ew-resize"
                                      style={{ backgroundColor: `${teamColor}50` }}
                                      onMouseDown={(e) => handleResizeStart(e, assignment.id, 'right')}
                                    >
                                      <ChevronRight className="h-3 w-3 text-white" />
                                    </div>
                                  ) : (
                                    <div 
                                      className="absolute right-0 top-0 bottom-0 w-2 flex items-center justify-center"
                                      style={{ backgroundColor: `${teamColor}50` }}
                                    >
                                    </div>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-2 max-w-[300px]">
                                  <div className="space-y-1">
                                    <p className="font-semibold">{assignment.profile.full_name}</p>
                                    <p className="text-xs">{assignment.profile.email}</p>
                                    {assignment.profile.team && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs text-muted-foreground">Team:</span>
                                        <TeamBadge team={assignment.profile.team} size="sm" />
                                      </div>
                                    )}
                                    <div className="text-xs text-muted-foreground">
                                      {format(parseISO(assignment.start_date), 'PP')} - {format(parseISO(assignment.end_date), 'PP')}
                                      {continuesBeyondView && " (continues beyond current view)"}
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
                        onDrop={(e) => handleDrop(e, location.id, bedroom.id, bed.id, date)}
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
            onClose={() => {
              setIsEditPanelOpen(false);
              setNewAssignmentData(null);
              fetchData();
              if (onAssignmentChange) {
                onAssignmentChange();
              }
            }} 
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AssignmentGridCalendar;
