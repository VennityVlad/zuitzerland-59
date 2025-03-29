import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, isSameDay } from "date-fns";
import { CalendarDays, Plus, Trash2, CalendarPlus, MapPin, Clock, User, Edit, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/PageTitle";
import { CreateEventSheet } from "@/components/events/CreateEventSheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("upcoming");
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

  const handleEditEvent = (event: Event) => {
    setEventToEdit(event);
    setCreateEventOpen(true);
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

  // Format time for display
  const formatEventTime = (startDate: string, endDate: string, isAllDay: boolean) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    if (isAllDay) {
      return "All day";
    }
    
    return `${format(start, "h:mm a")} ${end ? `- ${format(end, "h:mm a")}` : ""}`;
  };

  // Format date for the sidebar display
  const formatDateForSidebar = (date: Date) => {
    return (
      <div className="flex flex-col items-center">
        <div className="text-lg font-semibold">{format(date, "MMM d")}</div>
        <div className="text-sm text-gray-500">{format(date, "EEEE")}</div>
      </div>
    );
  };

  // Function to format date range for display
  const formatDateRange = (startDate: string, endDate: string, isAllDay: boolean) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    if (isSameDay(start, end)) {
      return `${format(start, "MMM d, yyyy")}`;
    }
    
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  };

  // Filter events by upcoming or past
  const currentDate = new Date();
  const upcomingEvents = events?.filter(event => new Date(event.end_date) >= currentDate) || [];
  const pastEvents = events?.filter(event => new Date(event.end_date) < currentDate) || [];
  
  // Display events based on active tab
  const displayEvents = activeTab === "upcoming" ? upcomingEvents : pastEvents;

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
          <Button onClick={() => {
            setEventToEdit(null);
            setCreateEventOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" /> Create Event
          </Button>
        )}
      </div>

      <Tabs defaultValue="upcoming" className="w-full" onValueChange={setActiveTab}>
        <div className="flex justify-end mb-4">
          <TabsList className="grid w-[200px] grid-cols-2">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="upcoming" className="space-y-4">
          {renderEventsList(
            upcomingEvents, 
            isLoading, 
            profileLoading, 
            isAdmin, 
            openDeleteDialog, 
            handleEditEvent, 
            addToCalendar, 
            formatDateForSidebar, 
            formatEventTime,
            formatDateRange
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {renderEventsList(
            pastEvents, 
            isLoading, 
            profileLoading, 
            isAdmin, 
            openDeleteDialog, 
            handleEditEvent, 
            addToCalendar, 
            formatDateForSidebar, 
            formatEventTime,
            formatDateRange
          )}
        </TabsContent>
      </Tabs>

      <CreateEventSheet
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
        onSuccess={handleCreateEventSuccess}
        userId={userId}
        event={eventToEdit}
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

// Helper function to render the events list
const renderEventsList = (
  events: EventWithProfile[], 
  isLoading: boolean, 
  profileLoading: boolean,
  isAdmin: boolean,
  openDeleteDialog: (event: Event) => void,
  handleEditEvent: (event: Event) => void,
  addToCalendar: (event: Event) => void,
  formatDateForSidebar: (date: Date) => JSX.Element,
  formatEventTime: (startDate: string, endDate: string, isAllDay: boolean) => string,
  formatDateRange: (startDate: string, endDate: string, isAllDay: boolean) => string
) => {
  if (isLoading || profileLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-pulse">Loading events...</div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
        <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium">No events found</h3>
        <p className="mt-2 text-sm text-gray-500">
          {isAdmin ? "Get started by creating a new event." : "Check back later for upcoming events."}
        </p>
        {isAdmin && (
          <Button className="mt-4" onClick={() => {}}>
            <Plus className="mr-2 h-4 w-4" /> Create Event
          </Button>
        )}
      </div>
    );
  }

  // Group events by date for the timeline view
  const eventsByDate = events.reduce((acc, event) => {
    const dateKey = format(new Date(event.start_date), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, EventWithProfile[]>);

  return (
    <div className="space-y-8">
      {Object.entries(eventsByDate).map(([dateKey, dateEvents]) => {
        const date = new Date(dateKey);
        return (
          <div key={dateKey} className="relative">
            <div className="flex">
              {/* Date sidebar */}
              <div className="mr-4 w-20 flex-shrink-0 flex flex-col items-center">
                {formatDateForSidebar(date)}
                <div className="h-full w-0.5 bg-gray-200 mt-2 rounded-full"></div>
              </div>
              
              {/* Events for this date */}
              <div className="flex-1 space-y-4">
                {dateEvents.map((event) => (
                  <Card key={event.id} className="overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-200">
                    <div className="h-1" style={{ backgroundColor: event.color }}></div>
                    <CardContent className="p-4">
                      {/* Time badge */}
                      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                        <Badge className="w-fit" variant="outline">
                          {formatEventTime(event.start_date, event.end_date, event.is_all_day)}
                        </Badge>
                        
                        {event.is_all_day && (
                          <Badge variant="outline" className="w-fit">
                            All day
                          </Badge>
                        )}
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                      
                      {/* Date Range */}
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{formatDateRange(event.start_date, event.end_date, event.is_allDay)}</span>
                      </div>
                      
                      {/* Description */}
                      {event.description && (
                        <p className="text-sm text-gray-600 mb-4">{event.description}</p>
                      )}
                      
                      {/* Meta info */}
                      <div className="space-y-2 text-sm">
                        {event.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-500 mr-2" />
                          <span>Hosted by {event.profiles?.username || "Anonymous"}</span>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addToCalendar(event)}
                          className="text-blue-500 border-blue-500 hover:bg-blue-50"
                        >
                          <CalendarPlus className="h-4 w-4 mr-2" />
                          Add to Calendar
                        </Button>
                        
                        {isAdmin && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditEvent(event)}
                              className="text-amber-500 border-amber-500 hover:bg-amber-50"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(event)}
                              className="text-red-500 border-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Events;
