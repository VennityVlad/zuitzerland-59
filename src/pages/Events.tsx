import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, isSameDay, isWithinInterval, startOfMonth, endOfMonth, isSameMonth, isBefore, isToday, addDays, isAfter, startOfDay } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { CalendarDays, Plus, Trash2, MapPin, User, Edit, Calendar, Tag, Filter, Share, LogIn, CalendarPlus, Search, Mic, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePaidInvoiceStatus } from "@/hooks/usePaidInvoiceStatus";
import { EventRSVPAvatars } from "@/components/events/EventRSVPAvatars";
import { EventRSVPButton } from "@/components/events/EventRSVPButton";
import { CalendarOptionsPopover } from "@/components/events/CalendarOptionsPopover";
import { MobileCalendarDialog } from "@/components/events/MobileCalendarDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CreateEventSheet } from "@/components/events/CreateEventSheet";
import { TagFilter } from "@/components/events/TagFilter";
import { EventCalendar } from "@/components/calendar/EventCalendar";
import { formatTimeRange, getReadableTimezoneName } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { SearchHeader } from "@/pages/events/SearchHeader";
import { AddCoHostPopover } from "@/components/events/AddCoHostPopover";
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
import { EventSearchModal } from "@/components/events/EventSearchModal";

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
  meerkat_enabled?: boolean;
  meerkat_url?: string;
}

interface EventWithProfile extends Event {
  profiles?: {
    username: string | null;
    id: string;
  } | null;
}

