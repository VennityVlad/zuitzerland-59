import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarDays, Plus, Trash2, CalendarPlus, MapPin, Clock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/PageTitle";
import { CreateEventSheet } from "@/components/events/CreateEventSheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  const isMobile = useIsMobile();
  
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
    
    const formatICalDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '').substring(0, 15) + 'Z';
    };
    
    const icalStart = formatICalDate(startDate);
    const icalEnd = formatICalDate(endDate);
    
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
    
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    
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

  // Format date range for display
  const formatDateRange = (startDate: Date, endDate: Date, isAllDay: boolean) => {
    const isSameDay = startDate.toDateString() === endDate.toDateString();
    
    if (isSameDay) {
      return isAllDay 
        ? format(startDate, "MMM d, yyyy") + " (All day)"
        : `${format(startDate, "MMM d, yyyy")} · ${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`;
    } else {
      return isAllDay
        ? `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")} (All day)`
        : `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;
    }
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => {
            const startDate = new Date(event.start_date);
            const endDate = new Date(event.end_date);
            const isPast = endDate < new Date();
            
            return (
              <Card key={event.id} className="overflow-hidden">
                <div className="h-2" style={{ backgroundColor: event.color }}></div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-semibold leading-tight">{event.title}</CardTitle>
                    <Badge variant={isPast ? "outline" : "default"}>
                      {isPast ? "Past" : "Upcoming"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pb-2">
                  {event.description && (
                    <p className="text-sm text-gray-600">{event.description}</p>
                  )}
                  <div className="flex items-start space-x-2">
                    <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                    <span className="text-sm">
                      {formatDateRange(startDate, endDate, event.is_all_day)}
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <span className="text-sm">{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-start space-x-2">
                    <User className="h-4 w-4 text-gray-500 mt-0.5" />
                    <span className="text-sm">{event.profiles?.username || "Anonymous"}</span>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-3 flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addToCalendar(event)}
                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Add to Calendar
                  </Button>
                  
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(event)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
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
