import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, isSameDay, isWithinInterval, startOfMonth, endOfMonth, isSameMonth, isBefore, isToday } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { CalendarDays, Plus, Trash2, CalendarPlus, MapPin, User, Edit, Calendar, Tag, Mic, Filter, Share, LogIn, Apple, MoreHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePaidInvoiceStatus } from "@/hooks/usePaidInvoiceStatus";
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
import { formatTimeRange, getReadableTimezoneName } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Link } from 'react-router-dom';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { 
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";

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
  recurring_pattern_id: string | null;
  is_recurring_instance: boolean;
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
  const [activeTab, setActiveTab] = useState<string>("today");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const { user: privyUser } = usePrivy();
  const { user: supabaseUser } = useSupabaseAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const { hasPaidInvoice, isLoading: isPaidInvoiceLoading, isAdmin: userIsAdmin } = usePaidInvoiceStatus(
    privyUser?.id || supabaseUser?.id
  );
  
  useEffect(() => {
    console.log("📜 Events page loaded - User info:", { 
      privyUserId: privyUser?.id,
      supabaseUserId: supabaseUser?.id,
      hasPaidInvoice,
      isPaidInvoiceLoading,
      userIsAdmin
    });
  }, [privyUser?.id, supabaseUser?.id, hasPaidInvoice, isPaidInvoiceLoading, userIsAdmin]);
  
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
  const isAdminUser = userProfile?.role === 'admin';
  
  const userId = privyUser?.id || supabaseUser?.id || "";
  const profileId = userProfile?.id;

  // Key change: Only enable the events query if the user has paid invoice or is admin
  // This prevents fetching events data until we know the user's invoice status
  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ["events", selectedTags, selectedDate],
    queryFn: async () => {
      console.log("🔍 Fetching events with access granted");
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
    },
    // Only fetch events if:
    // 1. We know the invoice status (not still loading)
    // 2. The user has a paid invoice or is an admin
    // 3. The user is authenticated
    enabled: 
      !isPaidInvoiceLoading && 
      (hasPaidInvoice || userIsAdmin) && 
      (!!privyUser?.id || !!supabaseUser?.id)
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
        .select("event_id, profile_id, profiles(id, username, avatar_url, privacy_settings)");
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
    if (isAdminUser) return true;
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

  const TIME_ZONE = "Europe/Zurich";

  const formatDateForSidebar = (date: Date) => {
    return (
      <div className="flex flex-col items-center">
        <div className="text-lg font-semibold">{format(date, "MMM d")}</div>
        <div className="text-sm text-gray-500">{format(date, "EEEE")}</div>
      </div>
    );
  };

  const formatDateRange = (startDate: string, endDate: string, isAllDay: boolean) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isSameDay(start, end)) {
      return format(start, "MMM d, yyyy");
    }
    
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  };

  const formatEventTime = (startDate: string, endDate: string, isAllDay: boolean, timezone: string) => {
    if (isAllDay) return "All day";

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('Invalid date detected:', { startDate, endDate });
      return 'Invalid date';
    }

    return formatTimeRange(start, end, isAllDay, timezone);
  };

  const currentDate = new Date();
  
  // Events categorized by tab filter types
  const todayEvents = filteredEvents.filter(event => {
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    return isToday(startDate) || isToday(endDate) || 
      (isBefore(startDate, currentDate) && isBefore(currentDate, endDate));
  });
  
  const upcomingEvents = filteredEvents.filter(event => new Date(event.end_date) >= currentDate) || [];
  const pastEvents = filteredEvents.filter(event => new Date(event.end_date) < currentDate) || [];
  const rsvpedEvents = filteredEvents.filter(ev => userRSVPEventIds.includes(ev.id)) || [];
  const hostingEvents = filteredEvents.filter(event => event.created_by === profileId) || [];
  const allEvents = filteredEvents;

  // Extract unique tag IDs for each event category
  const getUniqueTagIdsForEvents = (eventsList: EventWithProfile[]) => {
    const tagIds = new Set<string>();
    eventsList.forEach(event => {
      event.event_tags?.forEach(tag => {
        tagIds.add(tag.tags.id);
      });
    });
    return Array.from(tagIds);
  };

  const todayTagIds = getUniqueTagIdsForEvents(todayEvents);
  const goingTagIds = getUniqueTagIdsForEvents(rsvpedEvents);
  const hostingTagIds = getUniqueTagIdsForEvents(hostingEvents);
  const allTagIds = getUniqueTagIdsForEvents(allEvents);
  const pastTagIds = getUniqueTagIdsForEvents(pastEvents);

  // Get visible tag IDs based on the active tab
  const getVisibleTagIds = () => {
    switch (activeTab) {
      case 'today': return todayTagIds;
      case 'going': return goingTagIds;
      case 'hosting': return hostingTagIds;
      case 'all': return allTagIds;
      case 'past': return pastTagIds;
      default: return allTagIds;
    }
  };

  const visibleTagIds = getVisibleTagIds();

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedDate(undefined);
  };

  const hasActiveFilters = selectedTags.length > 0 || !!selectedDate;

  const handleShare = async (event: Event) => {
    const shareUrl = `${window.location.origin}/events/${event.id}`;
    
    if (navigator.share && navigator.canShare) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description || event.title,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied",
          description: "The event link has been copied to your clipboard.",
        });
      } catch (err) {
        console.error('Error copying to clipboard:', err);
        toast({
          title: "Error",
          description: "Failed to copy the link. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Early return for users without paid invoices
  if (!hasPaidInvoice && !isPaidInvoiceLoading) {
    console.log("🚫 Showing restricted access message - No paid invoice found");
    return (
      <div className="container py-6 space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <PageTitle 
            title="Events" 
            description="View and manage upcoming events" 
            icon={<CalendarDays className="h-8 w-8" />} 
          />
        </div>
        
        <Card className="p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <CalendarDays className="h-8 w-8 text-gray-500" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Access Restricted</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            You must have a paid invoice to view the events schedule. Once your payment is confirmed, you'll have full access to all events.
          </p>
          <div className="flex justify-center">
            <Button asChild>
              <Link to="/invoices">
                View Invoices
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Show loading state while checking invoice status
  if (isPaidInvoiceLoading) {
    console.log("⏳ Showing loading state while checking access status");
    return (
      <div className="container py-6 space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <PageTitle 
            title="Events" 
            description="View and manage upcoming events" 
            icon={<CalendarDays className="h-8 w-8" />} 
          />
        </div>
        
        <div className="space-y-4">
          <Card className="p-4">
            <div className="space-y-3">
              <Skeleton className="h-8 w-1/3" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="col-span-3 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-36 w-full" />
            </div>
            <Skeleton className="h-52 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const generateGoogleCalendarUrl = (event: Event) => {
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    
    // Format dates in the format expected by Google Calendar
    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };
    
    const googleStart = formatGoogleDate(startDate);
    const googleEnd = formatGoogleDate(endDate);
    
    // Create the URL with the necessary parameters
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${googleStart}/${googleEnd}`,
      details: event.description || '',
      location: event.location_text || event.locations?.name || '',
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const generateAppleCalendarData = (event: Event) => {
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
      event.location_text || event.locations?.name ? `LOCATION:${event.location_text || event.locations?.name}` : '',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');
    
    return icalContent;
  };

  const downloadAppleCalendar = (event: Event) => {
    const icalContent = generateAppleCalendarData(event);
    
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
    refetchRSVPs: () => void,
    isMobile: boolean,
    handleShare: (event: Event) => void,
    generateGoogleCalendarUrl: (event: Event) => string,
    generateAppleCalendarData: (event: Event) => string,
    downloadAppleCalendar: (event: Event) => void
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
            <div key={dateKey} className="space-y-4">
              {formatDateForSidebar(date)}
              <div className="space-y-4">
                {dateEvents.map((event) => (
                  <Card key={event.id} className={`overflow-hidden ${event.color ? `border-l-4 border-l-[${event.color}]` : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col space-y-4">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-semibold">{event.title}</h3>
                          <div className="flex items-center space-x-2">
                            {canEditEvent(event) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditEvent(event)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            )}
                            {canEditEvent(event) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(event)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            )}
                            
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <CalendarPlus className="h-4 w-4" />
                                  <span className="sr-only">Add to Calendar</span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-56 p-2">
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium">Add to Calendar</h4>
                                  <div className="flex flex-col gap-2">
                                    <a 
                                      href={generateGoogleCalendarUrl(event)} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
                                    >
                                      <Calendar className="h-4 w-4" />
                                      <span>Google Calendar</span>
                                    </a>
                                    <button 
                                      onClick={() => downloadAppleCalendar(event)}
                                      className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition-colors text-left"
                                    >
                                      <Apple className="h-4 w-4" />
                                      <span>Apple Calendar</span>
                                    </button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleShare(event)}
                              className="h-8 w-8 p-0"
                            >
                              <Share className="h-4 w-4" />
                              <span className="sr-only">Share</span>
                            </Button>
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{formatDateRange(event.start_date, event.end_date, event.is_all_day)}</span>
                            <span>•</span>
                            <span>{formatEventTime(event.start_date, event.end_date, event.is_all_day, event.timezone)}</span>
                          </div>
                          
                          {(event.location_text || event.locations?.name) && (
                            <div className="flex items-center mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span className="truncate">
                                {event.location_text || event.locations?.name}
                                {event.locations?.building && ` (${event.locations.building}${event.locations.floor ? `, ${event.locations.floor}` : ''})`}
                              </span>
                            </div>
                          )}
                          
                          {(event.speakers && event.speakers?.length > 0) && (
                            <div className="flex items-center mt-1">
                              <Mic className="h-4 w-4 mr-1" />
                              <span>{event.speakers}</span>
                            </div>
                          )}
                        </div>
                        
                        {event.description && (
                          <p className="text-sm mt-2">{event.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          {event.event_tags?.map((tag) => (
                            <Badge variant="secondary" key={tag.tags.id}>
                              <Tag className="mr-1 h-3 w-3" />
                              {tag.tags.name}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex justify-between items-center mt-2">
                          <EventRSVPAvatars 
                            eventId={event.id} 
                            rsvps={rsvpMap[event.id] || []} 
                          />
                          <EventRSVPButton 
                            eventId={event.id}
                            profileId={profileId}
                            isAttending={userRSVPEventIds.includes(event.id)}
                            onUpdate={refetchRSVPs}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container py-6 space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
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
          <div className="overflow-x-auto pb-2">
            <TagFilter 
              selectedTags={selectedTags} 
              onTagsChange={setSelectedTags}
              visibleTagIds={visibleTagIds}
            />
          </div>
          
          {hasActiveFilters && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700 truncate">
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
            <Tabs defaultValue="today" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5 mb-2">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="going">Going</TabsTrigger>
                <TabsTrigger value="hosting">Hosting</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
              </TabsList>

              <TabsContent value="today" className="space-y-4 mt-4">
                {renderEventsList(
                  todayEvents,
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
                  refetchRSVPs,
                  isMobile,
                  handleShare,
                  generateGoogleCalendarUrl,
                  generateAppleCalendarData,
                  downloadAppleCalendar
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
                  refetchRSVPs,
                  isMobile,
                  handleShare,
                  generateGoogleCalendarUrl,
                  generateAppleCalendarData,
                  downloadAppleCalendar
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
                  refetchRSVPs,
                  isMobile,
                  handleShare,
                  generateGoogleCalendarUrl,
                  generateAppleCalendarData,
                  downloadAppleCalendar
                )}
              </TabsContent>
              <TabsContent value="all" className="space-y-4 mt-4">
                {renderEventsList(
                  allEvents,
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
                  refetchRSVPs,
                  isMobile,
                  handleShare,
                  generateGoogleCalendarUrl,
                  generateAppleCalendarData,
                  downloadAppleCalendar
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
                  refetchRSVPs,
                  isMobile,
                  handleShare,
                  generateGoogleCalendarUrl,
                  generateAppleCalendarData,
                  downloadAppleCalendar
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          {!isMobile && (
            <div className="col-span-1 space-y-4">
              <EventCalendar 
                onSelectDate={setSelectedDate} 
                events={events || []}
              />
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

export default Events;
