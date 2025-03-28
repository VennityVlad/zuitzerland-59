import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarDays, Plus, Trash2, CalendarPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageTitle } from "@/components/PageTitle";
import { CreateEventSheet } from "@/components/events/CreateEventSheet";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Base Event interface without profiles
interface Event {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  color: string;
  is_all_day: boolean;
  created_by: string;
  created_at: string;
}

// Event with profiles (for join results)
interface EventWithProfile extends Event {
  profiles?: {
    username: string | null;
  } | null;
}

const Events = () => {
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user: privyUser } = usePrivy();
  const { user: supabaseUser } = useSupabaseAuth();
  const { toast } = useToast();
  
  // Fetch user profile to check if admin
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!privyUser?.id && !supabaseUser?.id) return null;

      const searchId = privyUser?.id || supabaseUser?.id;
      let query = supabase.from("profiles").select("*");
      
      if (privyUser?.id) {
        query = query.eq("privy_id", searchId);
      } else if (supabaseUser?.id) {
        query = query.eq("auth_user_id", searchId);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }
      
      return data;
    },
    enabled: !!(privyUser?.id || supabaseUser?.id)
  });
  
  // Check if user is an admin based on profile role
  const isAdmin = userProfile?.role === 'admin';

  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      // Be specific about which foreign key to use
      const { data, error } = await supabase
        .from("events")
        .select("*, profiles:profiles!events_created_by_fkey(username)")
        .order("start_date", { ascending: true });

      if (error) {
        console.error("Error fetching events:", error);
        throw error;
      }

      return data as unknown as EventWithProfile[];
    }
  });

  const handleCreateEventSuccess = () => {
    refetch();
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventToDelete.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Event deleted",
        description: "The event has been successfully deleted.",
      });
      
      refetch();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Failed to delete the event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setEventToDelete(null);
    }
  };

  const openDeleteDialog = (event: Event) => {
    setEventToDelete(event);
  };
  
  // Function to generate iCalendar format
  const generateICalEvent = (event: Event) => {
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    
    // Format dates to iCal format: YYYYMMDDTHHMMSSZ
    const formatICalDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '').substring(0, 15) + 'Z';
    };
    
    const icalStart = formatICalDate(startDate);
    const icalEnd = formatICalDate(endDate);
    
    // Build iCal content
    const icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Zuitzerland//Calendar App//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@zuitzerland.app`,
      `DTSTAMP:${formatICalDate(new Date())}`,
      `DTSTART:${icalStart}`,
      `DTEND:${icalEnd}`,
      `SUMMARY:${event.title}`,
      event.description ? `DESCRIPTION:${event.description}` : '',
      event.location ? `LOCATION:${event.location}` : '',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');
    
    return icalContent;
  };
  
  // Function to add event to calendar
  const addToCalendar = (event: Event) => {
    const icalContent = generateICalEvent(event);
    
    // Create a Blob with the iCal content
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    
    // Create a link to download the file
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title.replace(/\s+/g, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Calendar Event Created",
      description: "The calendar file has been downloaded. Open it to add to your calendar app.",
    });
  };

  // Determine which user ID to use
  const userId = privyUser?.id || supabaseUser?.id || "";

  return (
    <div className="container py-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <PageTitle 
          title="Events" 
          description="View and manage upcoming events" 
          icon={<CalendarDays className="h-8 w-8" />} 
        />
        {isAdmin && (
          <Button onClick={() => setCreateEventOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Event
          </Button>
        )}
      </div>

      {isLoading || profileLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-pulse">Loading events...</div>
        </div>
      ) : !events || events.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
          <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No events found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {isAdmin ? "Get started by creating a new event." : "Check back later for upcoming events."}
          </p>
          {isAdmin && (
            <Button className="mt-4" onClick={() => setCreateEventOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Event
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-md shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => {
                const startDate = new Date(event.start_date);
                const endDate = new Date(event.end_date);
                const isMultiDay = startDate.toDateString() !== endDate.toDateString();
                const isPast = endDate < new Date();
                
                return (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3" 
                          style={{ backgroundColor: event.color }}
                        />
                        <div>
                          <div>{event.title}</div>
                          {event.description && (
                            <div className="text-sm text-gray-500 truncate max-w-[300px]">
                              {event.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isMultiDay ? (
                        <span>
                          {format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
                          {event.is_all_day && " (All day)"}
                        </span>
                      ) : (
                        <span>
                          {format(startDate, "MMM d, yyyy")}
                          {!event.is_all_day && (
                            <> {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}</>
                          )}
                          {event.is_all_day && " (All day)"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{event.location || "—"}</TableCell>
                    <TableCell>{event.profiles?.username || "Anonymous"}</TableCell>
                    <TableCell>
                      <Badge variant={isPast ? "outline" : "default"}>
                        {isPast ? "Past" : "Upcoming"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => addToCalendar(event)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          title="Add to calendar"
                        >
                          <CalendarPlus className="h-4 w-4" />
                          <span className="sr-only">Add to calendar</span>
                        </Button>
                        
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(event)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Delete event"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateEventSheet
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
        onSuccess={handleCreateEventSuccess}
        userId={userId}
      />

      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the event "{eventToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Events;
