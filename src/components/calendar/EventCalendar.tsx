
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, isSameDay, isWithinInterval, parseISO, isSameMonth } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { DayContent } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  av_needs?: string | null;
  speakers?: string | null;
}

interface EventCalendarProps {
  onSelectDate?: (date: Date | undefined) => void;
  className?: string;
}

export const EventCalendar = ({ onSelectDate, className }: EventCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();
  const TIME_ZONE = "Europe/Zurich";

  const { data: events, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["calendar-events", format(currentMonth, "yyyy-MM")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: true });

      if (error) {
        toast({
          title: "Error fetching events",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data as Event[];
    }
  });

  const handleDateSelect = (date: Date | undefined) => {
    if (date && selectedDate && isSameDay(date, selectedDate)) {
      setSelectedDate(undefined);
      if (onSelectDate) onSelectDate(undefined);
    } else {
      setSelectedDate(date);
      if (onSelectDate) onSelectDate(date);
    }
  };

  const handleMonthChange = (date: Date) => {
    setCurrentMonth(startOfMonth(date));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const convertUTCToCEST = (utcDateString: string): Date => {
    const utcDate = new Date(utcDateString);
    // Add 2 hours to convert from UTC to CEST
    return new Date(utcDate.getTime() + 2 * 60 * 60 * 1000);
  };

  const getDayEvents = (day: Date): Event[] => {
    if (!events) return [];
    
    return events.filter(event => {
      const startDate = convertUTCToCEST(event.start_date);
      const endDate = convertUTCToCEST(event.end_date);
      
      return isWithinInterval(day, { start: startDate, end: endDate }) ||
             isSameDay(day, startDate) || 
             isSameDay(day, endDate);
    });
  };

  const renderDay = (date: Date, modifiers: Record<string, boolean>) => {
    const dayEvents = getDayEvents(date);
    const hasEvents = dayEvents.length > 0;
    
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`relative h-9 w-9 p-0 flex items-center justify-center rounded-md ${
              isSameDay(date, selectedDate || new Date(0)) ? "bg-primary text-primary-foreground" : 
              modifiers.today ? "bg-accent text-accent-foreground" : ""
            }`}>
              <span>{format(date, "d")}</span>
              {hasEvents && (
                <div className="absolute -bottom-1 flex gap-0.5 justify-center">
                  {dayEvents.slice(0, 3).map((event, i) => (
                    <div 
                      key={i}
                      className="h-1 w-1 rounded-full" 
                      style={{ backgroundColor: event.color }}
                    />
                  ))}
                  {dayEvents.length > 3 && <div className="h-1 w-1 rounded-full bg-gray-400" />}
                </div>
              )}
            </div>
          </TooltipTrigger>
          {hasEvents && (
            <TooltipContent side="bottom" className="p-2 max-w-xs">
              <div className="space-y-1">
                {dayEvents.map((event) => (
                  <div key={event.id} className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: event.color }}
                      />
                      <span className="font-semibold">{event.title}</span>
                    </div>
                    {(event.location_text || event.location_id) && (
                      <div className="text-[10px] text-gray-500 ml-3.5">{event.location_text || `Location ID: ${event.location_id}`}</div>
                    )}
                  </div>
                ))}
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  const CustomDayContent = (props: { date: Date; displayMonth: Date }) => {
    const { date } = props;
    const modifiers = {
      selected: selectedDate ? isSameDay(date, selectedDate) : false,
      today: isSameDay(date, new Date())
    };
    
    return renderDay(date, modifiers);
  };

  const formatMonthTitle = (month: Date) => {
    return format(month, "MMMM yyyy");
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 p-4 ${className}`}>
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Event Calendar</h4>
      
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigateMonth('prev')}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h5 className="font-medium">{formatMonthTitle(currentMonth)}</h5>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigateMonth('next')}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Calendar 
        mode="single"
        month={currentMonth}
        onMonthChange={handleMonthChange}
        selected={selectedDate}
        onSelect={handleDateSelect}
        modifiersStyles={{
          selected: { backgroundColor: 'var(--primary)' },
          today: { backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }
        }}
        components={{
          DayContent: CustomDayContent
        }}
        className="pointer-events-auto"
      />
      
      {selectedDate && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Filtering on: {format(selectedDate, "MMMM d, yyyy")}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleDateSelect(undefined)}
              className="h-7 text-xs"
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
