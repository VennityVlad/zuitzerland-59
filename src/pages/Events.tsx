import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, isSameDay } from "date-fns";
import { CalendarDays, Plus, Trash2, MapPin, User, Edit, Calendar, Tag, Share, RefreshCw, Search, Mic, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePaidInvoiceStatus } from "@/hooks/usePaidInvoiceStatus";
import { EventRSVPAvatars } from "@/components/events/EventRSVPAvatars";
import { EventRSVPButton } from "@/components/events/EventRSVPButton";
import { MobileCalendarDialog } from "@/components/events/MobileCalendarDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CreateEventSheet } from "@/components/events/CreateEventSheet";
import { TagFilter } from "@/components/events/TagFilter";
import { EventCalendar } from "@/components/calendar/EventCalendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { SearchHeader } from "@/pages/events/SearchHeader";
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
import { Link, useNavigate } from 'react-router-dom';
import { EventSearchModal } from "@/components/events/EventSearchModal"; 
import { EVENTS_PER_PAGE, EventWithProfile, useInfiniteTabEvents } from "@/hooks/useTabEvents";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationCount
} from "@/components/ui/pagination";

const Events = () => {
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventWithProfile | null>(null);
  const [eventToEdit, setEventToEdit] = useState<EventWithProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("upcoming");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGoing, setIsGoing] = useState(false);
  const [isHosting, setIsHosting] = useState(false);
  const [accumulatedEvents, setAccumulatedEvents] = useState<EventWithProfile[]>([]);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { user: privyUser } = usePrivy();
  const { user: supabaseUser } = useSupabaseAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const { hasPaidInvoice, isLoading: isPaidInvoiceLoading, isAdmin: userIsAdmin } = usePaidInvoiceStatus(
    privyUser?.id || supabaseUser?.id
  );
  
  const refreshTimerRef = useRef<number | null>(null);
  
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
  
  const { data: allEvents } = useQuery({
    queryKey: ["calendarEvents"],
    queryFn: async () => {
      console.log("🔍 Fetching calendar events");
      const { data, error } = await supabase
        .from("events")
        .select(`
          id, title, start_date, end_date, color, is_all_day, location_id, location_text, timezone
        `)
        .order("start_date", { ascending: true });

      if (error) {
        console.error("Error fetching calendar events:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !isPaidInvoiceLoading && (hasPaidInvoice || userIsAdmin)
  });
  
  const canCreateEvents = !!userProfile?.id;
  const isAdminUser = userProfile?.role === 'admin';
  
  const userId = privyUser?.id || supabaseUser?.id || "";
  const profileId = userProfile?.id;
  
  useEffect(() => {
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
    }
    
    refreshTimerRef.current = window.setTimeout(() => {
      console.log(`Auto-refreshing events after 1 minute`);
      refetchEvents();
    }, 60000);
    
    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, [activeTab, selectedTags, selectedDate, isGoing, isHosting]);
  
  const { 
    events, 
    isLoading: eventsLoading, 
    isFetchingMore: eventsFetching,
    hasMore,
    loadMore,
    resetEvents: resetTabEvents,
    refetch: refetchEvents,
    totalCount: eventsTotalCount,
    currentPage: eventsCurrentPage
  } = useInfiniteTabEvents(
    activeTab, 
    { selectedTags, selectedDate, isGoing, isHosting },
    profileId,
    isAdminUser
  );
  
  const eventIds = events?.map(event => event.id) || [];
  
  const { data: rsvpMap, refetch: refetchRSVPs } = useQuery({
    queryKey: ["eventRSVPs", eventIds],
    queryFn: async () => {
      if (!eventIds || eventIds.length === 0) return {};
      
      console.log("🔍 Fetching RSVPs for displayed events");
      
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("event_id, profile_id, profiles(id, username, avatar_url)")
        .in("event_id", eventIds);
      
      if (error) {
        console.error("Error fetching RSVPs:", error);
        throw error;
      }
      
      const rsvpMap: Record<string, { id: string; username: string | null; avatar_url?: string | null }[]> = {};
      
      if (data) {
        data.forEach(r => {
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
      
      return rsvpMap;
    },
    enabled: eventIds.length > 0,
  });

  const { data: userRSVPEventIds = [], refetch: refetchUserRSVPs } = useQuery({
    queryKey: ["userRSVPs", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("event_id")
        .eq("profile_id", profileId);
      
      if (error) {
        console.error("Error fetching user RSVPs:", error);
        throw error;
      }
      
      return data.map(r => r.event_id);
    },
    enabled: !!profileId
  });

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    resetTabEvents();
  };
  
  const refreshData = () => {
    setIsRefreshing(true);
    resetTabEvents();
    Promise.all([
      refetchEvents(), 
      refetchRSVPs(), 
      refetchUserRSVPs()
    ]).finally(() => {
      setTimeout(() => setIsRefreshing(false), 500);
    });
  };

  useEffect(() => {
    if (events) {
      if (eventsCurrentPage === 0) {
        setAccumulatedEvents(events);
      } else {
        setAccumulatedEvents(prev => {
          const existingEventIds = new Set(prev.map(event => event.id));
          const newEvents = events.filter(event => !existingEventIds.has(event.id));
          return [...prev, ...newEvents];
        });
      }
    }
  }, [events, eventsCurrentPage]);

  useEffect(() => {
    setAccumulatedEvents([]);
  }, [activeTab, selectedTags, selectedDate, isGoing, isHosting]);

  const handleCreateEventSuccess = useCallback((newEventId: string) => {
    console.log("Event created successfully, navigating to event page:", newEventId);
    
    queryClient.invalidateQueries({ queryKey: ["tabEvents"] });
    queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
    
    setCreateEventOpen(false);
    setEventToEdit(null);
    
    if (newEventId) {
      navigate(`/events/${newEventId}`);
    } else {
      console.error("Cannot navigate to event page: No event ID provided");
      toast({
        title: "Error",
        description: "Could not open the event page",
        variant: "destructive"
      });
    }
  }, [queryClient, navigate, toast]);

  const toggleGoingFilter = () => {
    if (isHosting) setIsHosting(false);
    setIsGoing(!isGoing);
    resetTabEvents();
  };

  const toggleHostingFilter = () => {
    if (isGoing) setIsGoing(false);
    setIsHosting(!isHosting);
    resetTabEvents();
  };

  const clearAllFilters = () => {
    setIsGoing(false);
    setIsHosting(false);
    setSelectedTags([]);
    setSelectedDate(undefined);
    setIsDateFilterActive(false);
    setActiveTab("upcoming");
    resetTabEvents();
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
      
      setActiveTab("upcoming");
      resetTabEvents();
      queryClient.invalidateQueries({ queryKey: ["tabEvents"] });
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
      queryClient.invalidateQueries({ queryKey: ["eventCount"] });
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

  const handleEditEvent = (event: EventWithProfile) => {
    setEventToEdit(event);
    setCreateEventOpen(true);
  };

  const handleShare = async (event: EventWithProfile) => {
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

  const handleDateSelection = (date: Date | undefined) => {
    setSelectedDate(date);
    setIsDateFilterActive(!!date);
    resetTabEvents();
    if (date) {
      setActiveTab("upcoming");
    }
  };

  const handleTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
    resetTabEvents();
  };
  
  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedDate(undefined);
    setIsDateFilterActive(false);
    setIsGoing(false);
    setIsHosting(false);
    setActiveTab("upcoming");
    resetTabEvents();
  };

  const handleRSVPChange = (eventId: string, newStatus: boolean) => {
    refetchRSVPs();
    refetchUserRSVPs();
  };

  const displayedEvents = accumulatedEvents.length > 0 ? accumulatedEvents : events;

  const currentPageRSVPMap = rsvpMap || {};

  if (!hasPaidInvoice && !isPaidInvoiceLoading) {
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
            <CalendarDays className="h-8 w-8 text-gray-400" />
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
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0">
                <TagFilter 
                  selectedTags={selectedTags} 
                  onTagsChange={handleTagsChange}
                />
              </div>
              
              <Button
                variant={isGoing ? "default" : "outline"}
                size="sm"
                onClick={toggleGoingFilter}
                disabled={!profileId}
                className={`flex-shrink-0 h-10 ${isGoing ? "bg-green-600 hover:bg-green-700" : ""}`}
              >
                Going
              </Button>
              
              <Button
                variant={isHosting ? "default" : "outline"}
                size="sm"
                onClick={toggleHostingFilter}
                disabled={!profileId}
                className={`flex-shrink-0 h-10 ${isHosting ? "bg-blue-600 hover:bg-blue-700" : ""}`}
              >
                Hosting
              </Button>
              
              {selectedDate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDateSelection(undefined)}
                  className="flex-shrink-0 h-10 bg-gray-100"
                >
                  <Calendar className="mr-1 h-4 w-4" />
                  {format(selectedDate, "MMM d, yyyy")}
                  <span className="ml-1 text-xs">×</span>
                </Button>
              )}
            </div>
            
            {isMobile && (
              <div className="ml-auto flex-shrink-0">
                <MobileCalendarDialog 
                  events={allEvents || []} 
                  onSelectDate={handleDateSelection}
                  selectedDate={selectedDate}
                />
              </div>
            )}
          </div>
          
          {(isGoing || isHosting || selectedTags.length > 0 || !!selectedDate) && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="col-span-1 md:col-span-3">
            <div className="flex justify-between items-center mb-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={refreshData}
                disabled={isRefreshing || eventsLoading || eventsFetching}
                className="text-gray-500"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              
              <div className="text-xs text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
            
            <SearchHeader 
              selectedTags={selectedTags} 
              selectedDate={selectedDate} 
              clearFilters={clearFilters} 
              isGoing={isGoing}
              isHosting={isHosting}
            />
            
            {displayedEvents.length > 0 ? (
              <div className="space-y-4 mt-4">
                {renderEventsList(
                  displayedEvents,
                  eventsLoading,
                  eventsFetching,
                  hasMore,
                  currentPageRSVPMap,
                  userRSVPEventIds || [],
                  profileId,
                  handleRSVPChange,
                  canCreateEvents,
                  (event) => isAdminUser || event.profiles?.id === profileId,
                  openDeleteDialog,
                  handleEditEvent,
                  handleShare,
                  formatDateForSidebar,
                  formatEventTime,
                  formatDateRange,
                  isMobile,
                  isAdminUser
                )}
                
                <div className="mt-6 flex justify-between items-center">
                  <PaginationCount 
                    currentPage={eventsCurrentPage}
                    totalItems={eventsTotalCount}
                    pageSize={EVENTS_PER_PAGE}
                  />
                  
                  {hasMore && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={loadMore}
                      disabled={eventsFetching}
                    >
                      {eventsFetching ? 'Loading...' : 'Load more'}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium">No events found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {canCreateEvents ? "Get started by creating a new event." : "Check back later for upcoming events."}
                </p>
                {canCreateEvents && (
                  <Button className="mt-4" onClick={() => {}}>
                    <Plus className="mr-2 h-4 w-4" /> Create Event
                  </Button>
                )}
              </div>
            )}
          </div>
          
          {!isMobile && (
            <div className="col-span-1 space-y-4">
              <EventCalendar 
                onSelectDate={handleDateSelection} 
                events={allEvents || []}
                onRefresh={refreshData}
                isRefreshing={isRefreshing}
                selectedDate={selectedDate}
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
        events={allEvents || []}
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

const formatTimeRange = (start: Date, end: Date, isAllDay: boolean, timezone: string) => {
  if (isAllDay) return "All day";
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.warn('Invalid date detected:', { start, end });
    return 'Invalid date';
  }

  return `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
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

const renderEventsList = (
  events: EventWithProfile[], 
  isLoading: boolean,
  isFetchingMore: boolean,
  hasMore: boolean,
  rsvpMap: Record<string, { id: string; username: string | null; avatar_url?: string | null }[]>,
  userRSVPEventIds: string[],
  profileId: string | undefined,
  onRSVPChange: (eventId: string, newStatus: boolean) => void,
  canCreateEvents: boolean,
  canEditEvent: (event: EventWithProfile) => boolean,
  openDeleteDialog: (event: EventWithProfile) => void,
  handleEditEvent: (event: EventWithProfile) => void,
  handleShare: (event: EventWithProfile) => void,
  formatDateForSidebar: (date: Date) => JSX.Element,
  formatEventTime: (startDate: string, endDate: string, isAllDay: boolean, timezone: string) => string,
  formatDateRange: (startDate: string, endDate: string, isAllDay: boolean) => string,
  isMobile: boolean,
  isAdminUser: boolean
) => {
  if (isLoading) {
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
                              onChange={(isRsvped) => onRSVPChange(event.id, isRsvped)}
                            />
                          )}
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
      
      {isFetchingMore && (
        <div className="flex justify-center py-4">
          <div className="animate-pulse">Loading more events...</div>
        </div>
      )}
      
      {!isLoading && !isFetchingMore && !hasMore && events.length > 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          No more events to load
        </div>
      )}
    </div>
  );
};

export default Events;