interface RSVPProfile {
  id: string;
  username: string | null;
  avatar_url?: string | null;
  privacy_settings?: {
    event_rsvp_visibility?: 'private' | 'public';
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
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  
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
  
  const canCreateEvents = !!userProfile?.id;
  const isAdminUser = userProfile?.role === 'admin';
  
  const userId = privyUser?.id || supabaseUser?.id || "";
  const profileId = userProfile?.id;
  
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

      return data.map((event: any): EventWithProfile => {
        const safeEventTags = Array.isArray(event.event_tags) 
          ? event.event_tags 
          : [];

        return {
          ...event,
          event_tags: safeEventTags
        };
      });
    },
    enabled: 
      !isPaidInvoiceLoading && 
      (hasPaidInvoice || userIsAdmin) && 
      (!!privyUser?.id || !!supabaseUser?.id)
  });

  const { data: coHostedEvents, isLoading: coHostsLoading } = useQuery({
    queryKey: ["co_hosted_events", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      
      const { data, error } = await supabase
        .from("event_co_hosts")
        .select(`
          event_id,
          events:event_id (
            *,
            profiles:profiles!events_created_by_fkey(username, id),
            locations:location_id(name, building, floor),
            event_tags:event_tag_relations(
              tags:event_tags(id, name)
            )
          )
        `)
        .eq("profile_id", profileId);
      
      if (error) {
        console.error("Error fetching co-hosted events:", error);
        throw error;
      }
      
      const typedEvents: EventWithProfile[] = [];
      
      data.forEach(item => {
        if (item.events) {
          const event = item.events;
          const safeEventTags = Array.isArray(event.event_tags) 
            ? event.event_tags 
            : [];
            
          typedEvents.push({
            ...event,
            event_tags: safeEventTags
          });
        }
      });
      
      return typedEvents;
    },
    enabled: !!profileId
  });

  useEffect(() => {
    setIsSearchMode(selectedTags.length > 0 || !!selectedDate);
  }, [selectedTags, selectedDate]);

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

  const rsvpMap: Record<string, RSVPProfile[]> = {};
  if (rsvps) {
    rsvps.forEach(r => {
      if (!rsvpMap[r.event_id]) rsvpMap[r.event_id] = [];
      if (r.profiles) {
        rsvpMap[r.event_id].push({
          id: r.profiles.id,
          username: r.profiles.username,
          avatar_url: r.profiles.avatar_url,
          privacy_settings: typeof r.profiles.privacy_settings === 'object' ? 
            r.profiles.privacy_settings as { event_rsvp_visibility?: 'private' | 'public' } : 
            null
        });
      } else {
        rsvpMap[r.event_id].push({
          id: r.profile_id || "-",
          username: "Anonymous",
          avatar_url: "",
          privacy_settings: null,
        });
      }
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
    
    const isCoHost = coHostedEvents?.some(coHostedEvent => 
      coHostedEvent.id === event.id
    );
    
    return !!isCoHost;
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
  
  const todayEvents = filteredEvents.filter(event => {
    const startDate = new Date(event.start_date);
    return isToday(startDate);
  });
  
  const upcomingEvents = filteredEvents.filter(event => {
    const startDate = new Date(event.start_date);
    return isAfter(startDate, currentDate);
  });
  
  const pastEvents = filteredEvents.filter(event => {
    const endDate = new Date(event.end_date);
    return isBefore(endDate, currentDate);
  });
  
  const rsvpedEvents = filteredEvents.filter(ev => userRSVPEventIds.includes(ev.id)) || [];
  
  const hostingEvents = React.useMemo(() => {
    if (!events || !profileId) return [];
    
    const createdEvents = events.filter(event => event.created_by === profileId) || [];
    
    const combined = [...createdEvents];
    
    if (coHostedEvents && coHostedEvents.length > 0) {
      coHostedEvents.forEach(coEvent => {
        if (!combined.some(event => event.id === coEvent.id)) {
          combined.push(coEvent);
        }
      });
    }
    
    return combined;
  }, [events, profileId, coHostedEvents]);
  
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
  const upcomingTagIds = getUniqueTagIdsForEvents(upcomingEvents);
  const goingTagIds = getUniqueTagIdsForEvents(rsvpedEvents);
  const hostingTagIds = getUniqueTagIdsForEvents(hostingEvents);
  const pastTagIds = getUniqueTagIdsForEvents(pastEvents);

  const getVisibleTagIds = () => {
    switch (activeTab) {
      case 'today': return todayTagIds;
      case 'upcoming': return upcomingTagIds;
      case 'going': return goingTagIds;
      case 'hosting': return hostingTagIds;
      case 'past': return pastTagIds;
      default: return todayTagIds;
    }
  };

  const visibleTagIds = getVisibleTagIds();

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedDate(undefined);
    setIsSearchMode(false);
    setActiveTab(activeTab || "today");
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

  const handleDateSelection = (date: Date | undefined, shouldSwitchTab: boolean = false) => {
    setSelectedDate(date);
    if (date) {
      setIsSearchMode(true);
    }
  };

  const handleTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
    if (tags.length > 0) {
      setIsSearchMode(true);
    } else if (!selectedDate) {
      setIsSearchMode(false);
    }
  };
  
  const getEventsToShow = () => {
    if (isSearchMode) {
      return filteredEvents;
    }
    
    switch (activeTab) {
      case 'today': return todayEvents;
      case 'upcoming': return upcomingEvents;
      case 'going': return rsvpedEvents;
      case 'hosting': return hostingEvents;
      case 'past': return pastEvents;
      default: return todayEvents;
    }
  };
  
  const eventsToShow = getEventsToShow();

  if (!hasPaidInvoice && !isPaidInvoiceLoading) {
    console.log("🚫 Showing restricted access message - No paid invoice found");
    return (
      <div className="container py-6 space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-hotel-navy">Events</h1>
          <Button asChild>
            <Link to="/invoices">
              View Invoices
            </Link>
          </Button>
        </div>
        <Separator />
        
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

  if (isPaidInvoiceLoading) {
    console.log("⏳ Showing loading state while checking access status");
    return (
      <div className="container py-6 space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-hotel-navy">Events</h1>
        </div>
        <Separator />
        
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

  return (
    <div className="container py-6 space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-hotel-navy">Events</h1>
        
        <div className="flex items-center gap-2">
          <div className="sm:hidden">
            <Button 
              variant="outline"
              size="icon"
              onClick={() => setSearchModalOpen(true)}
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Search events</span>
            </Button>
          </div>
          
          <div className="hidden sm:flex items-center gap-2">
            <Button 
              variant="outline"
              size="icon"
              onClick={() => setSearchModalOpen(true)}
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Search events</span>
            </Button>
            
            {canCreateEvents && (
              <Button 
                onClick={() => {
                  setEventToEdit(null);
                  setCreateEventOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Create Event
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {canCreateEvents && (
        <div className="sm:hidden w-full mt-3">
          <Button 
            onClick={() => {
              setEventToEdit(null);
              setCreateEventOpen(true);
            }}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Event
          </Button>
        </div>
      )}
      
      <Separator className="mt-3" />

      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-grow overflow-x-auto">
              <TagFilter 
                selectedTags={selectedTags} 
                onTagsChange={handleTagsChange}
              />
            </div>
            
            {isMobile && (
              <div className="flex-shrink-0">
                <MobileCalendarDialog 
                  events={events || []} 
                  onSelectDate={handleDateSelection}
                  selectedDate={selectedDate}
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="col-span-1 md:col-span-3">
            {isSearchMode ? (
              <div className="space-y-4">
                <SearchHeader 
                  selectedTags={selectedTags} 
                  selectedDate={selectedDate} 
                  clearFilters={clearFilters} 
                />
                
                {renderEventsList(
                  eventsToShow,
                  isLoading,
                  profileLoading,
                  canCreateEvents,
                  canEditEvent,
                  openDeleteDialog,
                  handleEditEvent,
                  formatDateForSidebar,
                  formatEventTime,
                  formatDateRange,
                  rsvpMap,
                  userRSVPEventIds,
                  profileId,
                  refetchRSVPs,
                  isMobile,
                  handleShare,
                  isAdminUser
                )}
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-2">
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="going">Going</TabsTrigger>
                  <TabsTrigger value="hosting">Hosting</TabsTrigger>
                  <TabsTrigger value="past">Past</TabsTrigger>
                </TabsList>

                <TabsContent value="today" className="space-y-4 mt-4">
                  {renderEventsList(
                    todayEvents,
                    isLoading,
                    profileLoading,
                    canCreateEvents,
                    canEditEvent,
                    openDeleteDialog,
                    handleEditEvent,
                    formatDateForSidebar,
                    formatEventTime,
                    formatDateRange,
                    rsvpMap,
                    userRSVPEventIds,
                    profileId,
                    refetchRSVPs,
                    isMobile,
                    handleShare,
                    isAdminUser
                  )}
                </TabsContent>
                <TabsContent value="upcoming" className="space-y-4 mt-4">
                  {renderEventsList(
                    upcomingEvents,
                    isLoading,
                    profileLoading,
                    canCreateEvents,
                    canEditEvent,
                    openDeleteDialog,
                    handleEditEvent,
                    formatDateForSidebar,
                    formatEventTime,
                    formatDateRange,
                    rsvpMap,
                    userRSVPEventIds,
                    profileId,
                    refetchRSVPs,
                    isMobile,
                    handleShare,
                    isAdminUser
                  )}
                </TabsContent>
                <TabsContent value="going" className="space-y-4 mt-4">
                  {renderEventsList(
                    rsvpedEvents,
                    isLoading,
                    profileLoading,
                    canCreateEvents,
                    canEditEvent,
                    openDeleteDialog,
                    handleEditEvent,
                    formatDateForSidebar,
                    formatEventTime,
                    formatDateRange,
                    rsvpMap,
                    userRSVPEventIds,
                    profileId,
                    refetchRSVPs,
                    isMobile,
                    handleShare,
                    isAdminUser
                  )}
                </TabsContent>
                <TabsContent value="hosting" className="space-y-4 mt-4">
                  {renderEventsList(
                    hostingEvents,
                    isLoading,
                    profileLoading,
                    canCreateEvents,
                    canEditEvent,
                    openDeleteDialog,
                    handleEditEvent,
                    formatDateForSidebar,
                    formatEventTime,
                    formatDateRange,
                    rsvpMap,
                    userRSVPEventIds,
                    profileId,
                    refetchRSVPs,
                    isMobile,
                    handleShare,
                    isAdminUser
                  )}
                </TabsContent>
                <TabsContent value="past" className="space-y-4 mt-4">
                  {renderEventsList(
                    pastEvents,
                    isLoading,
                    profileLoading,
                    canCreateEvents,
                    canEditEvent,
                    openDeleteDialog,
                    handleEditEvent,
                    formatDateForSidebar,
                    formatEventTime,
                    formatDateRange,
                    rsvpMap,
                    userRSVPEventIds,
                    profileId,
                    refetchRSVPs,
                    isMobile,
                    handleShare,
                    isAdminUser
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
          
          {!isMobile && (
            <div className="col-span-1 space-y-4">
              <EventCalendar 
                onSelectDate={handleDateSelection} 
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
        userId={privyUser?.id || supabaseUser?.id || ''}
        profileId={userProfile?.id}
        event={eventToEdit}
        userProfileData={userProfile}
      />

      <EventSearchModal 
        open={searchModalOpen}
        onOpenChange={setSearchModalOpen}
        events={events || []}
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
  canCreateEvents: boolean,
  canEditEvent: (event: EventWithProfile) => boolean,
  openDeleteDialog: (event: Event) => void,
  handleEditEvent: (event: Event) => void,
  formatDateForSidebar: (date: Date) => JSX.Element,
  formatEventTime: (startDate: string, endDate: string, isAllDay: boolean, timezone: string) => string,
  formatDateRange: (startDate: string, endDate: string, isAllDay: boolean) => string,
  rsvpMap: Record<string, RSVPProfile[]>,
  userRSVPEventIds: string[],
  profileId: string | undefined,
  refetchRSVPs: () => void,
  isMobile: boolean,
  handleShare: (event: Event) => void,
  isAdminUser: boolean
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
          {canCreateEvents ? "Get started by creating a new event." : "Check back later for upcoming events."}
        </p>
        {canCreateEvents && (
          <Button className="mt-4" onClick={() => { /* TODO: Implement or link create event action */ }}>
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
              <div className="mr-4 w-full sm:w-20 flex-shrink-0 flex flex-row sm:flex-col items-center mb-4 sm:mb-0">
                {formatDateForSidebar(date)}
                <div className="hidden sm:block h-full w-0.5 bg-gray-200 mt-2 rounded-full"></div>
              </div>
              
              <div className="flex-1 space-y-4 w-full">
                {dateEvents.map((event) => {
                  const isRSVPed = !!profileId && userRSVPEventIds.includes(event.id);
                  const rsvpProfiles = rsvpMap[event.id] || [];
                  const location = event.locations ? 
                    `${event.locations.name}${event.locations.building ? ` (${event.locations.building}${event.locations.floor ? `, Floor ${event.locations.floor}` : ''})` : ''}` :
                    event.location_text;
                  
                  const isCreator = event.created_by === profileId;
                  const canEdit = canEditEvent(event);

                  return (
                    <Card key={event.id} className="overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-200 w-full">
                      <div className="h-1" style={{ backgroundColor: event.color }}></div>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                          <Badge className="w-fit" variant="outline">
                            {formatEventTime(event.start_date, event.end_date, event.is_all_day, event.timezone)}
                          </Badge>
                        </div>
                        
                        <Link to={`/events/${event.id}`} className="hover:underline">
                          <h3 className="text-xl font-bold mb-2 break-words">{event.title}</h3>
                        </Link>
                        
                        <div className="flex items-center text-sm text-gray-600 mb-3">
                          <Calendar className="h-4 w-4 mr-2 flex-shrink-0 text-gray-500" />
                          <span className="truncate">{formatDateRange(event.start_date, event.end_date, event.is_all_day)}</span>
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 mb-4 break-words">{event.description}</p>
                        )}
                        <div className="space-y-2 text-sm">
                          {location && (
                            <div className="flex items-start">
                              <MapPin className="h-4 w-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="break-words">{location}</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                            <span className="truncate">Hosted by {event.profiles?.username || "Anonymous"}</span>
                            
                            {isCreator && profileId && (
                              <AddCoHostPopover 
                                eventId={event.id} 
                                profileId={profileId}
                                onSuccess={refetchRSVPs}
                              />
                            )}
                          </div>
                        </div>

                        {event.speakers && (
                          <div className="flex items-start mt-2">
                            <Mic className="h-4 w-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-600 break-words">{event.speakers}</span>
                          </div>
                        )}

                        {event.event_tags && event.event_tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {event.event_tags.map((tagRel) => (
                              <Badge key={tagRel.tags.id} variant="secondary" className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {tagRel.tags.name}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 mt-4">
                          {!!profileId && new Date(event.end_date) >= new Date() && (
                            <EventRSVPButton
                              eventId={event.id}
                              profileId={profileId}
                              initialRSVP={isRSVPed}
                              onChange={() => refetchRSVPs()}
                            />
                          )}
                          <CalendarOptionsPopover event={event} isMobile={isMobile} />
                          
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="text-gray-500 border-gray-500 hover:bg-gray-50"
                          >
                            <a href={`/events/${event.id}#comments`}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              {isMobile ? "" : "Comments"}
                            </a>
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              handleShare(event);
                            }}
                            className="text-gray-500 border-gray-500 hover:bg-gray-50"
                          >
                            <Share className="h-4 w-4 mr-2" />
                            {isMobile ? "" : "Share"}
                          </Button>
                          
                          {canEdit && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditEvent(event)}
                                className="text-amber-500 border-amber-500 hover:bg-amber-50"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                {isMobile ? "" : "Edit"}
                              </Button>
                              {(isCreator || isAdminUser) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDeleteDialog(event)}
                                  className="text-red-500 border-red-500 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {isMobile ? "" : "Delete"}
                                </Button>
                              )}
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
