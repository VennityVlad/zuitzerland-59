import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, isSameDay, isWithinInterval, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { CalendarDays, Plus, Trash2, CalendarPlus, MapPin, User, Edit, Calendar, Tag, Mic, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { EventRSVPAvatars } from "@/components/events/EventRSVPAvatars";
import { EventRSVPButton } from "@/components/events/EventRSVPButton";
import { PageTitle } from "@/components/PageTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CreateEventSheet } from "@/components/events/CreateEventSheet";
import { TagFilter } from "@/components/events/TagFilter";
import { EventCalendar } from "@/components/calendar/EventCalendar";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface Event {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location_id: string | null;
  location_text: string | null;
  color: string;
  is_all_day: boolean;
  created_by: string;
  created_at: string;
  locations?: {
    name: string;
    building: string | null;
    floor: string | null;
  } | null;
  event_tags?: {
    tags: {
      id: string;
      name: string;
    }
  }[] | null;
  av_needs?: string | null;
  speakers?: string | null;
  link?: string | null;
  timezone: string;
}

interface EventWithProfile extends Event {
  profiles?: {
    username: string | null;
    id: string;
  } | null;
}

const Events = () => {
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("upcoming");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const { user: privyUser } = usePrivy();
  const { user: supabaseUser } = useSupabaseAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
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
  
  const canManageEvents = userProfile?.role === 'admin' || userProfile?.role === 'co-curator' || userProfile?.role === 'co-designer';
  const isAdmin = userProfile?.role === 'admin';
  
  const userId = privyUser?.id || supabaseUser?.id || "";
  const profileId = userProfile?.id;

  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ["events", selectedTags, selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          profiles:profiles!events_created_by_fkey(username, id),
          locations:location_id (name, building, floor),
          event_tags:event_tag_relations (
            tags:event_tags (id, name)
          )
        `)
        .order("start_date", { ascending: true });

      if (error) {
        console.error("Error fetching events:", error);
        throw error;
      }

      return data as unknown as EventWithProfile[];
    }
  });

  const filteredEvents = React.useMemo(() => {
    if (!events) return [];
    
    return events.filter(event => {
      if (selectedTags.length > 0) {
        const eventTagIds = event.event_tags?.map(tag => tag.tags.id) || [];
        if (!selectedTags.some(tagId => eventTagIds.includes(tagId))) {
          return false;
        }
      }
      
      if (selectedDate) {
        const startDate = new Date(event.start_date);
        const endDate = new Date(event.end_date);
        
        const isEventOnSelectedDate = 
          isWithinInterval(selectedDate, { start: startDate, end: endDate }) ||
          isSameDay(selectedDate, startDate) || 
          isSameDay(selectedDate, endDate);
          
        if (!isEventOnSelectedDate) {
          return false;
        }
      }
      
      return true;
    });
  }, [events, selectedTags, selectedDate]);

  const { data: rsvps, isLoading: rsvpsLoading, refetch: refetchRSVPs } = useQuery({
    queryKey: ["event_rsvps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("event_id, profile_id, profiles(id, username, avatar_url)");
      if (error) throw error;
      return data || [];
    }
  });

  const getRSVPedEventIds = () => {
    if (!rsvps || !profileId) return [];
    return rsvps.filter(r => r.profile_id === profileId).map(r => r.event_id);
  };
  const userRSVPEventIds = getRSVPedEventIds();

  const rsvpMap: Record<string, { id: string; username: string | null; avatar_url?: string | null }[]> = {};
  if (rsvps) {
    rsvps.forEach(r => {
      if (!rsvpMap[r.event_id]) rsvpMap[r.event_id] = [];
      const profile = r.profiles
        ? {
            id: r.profiles.id,
            username: r.profiles.username,
            avatar_url: r.profiles.avatar_url,
          }
        : { id: "-", username: "-", avatar_url: "" };
      rsvpMap[r.event_id].push(profile);
    });
  }

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

  const canEditEvent = (event: EventWithProfile) => {
    if (isAdmin) return true;
    if (event.profiles?.id === profileId) return true;
    return false;
  };

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
      event.location_text ? `LOCATION:${event.location_text}` : '',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');
    
    return icalContent;
  };

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

  const formatEventTime = (startDate: string, endDate: string, isAllDay: boolean, timezone: string) => {
    if (isAllDay) {
      return "All day";
    }
    
    return `${formatInTimeZone(new Date(startDate), timezone, "h:mm a")} - ${formatInTimeZone(new Date(endDate), timezone, "h:mm a")} (${timezone.split('/')[1].replace('_', ' ')})`;
  };

  const formatDateForSidebar = (date: Date) => {
    return (
      <div className="flex flex-col items-center">
        <div className="text-lg font-semibold">{formatInTimeZone(date, TIME_ZONE, "MMM d")}</div>
        <div className="text-sm text-gray-500">{formatInTimeZone(date, TIME_ZONE, "EEEE")}</div>
      </div>
    );
  };

  const formatDateRange = (startDate: string, endDate: string, isAllDay: boolean) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isSameDay(start, end)) {
      return formatInTimeZone(start, TIME_ZONE, "MMM d, yyyy");
    }
    
    return `${formatInTimeZone(start, TIME_ZONE, "MMM d")} - ${formatInTimeZone(end, TIME_ZONE, "MMM d, yyyy")}`;
  };

  const currentDate = new Date();
  const upcomingEvents = filteredEvents.filter(event => new Date(event.end_date) >= currentDate) || [];
  const pastEvents = filteredEvents.filter(event => new Date(event.end_date) < currentDate) || [];
  
  const rsvpedEvents = filteredEvents.filter(ev => userRSVPEventIds.includes(ev.id)) || [];
  const hostingEvents = filteredEvents.filter(event => event.created_by === profileId) || [];

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedDate(undefined);
  };

  const hasActiveFilters = selectedTags.length > 0 || !!selectedDate;

  return (
    <div className="container py-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <PageTitle 
          title="Events" 
          description="View and manage upcoming events" 
          icon={<CalendarDays className="h-8 w-8" />} 
        />
        {canManageEvents && (
          <Button 
            onClick={() => {
              setEventToEdit(null);
              setCreateEventOpen(true);
            }}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Event
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <TagFilter 
            selectedTags={selectedTags} 
            onTagsChange={setSelectedTags} 
          />
          
          {hasActiveFilters && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {selectedTags.length > 0 && `${selectedTags.length} tag${selectedTags.length !== 1 ? 's' : ''}`}
                  {selectedTags.length > 0 && selectedDate && ', '}
                  {selectedDate && `Date: ${format(selectedDate, 'MMM d, yyyy')}`}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="col-span-1 md:col-span-3">
            <Tabs defaultValue="upcoming" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
                <TabsTrigger value="going">Going</TabsTrigger>
                <TabsTrigger value="hosting">Hosting</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4 mt-4">
                {renderEventsList(
                  upcomingEvents,
                  isLoading,
                  profileLoading,
                  canManageEvents,
                  canEditEvent,
                  openDeleteDialog,
                  handleEditEvent,
                  addToCalendar,
                  formatDateForSidebar,
                  formatEventTime,
                  formatDateRange,
                  rsvpMap,
                  userRSVPEventIds,
                  profileId,
                  refetchRSVPs
                )}
              </TabsContent>
              <TabsContent value="past" className="space-y-4 mt-4">
                {renderEventsList(
                  pastEvents,
                  isLoading,
                  profileLoading,
                  canManageEvents,
                  canEditEvent,
                  openDeleteDialog,
                  handleEditEvent,
                  addToCalendar,
                  formatDateForSidebar,
                  formatEventTime,
                  formatDateRange,
                  rsvpMap,
                  userRSVPEventIds,
                  profileId,
                  refetchRSVPs
                )}
              </TabsContent>
              <TabsContent value="going" className="space-y-4 mt-4">
                {renderEventsList(
                  rsvpedEvents,
                  isLoading,
                  profileLoading,
                  canManageEvents,
                  canEditEvent,
                  openDeleteDialog,
                  handleEditEvent,
                  addToCalendar,
                  formatDateForSidebar,
                  formatEventTime,
                  formatDateRange,
                  rsvpMap,
                  userRSVPEventIds,
                  profileId,
                  refetchRSVPs
                )}
              </TabsContent>
              <TabsContent value="hosting" className="space-y-4 mt-4">
                {renderEventsList(
                  hostingEvents,
                  isLoading,
                  profileLoading,
                  canManageEvents,
                  canEditEvent,
                  openDeleteDialog,
                  handleEditEvent,
                  addToCalendar,
                  formatDateForSidebar,
                  formatEventTime,
                  formatDateRange,
                  rsvpMap,
                  userRSVPEventIds,
                  profileId,
                  refetchRSVPs
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          {!isMobile && (
            <div className="col-span-1 space-y-4">
              <EventCalendar onSelectDate={setSelectedDate} />
            </div>
          )}
        </div>
      </div>

      <CreateEventSheet
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
        onSuccess={handleCreateEventSuccess}
        userId={userId}
        event={eventToEdit}
        profileId={profileId}
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

const renderEventsList = (
  events: EventWithProfile[], 
  isLoading: boolean, 
  profileLoading: boolean,
  canManageEvents: boolean,
  canEditEvent: (event: EventWithProfile) => boolean,
  openDeleteDialog: (event: Event) => void,
  handleEditEvent: (event: Event) => void,
  addToCalendar: (event: Event) => void,
  formatDateForSidebar: (date: Date) => JSX.Element,
  formatEventTime: (startDate: string, endDate: string, isAllDay: boolean, timezone: string) => string,
  formatDateRange: (startDate: string, endDate: string, isAllDay: boolean) => string,
  rsvpMap: Record<string, { id: string; username: string | null; avatar_url?: string | null }[]>,
  userRSVPEventIds: string[],
  profileId: string | undefined,
  refetchRSVPs: () => void
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
          {canManageEvents ? "Get started by creating a new event." : "Check back later for upcoming events."}
        </p>
        {canManageEvents && (
          <Button className="mt-4" onClick={() => {}}>
            <Plus className="mr-2 h-4 w-4" /> Create Event
          </Button>
        )}
      </div>
    );
  }

  const eventsByDate = events.reduce((acc, event) => {
    const dateKey = format(new Date(event.start_date), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, EventWithProfile[]>);

  return (
    <div className="space-y-8">
      {Object.entries(eventsByDate).map(([dateKey, dateEvents]) => {
        const date = parseISO(dateEvents[0].start_date);
        return (
          <div key={dateKey} className="relative">
            <div className="flex flex-col sm:flex-row">
              <div className="mr-4 w-full sm:w-20 flex-shrink-0 flex flex-row sm:flex-col items-center">
                {formatDateForSidebar(date)}
                <div className="hidden sm:block h-full w-0.5 bg-gray-200 mt-2 rounded-full"></div>
              </div>
              
              <div className="flex-1 space-y-4">
                {dateEvents.map((event) => {
                  const isRSVPed = !!profileId && userRSVPEventIds.includes(event.id);
                  const rsvpProfiles = rsvpMap[event.id] || [];
                  const location = event.locations ? 
                    `${event.locations.name}${event.locations.building ? ` (${event.locations.building}${event.locations.floor ? `, Floor ${event.locations.floor}` : ''})` : ''}` :
                    event.location_text;

                  return (
                    <Card key={event.id} className="overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-200">
                      <div className="h-1" style={{ backgroundColor: event.color }}></div>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                          <Badge className="w-fit" variant="outline">
                            {formatEventTime(event.start_date, event.end_date, event.is_all_day, event.timezone)}
                          </Badge>
                        </div>
                        
                        <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                        
                        <div className="flex items-center text-sm text-gray-600 mb-3">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{formatDateRange(event.start_date, event.end_date, event.is_all_day)}</span>
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 mb-4">{event.description}</p>
                        )}
                        <div className="space-y-2 text-sm">
                          {location && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                              <span>{location}</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-500 mr-2" />
                            <span>Hosted by {event.profiles?.username || "Anonymous"}</span>
                          </div>
                        </div>

                        {event.event_tags && event.event_tags.length > 0 && (
                          <div className="flex items-center gap-2 mt-4">
                            <Tag className="h-4 w-4 text-gray-500" />
                            <div className="flex flex-wrap gap-2">
                              {event.event_tags.map(tag => (
                                <Badge key={tag.tags.id} variant="secondary">
                                  {tag.tags.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {event.speakers && (
                          <div className="flex items-center gap-2 mt-4">
                            <Mic className="h-4 w-4 text-gray-500" />
                            <div className="text-sm text-gray-600">
                              <span className="font-semibold">Speakers:</span> {event.speakers}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 mt-4">
                          {!!profileId && (
                            <EventRSVPButton
                              eventId={event.id}
                              profileId={profileId}
                              initialRSVP={isRSVPed}
                              onChange={() => refetchRSVPs()}
                            />
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addToCalendar(event)}
                            className="text-blue-500 border-blue-500 hover:bg-blue-50"
                          >
                            <CalendarPlus className="h-4 w-4 mr-2" />
                            Add to Calendar
                          </Button>
                          {canEditEvent(event) && (
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
                        {rsvpProfiles.length > 0 && (
                          <div className="mt-4">
                            <span className="text-xs text-gray-600 mb-1 block">
                              Going: {rsvpProfiles.length}
                            </span>
                            <EventRSVPAvatars profiles={rsvpProfiles} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Events;
