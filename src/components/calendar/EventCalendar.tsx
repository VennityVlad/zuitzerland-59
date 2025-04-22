import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, isSameDay, isWithinInterval, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { DayContent } from "react-day-picker";

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
  onSelectDate?: (date: Date) => void;
}

export const EventCalendar = ({ onSelectDate }: EventCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2025, 4)); // May 2025
  const { toast } = useToast();

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

  const handleMonthChange = (date: Date) => {
    setCurrentMonth(startOfMonth(date));
  };

  const getDayEvents = (day: Date): Event[] => {
    if (!events) return [];
    
    return events.filter(event => {
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);
      
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
              modifiers.selected ? "bg-primary text-primary-foreground" : 
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
      selected: false,
      today: isSameDay(date, new Date())
    };
    
    return renderDay(date, modifiers);
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    if (isSameDay(start, end)) {
      return format(start, "MMM d, yyyy");
    }
    
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Program Calendar</h4>
      
      <div className="flex flex-col gap-2 mb-4">
        {isLoadingEvents ? (
          <div className="animate-pulse w-full h-8 bg-gray-200 rounded"></div>
        ) : events && events.length > 0 ? (
          events.map(event => (
            <Badge 
              key={event.id} 
              variant="outline" 
              className="justify-start" 
              style={{ 
                backgroundColor: `${event.color}20`, // Adding transparency
                color: event.color,
                borderColor: event.color
              }}
            >
              {event.title} ({formatDateRange(event.start_date, event.end_date)})
            </Badge>
          ))
        ) : (
          <div className="text-sm text-gray-500">No events scheduled</div>
        )}
      </div>

      <Calendar 
        mode="single"
        defaultMonth={new Date(2025, 4)} // May 2025
        onMonthChange={handleMonthChange}
        disabled={(date) => 
          date < new Date(2025, 4, 1) || date > new Date(2025, 4, 26)
        }
        modifiersStyles={{
          selected: { backgroundColor: 'var(--primary)' },
          today: { backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }
        }}
        selected={onSelectDate ? undefined : undefined}
        onSelect={onSelectDate}
        components={{
          DayContent: CustomDayContent
        }}
        className="pointer-events-auto"
      />
    </div>
  );
};
