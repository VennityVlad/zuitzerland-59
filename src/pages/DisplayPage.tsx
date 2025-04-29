import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, startOfDay, endOfDay, isSameDay, addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getReadableTimezoneName } from '@/lib/date-utils';
import { useDisplayCode } from '@/hooks/useDisplayCode';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

type Event = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  is_all_day: boolean;
  location_text: string;
  location_id?: string;
  description?: string;
  timezone: string;
  tags?: { id: string; name: string; color: string }[];
};

const DisplayPage = () => {
  const [searchParams] = useSearchParams();
  const codeParam = searchParams.get('code');
  const { displayCode, isLoading, error, isValid } = useDisplayCode(codeParam);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [clockTime, setClockTime] = useState(new Date());
  const [isScrolling, setIsScrolling] = useState(false);
  const eventsContainerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Clock time updater and date change at midnight
  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = new Date();
      setClockTime(newTime);
      
      // Check if we need to change the date (it's a new day)
      const currentDate = selectedDate;
      if (newTime.getDate() !== currentDate.getDate() || 
          newTime.getMonth() !== currentDate.getMonth() || 
          newTime.getFullYear() !== currentDate.getFullYear()) {
        console.log("Midnight detected, changing date to today");
        setSelectedDate(new Date(newTime));
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [selectedDate]);
  
  // Auto-scroll logic
  useEffect(() => {
    if (!eventsContainerRef.current || events.length === 0) return;
    
    // Check if content needs scrolling (content height > container height)
    const container = scrollRef.current;
    if (!container) return;
    
    const checkOverflow = () => {
      const hasOverflow = container.scrollHeight > container.clientHeight;
      setIsScrolling(hasOverflow);
    };
    
    // Check initial overflow after events load
    const timeoutId = setTimeout(checkOverflow, 500);
    
    // Check again if window resizes
    window.addEventListener('resize', checkOverflow);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [events]);
  
  // Auto-scrolling animation
  useEffect(() => {
    if (!isScrolling || !scrollRef.current) return;
    
    const container = scrollRef.current;
    let animationId: number | null = null;
    let direction = 1; // 1 for down, -1 for up
    let position = 0;
    
    const scrollSpeed = 0.5; // Pixels per frame
    
    const animate = () => {
      if (!container) return;
      
      // Calculate how far to scroll based on content height
      const maxScroll = container.scrollHeight - container.clientHeight;
      
      if (maxScroll <= 0) {
        // No need to scroll if content fits
        return;
      }
      
      position += direction * scrollSpeed;
      
      // Change direction when reaching top or bottom
      if (position >= maxScroll) {
        position = maxScroll;
        direction = -1;
      } else if (position <= 0) {
        position = 0;
        direction = 1;
      }
      
      container.scrollTop = position;
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isScrolling]);
  
  // Load events for the selected day
  useEffect(() => {
    if (!isValid || !displayCode) return;
    
    const fetchEvents = async () => {
      try {
        const dayStart = startOfDay(selectedDate);
        const dayEnd = endOfDay(selectedDate);
        
        let query = supabase
          .from('events')
          .select(`
            *,
            tags:event_tag_relations(
              tag:event_tags(id, name, color)
            )
          `)
          .gte('start_date', dayStart.toISOString())
          .lte('start_date', dayEnd.toISOString())
          .order('start_date', { ascending: true });
          
        // Add location filter if specified
        if (displayCode.location_filter) {
          query = query.eq('location_id', displayCode.location_filter);
        }
        
        // Fetch events
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Process the events
        const processedEvents = data.map((event: any) => {
          // Extract tags from the nested structure
          const tags = event.tags?.map((tagRel: any) => tagRel.tag) || [];
          
          return {
            ...event,
            tags
          };
        })
        .filter((event: any) => {
          // If we have tag_filters (multiple tags), check if the event has any of these tags
          if (displayCode.tag_filters && displayCode.tag_filters.length > 0) {
            return event.tags.some((tag: any) => 
              displayCode.tag_filters?.includes(tag.id)
            );
          }
          
          // If we have a single tag_filter, check if the event has this tag
          if (displayCode.tag_filter) {
            return event.tags.some((tag: any) => tag.id === displayCode.tag_filter);
          }
          
          // If no tag filters are set, include all events
          return true;
        });
        
        setEvents(processedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };
    
    fetchEvents();
    
    // Set up real-time subscriptions for events table
    const eventsChannel = supabase
      .channel('public:events')
      .on('postgres_changes', 
        {
          event: '*', 
          schema: 'public',
          table: 'events'
        }, 
        (_payload) => {
          console.log('Events table changed, refreshing data');
          fetchEvents();
        }
      )
      .subscribe();
      
    // Also listen for changes to event tags in case tags are modified
    const tagsChannel = supabase
      .channel('public:event_tag_relations')
      .on('postgres_changes', 
        {
          event: '*', 
          schema: 'public',
          table: 'event_tag_relations'
        }, 
        (_payload) => {
          console.log('Event tags changed, refreshing data');
          fetchEvents();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(tagsChannel);
    };
  }, [isValid, displayCode, selectedDate]);
  
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };
  
  // Format time for display
  const formatEventTime = (start: string, end: string, isAllDay: boolean, timezone: string) => {
    if (isAllDay) return 'All day';
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    return `${format(startDate, 'HH:mm')} - ${format(endDate, 'HH:mm')}`;
  };
  
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 min-h-screen flex items-center justify-center">
        <img src="/lovable-uploads/bbaac92f-6bd2-42ee-9c5e-539412b87f76.png" alt="Zuitzerland" className="w-40 animate-pulse" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 min-h-screen flex flex-col items-center justify-center p-8">
        <img src="/lovable-uploads/bbaac92f-6bd2-42ee-9c5e-539412b87f76.png" alt="Zuitzerland" className="w-64 mb-8" />
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 max-w-md w-full border border-white/30">
          <h1 className="text-2xl font-bold text-white mb-4">Access Error</h1>
          <p className="text-white mb-6">{error}</p>
          <p className="text-white/70 text-sm">
            Please use a valid access code in the URL or contact an administrator for assistance.
          </p>
        </div>
      </div>
    );
  }
  
  const today = new Date();
  const isToday = isSameDay(selectedDate, today);
  
  return (
    <div className="bg-gradient-to-r from-purple-500 to-blue-600 min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <img src="/lovable-uploads/bbaac92f-6bd2-42ee-9c5e-539412b87f76.png" alt="Zuitzerland" className="h-16" />
        <div className="text-white text-3xl font-bold">
          {format(clockTime, 'HH:mm:ss')}
        </div>
      </header>
      
      {/* Date Navigation */}
      <div className="flex justify-between items-center px-6 py-3">
        <Button 
          variant="ghost" 
          onClick={() => navigateDay('prev')}
          className="text-white hover:bg-white/20"
        >
          <ChevronLeft className="mr-1 h-5 w-5" />
          Previous Day
        </Button>
        
        <h2 className="text-white text-2xl font-bold">
          {isToday ? 'Today' : format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h2>
        
        <Button 
          variant="ghost" 
          onClick={() => navigateDay('next')}
          className="text-white hover:bg-white/20"
        >
          Next Day
          <ChevronRight className="ml-1 h-5 w-5" />
        </Button>
      </div>
      
      {/* Events List */}
      <div className="flex-1 px-6 pb-6" ref={eventsContainerRef}>
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/30 h-full p-6 overflow-hidden flex flex-col">
          <h2 className="text-white text-xl font-semibold mb-4">
            {events.length > 0 ? 'Schedule' : 'No events scheduled'}
          </h2>
          
          {/* Display name */}
          <div className="text-white/70 text-sm mb-6">
            {displayCode?.name} • {getReadableTimezoneName(events[0]?.timezone || 'Europe/Zurich')}
          </div>
          
          <ScrollArea className="flex-1 pr-2 overflow-hidden">
            <div ref={scrollRef} className="h-full">
              {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-white/70 text-lg mb-2">No events scheduled for this day</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div 
                      key={event.id} 
                      className="bg-white/20 backdrop-blur-md rounded-lg p-4 border border-white/30"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="text-white text-xl font-bold">{event.title}</h3>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-white/70" />
                          <span className="text-white/90 text-sm">
                            {formatEventTime(event.start_date, event.end_date, event.is_all_day, event.timezone)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center mt-2">
                        {event.location_text && (
                          <div className="flex items-center text-white/70 text-sm">
                            <MapPin className="h-4 w-4 mr-1" />
                            {event.location_text}
                          </div>
                        )}
                      </div>
                      
                      {/* Event tags */}
                      {event.tags && event.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {event.tags.map((tag: any) => (
                            <span 
                              key={tag.id}
                              className="px-2 py-1 rounded-full text-xs text-white"
                              style={{ backgroundColor: tag.color || '#1a365d' }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Event description - truncated */}
                      {event.description && (
                        <p className="text-white/80 mt-2 line-clamp-2 text-sm">
                          {event.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default DisplayPage;
