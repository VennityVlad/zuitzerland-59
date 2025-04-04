
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { format, addDays, startOfMonth, eachDayOfInterval, differenceInDays } from "date-fns";
import { TeamBadge } from "@/components/TeamBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User, Calendar, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  team: {
    id: string;
    name: string;
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
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    team_id: string | null;
    team?: {
      id: string;
      name: string;
      logo_url: string | null;
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
  const [showProfiles, setShowProfiles] = useState(true); // Changed to true by default
  const [draggedProfile, setDraggedProfile] = useState<Profile | null>(null);
  const { toast } = useToast();

  // Generate dates for the columns
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
      
      // Fetch apartments with bedrooms and beds
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

      // Fetch profiles with teams
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id, 
          full_name, 
          avatar_url,
          team:teams(id, name, logo_url)
        `)
        .order('full_name');
      
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }
      
      console.log("Profiles fetched:", profilesData?.length || 0);
      setProfiles(profilesData || []);

      // Fetch assignments
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
          profile:profiles(
            full_name, 
            avatar_url, 
            team_id,
            team:teams(id, name, logo_url)
          )
        `);
      
      if (assignmentsError) {
        console.error("Error fetching assignments:", assignmentsError);
        throw assignmentsError;
      }
      
      console.log("Assignments fetched:", assignmentsData?.length || 0);
      setAssignments(assignmentsData || []);
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

  const createAssignment = async (profileId: string, apartmentId: string, bedroomId: string, bedId: string, startDate: Date, endDate: Date) => {
    try {
      console.log("Creating assignment with:", { profileId, apartmentId, bedroomId, bedId, startDate, endDate });
      
      // Check if this bed is already assigned for the given dates
      const conflictingAssignments = assignments.filter(a => 
        a.bed_id === bedId &&
        (
          (new Date(a.start_date) <= endDate && new Date(a.end_date) >= startDate) ||
          (new Date(a.start_date) <= startDate && new Date(a.end_date) >= startDate) ||
          (new Date(a.start_date) <= endDate && new Date(a.end_date) >= endDate)
        )
      );

      if (conflictingAssignments.length > 0) {
        toast({
          variant: "destructive",
          title: "Conflict detected",
          description: "This bed is already assigned during the selected period.",
        });
        return;
      }

      const { data, error } = await supabase
        .from('room_assignments')
        .insert({
          profile_id: profileId,
          apartment_id: apartmentId,
          bedroom_id: bedroomId,
          bed_id: bedId,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        })
        .select();
      
      if (error) {
        console.error("Error creating assignment:", error);
        throw error;
      }
      
      console.log("Assignment created:", data);
      toast({
        title: "Assignment created",
        description: "The assignment has been created successfully.",
      });
      
      // Reload assignments
      fetchData();
    } catch (error: any) {
      console.error("Error in createAssignment:", error);
      toast({
        variant: "destructive",
        title: "Error creating assignment",
        description: error.message,
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
      
      // Reload assignments
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
      
      // Reload assignments
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
    if (!draggedProfile) return;
    
    console.log("Drop event:", { apartmentId, bedroomId, bedId, date, profile: draggedProfile.full_name });
    
    // Default to a 7-day stay
    const endDate = addDays(date, 6);
    
    createAssignment(
      draggedProfile.id,
      apartmentId,
      bedroomId,
      bedId,
      date,
      endDate
    );
    
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

  // Group profiles by team
  const profilesByTeam = useMemo(() => {
    const grouped: Record<string, Profile[]> = {
      'no-team': []
    };
    
    profiles.forEach(profile => {
      const teamId = profile.team?.id || 'no-team';
      if (!grouped[teamId]) {
        grouped[teamId] = [];
      }
      grouped[teamId].push(profile);
    });
    
    return grouped;
  }, [profiles]);

  const hasBeds = useMemo(() => {
    return apartments.some(apt => apt.bedrooms.some(br => br.beds.length > 0));
  }, [apartments]);

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
              // Should navigate to Apartments tab or show apartment creation modal
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
              // Should navigate to Apartments tab
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
        {/* Profiles sidebar */}
        {showProfiles && (
          <div className="w-[250px] border-r p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            <h3 className="font-medium text-lg">Available Profiles</h3>
            {Object.entries(profilesByTeam).map(([teamId, teamProfiles]) => {
              const team = teamId !== 'no-team' 
                ? teamProfiles[0]?.team 
                : { id: 'no-team', name: 'No Team', logo_url: null };
              
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
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback>
                              {profile.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate">
                            {profile.full_name || "Unnamed"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Grid view */}
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
                    // Only show apartment name for the first bed of the first bedroom
                    const isFirstBedOfFirstBedroom = 
                      bedroom === apartment.bedrooms[0] && bedIndex === 0;
                    // Only show bedroom name for the first bed of each bedroom
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
                          const isAssignmentStart = assignment && format(new Date(assignment.start_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                          const daysLength = assignment ? differenceInDays(new Date(assignment.end_date), new Date(assignment.start_date)) + 1 : 0;
                          
                          // Render assignment cell only at start date
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
                                        className="absolute top-0 left-0 right-0 bottom-0 m-1 p-1 bg-primary/10 border border-primary/30 rounded-md flex items-center justify-between cursor-pointer"
                                        onClick={() => {
                                          if (confirm("What would you like to do with this assignment?\nOK: Delete\nCancel: Nothing")) {
                                            deleteAssignment(assignment.id);
                                          }
                                        }}
                                      >
                                        <div className="flex items-center gap-1 overflow-hidden">
                                          <Avatar className="h-5 w-5 flex-shrink-0">
                                            <AvatarImage src={assignment.profile.avatar_url || undefined} />
                                            <AvatarFallback className="text-[10px]">
                                              {assignment.profile.full_name?.charAt(0) || '?'}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-xs truncate">
                                            {assignment.profile.full_name}
                                          </span>
                                        </div>
                                        <GripHorizontal className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="space-y-1">
                                        <p><strong>{assignment.profile.full_name}</strong></p>
                                        <p>From: {format(new Date(assignment.start_date), 'PP')}</p>
                                        <p>To: {format(new Date(assignment.end_date), 'PP')}</p>
                                        <p className="text-xs text-muted-foreground">Click to delete</p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            );
                          }
                          
                          // Skip cells that are part of a multi-day assignment but not the start
                          if (assignment && !isAssignmentStart) {
                            return <div key={dateIndex} />;
                          }
                          
                          // Empty cell where we can drop profiles
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
    </div>
  );
};

export default AssignmentGrid;
