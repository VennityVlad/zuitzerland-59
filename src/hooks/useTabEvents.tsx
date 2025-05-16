
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TabEventFilters {
  selectedTags: string[];
  selectedDate?: Date;
  page: number;
  pageSize: number;
}

export const EVENTS_PER_PAGE = 5;

export interface EventData {
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
  parent_event_id?: string | null;
  is_exception?: boolean;
  instance_date?: string | null;
}

export interface EventWithProfile extends EventData {
  profiles?: {
    username: string | null;
    id: string;
  } | null;
}

export function useInfiniteTabEvents(
  tabType: string,
  filters: Omit<TabEventFilters, 'page' | 'pageSize'>,
  profileId?: string,
  isAdmin?: boolean,
  options: {
    staleTime?: number;
    skipReset?: boolean;
  } = {}
) {
  const { selectedTags, selectedDate } = filters;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [events, setEvents] = useState<EventWithProfile[]>([]);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const pageSize = EVENTS_PER_PAGE;
  const { staleTime = 60000, skipReset = false } = options; // Default to 1 minute stale time
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Build the fetch function based on tab type and filters
  const fetchEvents = useCallback(async () => {
    if (!hasMore) return { data: [], hasMore: false };
    
    const offset = page * pageSize;
    
    // Start with a base query
    let query = supabase
      .from("events")
      .select(`
        *,
        profiles:profiles!events_created_by_fkey(username, id),
        locations:location_id (name, building, floor),
        event_tags:event_tag_relations (
          tags:event_tags (id, name)
        )
      `);

    // Apply tag filters if any are selected
    if (selectedTags.length > 0) {
      // Use a subquery to filter events that have any of the selected tags
      const eventIdsWithTags = await supabase
        .from("event_tag_relations")
        .select("event_id")
        .in("tag_id", selectedTags);

      if (eventIdsWithTags.error) {
        throw eventIdsWithTags.error;
      }

      const eventIds = eventIdsWithTags.data.map(relation => relation.event_id);
      if (eventIds.length > 0) {
        query = query.in("id", eventIds);
      } else {
        // No events have the selected tags, return empty array
        return { data: [], hasMore: false };
      }
    }

    // Apply date filter if selected
    if (selectedDate) {
      const dateStart = new Date(selectedDate);
      dateStart.setHours(0, 0, 0, 0);
      
      const dateEnd = new Date(selectedDate);
      dateEnd.setHours(23, 59, 59, 999);

      query = query.or(`start_date.gte.${dateStart.toISOString()},end_date.gte.${dateStart.toISOString()},start_date.lte.${dateEnd.toISOString()}`);
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get date 24 hours ago for "new" tab
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Apply tab-specific filters
    switch (tabType) {
      case "today":
        // Only show events that start or are ongoing today
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);
        
        query = query
          .or(`start_date.gte.${today.toISOString()},start_date.lte.${endOfToday.toISOString()}`)
          .lte("start_date", endOfToday.toISOString());
        break;

      case "upcoming":
        // Show future events (after today)
        query = query.gt("start_date", now.toISOString());
        break;
        
      case "new":
        // Show events created in the last 24 hours
        query = query.gte("created_at", last24Hours.toISOString());
        break;

      case "past":
        // Events that have ended before now
        query = query.lt("end_date", now.toISOString());
        break;

      default:
        // No additional filters for search/default mode
        break;
    }

    // Add pagination
    query = query
      .order("start_date", { ascending: tabType === "past" ? false : true })
      .range(offset, offset + pageSize - 1);

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching events for tab ${tabType}:`, error);
      throw error;
    }

    // Make sure event_tags is properly typed
    const typedEvents = data.map((event: any) => {
      const safeEventTags = Array.isArray(event.event_tags) ? event.event_tags : [];
      return {
        ...event,
        event_tags: safeEventTags
      };
    });

    const hasMoreData = typedEvents.length === pageSize;
    
    return { data: typedEvents as EventWithProfile[], hasMore: hasMoreData };
  }, [tabType, selectedTags, selectedDate, page, profileId, pageSize, hasMore]);

  // Set up the React Query
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["infiniteTabEvents", tabType, selectedTags, selectedDate, page, profileId],
    queryFn: fetchEvents,
    enabled: !!tabType && (!["going", "hosting"].includes(tabType) || !!profileId) && hasMore,
    staleTime: staleTime,
  });

  // Set up periodic refresh timer - refresh every minute
  useEffect(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    refreshTimerRef.current = setInterval(() => {
      console.log(`Auto-refreshing events for tab ${tabType}`);
      setLastRefreshTime(new Date());
      refetch();
    }, 60000); // Refresh every 1 minute

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [refetch, tabType]);

  useEffect(() => {
    if (data?.data) {
      if (page === 0) {
        setEvents(data.data);
      } else {
        setEvents(prev => [...prev, ...data.data]);
      }
      setHasMore(data.hasMore);
    }
  }, [data, page]);

  const loadMore = useCallback(() => {
    if (!isLoading && !isFetching && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [isLoading, isFetching, hasMore]);

  const resetEvents = useCallback(() => {
    if (skipReset) {
      console.log(`Skipping reset for tab ${tabType} due to skipReset option`);
      return;
    }
    
    console.log(`Resetting events for tab ${tabType}`);
    setEvents([]);
    setPage(0);
    setHasMore(true);
  }, [skipReset, tabType]);

  return { 
    events, 
    isLoading: isLoading || (isFetching && page === 0), 
    isFetchingMore: isFetching && page > 0,
    hasMore,
    loadMore,
    resetEvents,
    refetch,
    error,
    lastRefreshTime
  };
}

export function useTabEvents(
  tabType: string,
  filters: TabEventFilters,
  profileId?: string,
  isAdmin?: boolean
) {
  const { selectedTags, selectedDate, page, pageSize } = filters;
  const offset = page * pageSize;

  // Build the fetch function based on tab type and filters
  const fetchEvents = async () => {
    // Start with a base query
    let query = supabase
      .from("events")
      .select(`
        *,
        profiles:profiles!events_created_by_fkey(username, id),
        locations:location_id (name, building, floor),
        event_tags:event_tag_relations (
          tags:event_tags (id, name)
        )
      `);

    // Apply tag filters if any are selected
    if (selectedTags.length > 0) {
      // Use a subquery to filter events that have any of the selected tags
      const eventIdsWithTags = await supabase
        .from("event_tag_relations")
        .select("event_id")
        .in("tag_id", selectedTags);

      if (eventIdsWithTags.error) {
        throw eventIdsWithTags.error;
      }

      const eventIds = eventIdsWithTags.data.map(relation => relation.event_id);
      if (eventIds.length > 0) {
        query = query.in("id", eventIds);
      } else {
        return []; // No events have the selected tags
      }
    }

    // Apply date filter if selected
    if (selectedDate) {
      const dateStart = new Date(selectedDate);
      dateStart.setHours(0, 0, 0, 0);
      
      const dateEnd = new Date(selectedDate);
      dateEnd.setHours(23, 59, 59, 999);

      query = query.or(`start_date.gte.${dateStart.toISOString()},end_date.gte.${dateStart.toISOString()},start_date.lte.${dateEnd.toISOString()}`);
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Apply tab-specific filters
    switch (tabType) {
      case "today":
        // Only show events that start or are ongoing today
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);
        
        query = query
          .or(`start_date.gte.${today.toISOString()},start_date.lte.${endOfToday.toISOString()}`)
          .lte("start_date", endOfToday.toISOString());
        break;

      case "upcoming":
        // Show future events (after today)
        query = query.gt("start_date", now.toISOString());
        break;

      case "going":
        // Need to fetch RSVPs first to filter by events the user is going to
        if (profileId) {
          const { data: rsvpData, error: rsvpError } = await supabase
            .from("event_rsvps")
            .select("event_id")
            .eq("profile_id", profileId);

          if (rsvpError) {
            throw rsvpError;
          }

          const rsvpEventIds = rsvpData.map(rsvp => rsvp.event_id);
          if (rsvpEventIds.length === 0) {
            return []; // User hasn't RSVPed to any events
          }
          
          query = query.in("id", rsvpEventIds);
        } else {
          return []; // No profile ID, can't determine "going" events
        }
        break;

      case "hosting":
        // Events created by the user or where they're a co-host
        if (profileId) {
          const { data: coHostData, error: coHostError } = await supabase
            .from("event_co_hosts")
            .select("event_id")
            .eq("profile_id", profileId);

          if (coHostError) {
            throw coHostError;
          }

          const coHostEventIds = coHostData?.map(ch => ch.event_id) || [];
          
          if (coHostEventIds.length > 0) {
            query = query.or(`created_by.eq.${profileId},id.in.(${coHostEventIds.join(',')})`);
          } else {
            query = query.eq("created_by", profileId);
          }
        } else {
          return []; // No profile ID, can't determine "hosting" events
        }
        break;

      case "past":
        // Events that have ended before now
        query = query.lt("end_date", now.toISOString());
        break;

      default:
        // No additional filters for search/default mode
        break;
    }

    // Add pagination
    query = query
      .order("start_date", { ascending: tabType === "past" ? false : true })
      .range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error(`Error fetching events for tab ${tabType}:`, error);
      throw error;
    }

    // Make sure event_tags is properly typed
    const typedEvents = data.map((event: any) => {
      const safeEventTags = Array.isArray(event.event_tags) ? event.event_tags : [];
      return {
        ...event,
        event_tags: safeEventTags
      };
    });

    return typedEvents;
  };

  // Set up the React Query
  return useQuery({
    queryKey: ["tabEvents", tabType, selectedTags, selectedDate, page, pageSize, profileId],
    queryFn: fetchEvents,
    enabled: !!tabType && (!["going", "hosting"].includes(tabType) || !!profileId)
  });
}

export function useEventCount(tabType: string, filters: Omit<TabEventFilters, 'page' | 'pageSize'>, profileId?: string) {
  const { selectedTags, selectedDate } = filters;

  // Build a query to get total count
  const fetchEventCount = async () => {
    // Start with a base query
    let query = supabase
      .from("events")
      .select("id", { count: "exact" });

    // Apply tag filters if any are selected
    if (selectedTags.length > 0) {
      // Use a subquery to filter events that have any of the selected tags
      const eventIdsWithTags = await supabase
        .from("event_tag_relations")
        .select("event_id")
        .in("tag_id", selectedTags);

      if (eventIdsWithTags.error) {
        throw eventIdsWithTags.error;
      }

      const eventIds = eventIdsWithTags.data.map(relation => relation.event_id);
      if (eventIds.length > 0) {
        query = query.in("id", eventIds);
      } else {
        return 0; // No events have the selected tags
      }
    }

    // Apply date filter if selected
    if (selectedDate) {
      const dateStart = new Date(selectedDate);
      dateStart.setHours(0, 0, 0, 0);
      
      const dateEnd = new Date(selectedDate);
      dateEnd.setHours(23, 59, 59, 999);

      query = query.or(`start_date.gte.${dateStart.toISOString()},end_date.gte.${dateStart.toISOString()},start_date.lte.${dateEnd.toISOString()}`);
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Apply tab-specific filters
    switch (tabType) {
      case "today":
        // Only show events that start or are ongoing today
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);
        
        query = query
          .or(`start_date.gte.${today.toISOString()},start_date.lte.${endOfToday.toISOString()}`)
          .lte("start_date", endOfToday.toISOString());
        break;

      case "upcoming":
        // Show future events (after today)
        query = query.gt("start_date", now.toISOString());
        break;

      case "going":
        // Need to fetch RSVPs first to filter by events the user is going to
        if (profileId) {
          const { data: rsvpData, error: rsvpError } = await supabase
            .from("event_rsvps")
            .select("event_id")
            .eq("profile_id", profileId);

          if (rsvpError) {
            throw rsvpError;
          }

          const rsvpEventIds = rsvpData.map(rsvp => rsvp.event_id);
          if (rsvpEventIds.length === 0) {
            return 0; // User hasn't RSVPed to any events
          }
          
          query = query.in("id", rsvpEventIds);
        } else {
          return 0; // No profile ID, can't determine "going" events
        }
        break;

      case "hosting":
        // Events created by the user or where they're a co-host
        if (profileId) {
          const { data: coHostData, error: coHostError } = await supabase
            .from("event_co_hosts")
            .select("event_id")
            .eq("profile_id", profileId);

          if (coHostError) {
            throw coHostError;
          }

          const coHostEventIds = coHostData?.map(ch => ch.event_id) || [];
          
          if (coHostEventIds.length > 0) {
            query = query.or(`created_by.eq.${profileId},id.in.(${coHostEventIds.join(',')})`);
          } else {
            query = query.eq("created_by", profileId);
          }
        } else {
          return 0; // No profile ID, can't determine "hosting" events
        }
        break;

      case "past":
        // Events that have ended before now
        query = query.lt("end_date", now.toISOString());
        break;

      default:
        // No additional filters for search/default mode
        break;
    }

    const { count, error } = await query;

    if (error) {
      console.error(`Error counting events for tab ${tabType}:`, error);
      throw error;
    }

    return count || 0;
  };

  // Set up the React Query
  return useQuery({
    queryKey: ["eventCount", tabType, selectedTags, selectedDate, profileId],
    queryFn: fetchEventCount,
    enabled: !!tabType && (!["going", "hosting"].includes(tabType) || !!profileId)
  });
}

export function useEventRSVPs(eventIds: string[]) {
  const fetchRSVPs = async () => {
    if (!eventIds || eventIds.length === 0) return {};
    
    console.log("🔍 Fetching RSVPs for specific events:", eventIds.length);
    
    const { data, error } = await supabase
      .from("event_rsvps")
      .select("event_id, profile_id, profiles(id, username, avatar_url)")
      .in("event_id", eventIds);
    
    if (error) {
      console.error("❌ Error fetching RSVPs:", error);
      throw error;
    }
    
    console.log("✅ RSVP data fetched successfully for specific events");
    
    // Convert to map for easy lookup
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
  };
  
  return useQuery({
    queryKey: ["eventRSVPs", eventIds],
    queryFn: fetchRSVPs,
    enabled: eventIds.length > 0,
    staleTime: 10000 // 10 seconds
  });
}

export function useUserRSVPs(profileId?: string) {
  const fetchUserRSVPs = async () => {
    if (!profileId) return [];
    
    const { data, error } = await supabase
      .from("event_rsvps")
      .select("event_id")
      .eq("profile_id", profileId);
    
    if (error) {
      console.error("❌ Error fetching user RSVPs:", error);
      throw error;
    }
    
    return data.map(r => r.event_id);
  };
  
  return useQuery({
    queryKey: ["userRSVPs", profileId],
    queryFn: fetchUserRSVPs,
    enabled: !!profileId
  });
}
