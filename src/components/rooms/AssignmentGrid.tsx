import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { format, addDays, startOfMonth, eachDayOfInterval, differenceInDays, isSameDay } from "date-fns";
import { TeamBadge } from "@/components/TeamBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User, Calendar, GripHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import EditAssignmentPanel from "./EditAssignmentPanel";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  team?: {
    id: string;
    name: string;
    logo_url: string | null;
    color: string;
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
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
    team_id: string | null;
    team?: {
      id: string;
      name: string;
      logo_url: string | null;
      color: string;
    } | null;
  };
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

type AssignmentGridProps = {
  startDate?: Date;
  daysToShow?: number;
};

const AssignmentGrid = ({ 
  startDate = new Date(), 
  daysToShow = 30 
}: AssignmentGridProps) => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfiles, setShowProfiles] = useState(true);
  const [draggedProfile, setDraggedProfile] = useState<Profile | null>(null);
  const [resizingAssignment, setResizingAssignment] = useState<{id: string, direction: 'left' | 'right'} | null>(null);
  const { toast } = useToast();
  
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

  const dates = useMemo(() => {
    return eachDayOfInterval({
      start: startDate,
      end: addDays(startDate, daysToShow - 1)
    });
  }, [startDate, daysToShow]);

  useEffect(() => {
    console.log("Fetching data for AssignmentGrid");
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
        
        console.log(`Bedrooms for apartment ${apartment.name}:`, bedroomsData?.length || 0);

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
          
          console.log(`Beds for bedroom ${bedroom.name}:`, bedsData?.length || 0);

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
      console.log("Full apartments data:", fullApartments);

      const { data: profilesWithPaidInvoices, error: invoiceError } = await supabase
        .from('invoices')
        .select('profile_id')
        .eq('status', 'paid')
        .not('profile_id', 'is', null);
      
      if (invoiceError) {
        console.error("Error fetching paid invoices:", invoiceError);
        throw invoiceError;
      }
      
      const paidProfileIds = profilesWithPaidInvoices
        .map(invoice => invoice.profile_id)
        .filter(Boolean)
        .filter((value, index, self) => self.indexOf(value) === index);
      
      let profilesData: any[] = [];
      
      if (paidProfileIds.length > 0) {
        const { data, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id, 
            full_name, 
            avatar_url,
            email,
            team_id,
            team:teams(id, name, logo_url)
          `)
          .in('id', paidProfileIds)
          .order('full_name');
        
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          throw profilesError;
        }
        
        profilesData = data || [];
      }
      
      console.log("Profiles fetched:", profilesData.length);
      
      const profilesWithTeamColors = profilesData.map(profile => {
        if (profile.team) {
          const color = generateTeamColor(profile.team.id);
          return {
            ...profile,
            team: {
              ...profile.team,
              color
            }
          };
        }
        return profile;
      });
      
      setProfiles(profilesWithTeamColors || []);

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
            team:teams(id, name, logo_url)
          )
        `);
      
      if (assignmentsError) {
        console.error("Error fetching assignments:", assignmentsError);
        throw assignmentsError;
      }
      
      const assignmentsWithTeamColors = assignmentsData?.map(assignment => {
        if (assignment.profile && assignment.profile.team) {
          const color = generateTeamColor(assignment.profile.team.id);
          return {
            ...assignment,
            profile: {
              ...assignment.profile,
              team: {
                ...assignment.profile.team,
                color
              }
            }
          };
        } else if (assignment.profile) {
          return {
            ...assignment,
            profile: {
              ...assignment.profile,
              team: null
            }
          };
        }
        return assignment;
      });
      
      console.log("Assignments fetched:", assignmentsWithTeamColors?.length || 0);
      setAssignments(assignmentsWithTeamColors as Assignment[] || []);
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

  const createAssignment = async (profileId: string, apartmentId: string, bedroomId: string, bedId: string, startDate: Date, endDate: Date) => {
    console.log("Create assignment called with:", { profileId, apartmentId, bedroomId, bedId, startDate, endDate });
    
    try {
      const apartment = apartments.find(a => a.id === apartmentId);
      const bedroom = apartment?.bedrooms.find(b => b.id === bedroomId);
      const bed = bedroom?.beds.find(b => b.id === bedId);
      
      const profile = profiles.find(p => p.id === profileId);
      
      if (!profile || !apartment || !bedroom || !bed) {
        console.error("Failed to find all required entities:", { profile, apartment, bedroom, bed });
      }
      
      setNewAssignmentData({
        profileId,
        apartmentId,
        bedroomId,
        bedId,
        startDate,
        endDate: addDays(startDate, 6)
      });
      setIsEditPanelOpen(true);
    } catch (error) {
      console.error("Error preparing assignment data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to prepare assignment data. Please try again."
      });
    }
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

  const handleDragStart = (profile: Profile) => {
    console.log("Drag started for profile:", profile.full_name);
    setDraggedProfile(profile);
  };

  const handleDrop = (e: React.DragEvent, apartmentId: string, bedroomId: string, bedId: string, date: Date) => {
    e.preventDefault();
    
    try {
      const profileJson = e.dataTransfer.getData("profile");
      if (!profileJson) {
        console.error("No profile data found in the drop event");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to get profile data from the drag event"
        });
        return;
      }
      
      const profile = JSON.parse(profileJson);
      if (!profile || !profile.id) {
        console.error("Invalid profile data:", profile);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid profile data"
        });
        return;
      }
      
      console.log("Drop event:", { 
        apartmentId, 
        bedroomId, 
        bedId, 
        date, 
        profile: profile.full_name,
        profileId: profile.id 
      });
      
      createAssignment(
        profile.id,
        apartmentId,
        bedroomId,
        bedId,
        date,
        addDays(date, 6)
      );
    } catch (error) {
      console.error("Error handling drop event:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process the drop action. Please try again."
      });
    }
    
    setDraggedProfile(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getAssignmentForCell = (bedId: string, date: Date) => {
    return assignments.find(assignment => 
      assignment.bed_id === bedId && 
      new Date(assignment.start_date) <= date && 
      new Date(assignment.end_date) >= date
    );
  };

  const handleAssignmentClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsEditPanelOpen(true);
  };

  const handleResizeStart = (e: React.MouseEvent, assignmentId: string, direction: 'left' | 'right') => {
    e.stopPropagation();
    setResizingAssignment({ id: assignmentId, direction });
  };

  const handleResizeMove = (e: MouseEvent, date: Date) => {
    e.preventDefault();
    if (!resizingAssignment) return;

    const assignment = assignments.find(a => a.id === resizingAssignment.id);
    if (!assignment) return;

    const currentStartDate = new Date(assignment.start_date);
    const currentEndDate = new Date(assignment.end_date);

    if (resizingAssignment.direction === 'left') {
      if (date > currentEndDate) return;
      updateAssignment(assignment.id, date, currentEndDate);
    } else {
      if (date < currentStartDate) return;
      updateAssignment(assignment.id, currentStartDate, date);
    }

    setResizingAssignment(null);
  };

  useEffect(() => {
    if (!resizingAssignment) return;

    const handleMouseUp = () => {
      setResizingAssignment(null);
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingAssignment]);

  const availableProfiles = useMemo(() => {
    return profiles.filter(profile => 
      !assignments.some(assignment => assignment.profile_id === profile.id)
    );
  }, [profiles, assignments]);

  const profilesByTeam = useMemo(() => {
    const grouped: Record<string, Profile[]> = {
      'no-team': []
    };
    
    availableProfiles.forEach(profile => {
      const teamId = profile.team?.id || 'no-team';
      if (!grouped[teamId]) {
        grouped[teamId] = [];
      }
      grouped[teamId].push(profile);
    });
    
    return grouped;
  }, [availableProfiles]);

  const hasBeds = useMemo(() => {
    return apartments.some(apt => apt.bedrooms.some(br => br.beds.length > 0));
  }, [apartments]);

  const handleEditPanelClose = () => {
    setIsEditPanelOpen(false);
    setSelectedAssignment(null);
    setNewAssignmentData(null);
    fetchData();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Room Assignment Grid</h2>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="flex">
          <Skeleton className="w-[250px] h-[500px] mr-4" />
          <div className="flex-1">
            <Skeleton className="h-[500px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!hasBeds && apartments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="font-medium text-lg mb-2">No apartments found</h3>
          <p className="text-muted-foreground mb-4">
            You need to create apartments, bedrooms, and beds before you can assign people to them.
          </p>
          <Button 
            onClick={() => {
              const roomsTab = document.querySelector('[value="rooms"]') as HTMLButtonElement;
              if (roomsTab) roomsTab.click();
            }}
          >
            Create Apartments
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!hasBeds && apartments.length > 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="font-medium text-lg mb-2">No beds found</h3>
          <p className="text-muted-foreground mb-4">
            You have apartments, but you need to add bedrooms and beds to them before you can assign people.
          </p>
          <Button 
            onClick={() => {
              const roomsTab = document.querySelector('[value="rooms"]') as HTMLButtonElement;
              if (roomsTab) roomsTab.click();
            }}
          >
            Manage Apartments
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Room Assignment Grid</h2>
        <Button 
          variant="outline" 
          onClick={() => setShowProfiles(!showProfiles)}
        >
          <User className="mr-2 h-4 w-4" />
          {showProfiles ? "Hide Profiles" : "Show Profiles"}
        </Button>
      </div>

      <div className="flex">
        {showProfiles && (
          <div className="w-[250px] border-r p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-lg">Available Profiles</h3>
              <span className="text-xs text-muted-foreground">
                {availableProfiles.length} available
              </span>
            </div>
            
            {Object.entries(profilesByTeam).map(([teamId, teamProfiles]) => {
              const team = teamId !== 'no-team' 
                ? teamProfiles[0]?.team 
                : { id: 'no-team', name: 'No Team', logo_url: null, color: '#94a3b8' };
              
              if (!team || teamProfiles.length === 0) return null;
              
              return (
                <div key={teamId} className="space-y-2">
                  {team && (
                    <div className="mb-2">
                      <TeamBadge team={team} />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {teamProfiles.map((profile) => (
                      <div
                        key={profile.id}
                        className="p-2 border rounded-md cursor-move bg-white hover:shadow-md transition-shadow"
                        draggable
                        onDragStart={() => handleDragStart(profile)}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback>
                              {profile.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium truncate w-full text-center">
                            {profile.full_name || "Unnamed"}
                          </span>
                          <span className="text-xs text-muted-foreground truncate w-full text-center">
                            {profile.email || "No email"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {availableProfiles.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                No available profiles. All profiles have assignments.
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-x-auto">
          <div className="min-w-[1200px]">
            <div className="grid grid-cols-[200px,150px,150px,repeat(30,40px)] border-b">
              <div className="p-2 font-semibold border-r">Apartment</div>
              <div className="p-2 font-semibold border-r">Bedroom</div>
              <div className="p-2 font-semibold border-r">Bed</div>
              
              {dates.map((date, index) => (
                <div 
                  key={index} 
                  className="p-1 text-xs text-center font-medium border-r flex flex-col justify-center items-center"
                >
                  <div>{format(date, 'd')}</div>
                  <div className="text-muted-foreground">{format(date, 'MMM')}</div>
                </div>
              ))}
            </div>

            {apartments.map((apartment) => (
              <div key={apartment.id}>
                {apartment.bedrooms.flatMap((bedroom) => 
                  bedroom.beds.map((bed, bedIndex) => {
                    const isFirstBedOfFirstBedroom = 
                      bedroom === apartment.bedrooms[0] && bedIndex === 0;
                    const isFirstBedOfBedroom = bedIndex === 0;
                    
                    return (
                      <div key={bed.id} className="grid grid-cols-[200px,150px,150px,repeat(30,40px)] border-b hover:bg-muted/30">
                        <div className="p-2 border-r flex items-center">
                          {isFirstBedOfFirstBedroom ? apartment.name : ""}
                        </div>
                        <div className="p-2 border-r flex items-center">
                          {isFirstBedOfBedroom ? bedroom.name : ""}
                        </div>
                        <div className="p-2 border-r flex items-center gap-1">
                          <span>{bed.name}</span>
                          <span className="text-xs text-muted-foreground">({bed.bed_type})</span>
                        </div>
                        
                        {dates.map((date, dateIndex) => {
                          const assignment = getAssignmentForCell(bed.id, date);
                          const isAssignmentStart = assignment && isSameDay(new Date(assignment.start_date), date);
                          const isAssignmentEnd = assignment && isSameDay(new Date(assignment.end_date), date);
                          const daysLength = assignment ? differenceInDays(new Date(assignment.end_date), new Date(assignment.start_date)) + 1 : 0;
                          
                          if (assignment && isAssignmentStart) {
                            return (
                              <div 
                                key={dateIndex}
                                className="relative border-r overflow-visible"
                                style={{ gridColumn: `span ${Math.min(daysLength, dates.length - dateIndex)}` }}
                              >
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div 
                                        className="absolute top-0 left-0 right-0 bottom-0 m-1 bg-primary/20 border border-primary/30 rounded-md flex items-center justify-between cursor-pointer"
                                        onClick={() => handleAssignmentClick(assignment)}
                                      >
                                        <div 
                                          className="absolute left-0 top-0 bottom-0 w-4 flex items-center justify-center cursor-ew-resize hover:bg-primary/30"
                                          onMouseDown={(e) => handleResizeStart(e, assignment.id, 'left')}
                                        >
                                          <ChevronLeft className="h-3 w-3 text-primary" />
                                        </div>
                                        
                                        <div className="flex-1 px-6 py-1 truncate flex items-center">
                                          <Avatar className="h-5 w-5 mr-1 flex-shrink-0">
                                            <AvatarImage src={assignment.profile.avatar_url || undefined} />
                                            <AvatarFallback className="text-[10px]">
                                              {assignment.profile.full_name?.charAt(0) || '?'}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="truncate text-center flex-1 flex flex-col">
                                            <span className="text-xs">{assignment.profile.full_name}</span>
                                            <span className="text-[10px] text-muted-foreground">{assignment.profile.email}</span>
                                          </div>
                                        </div>
                                        
                                        <div 
                                          className="absolute right-0 top-0 bottom-0 w-4 flex items-center justify-center cursor-ew-resize hover:bg-primary/30"
                                          onMouseDown={(e) => handleResizeStart(e, assignment.id, 'right')}
                                        >
                                          <ChevronRight className="h-3 w-3 text-primary" />
                                        </div>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="space-y-1">
                                        <p><strong>{assignment.profile.full_name}</strong></p>
                                        <p className="text-xs text-muted-foreground">{assignment.profile.email}</p>
                                        <p>From: {format(new Date(assignment.start_date), 'PP')}</p>
                                        <p>To: {format(new Date(assignment.end_date), 'PP')}</p>
                                        <p className="text-xs text-muted-foreground">Drag edges to resize dates</p>
                                        <p className="text-xs text-muted-foreground">Click to edit</p>
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
                              className="border-r h-full min-h-[40px]"
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, apartment.id, bedroom.id, bed.id, date)}
                            />
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        </div>
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

export default AssignmentGrid;
