
import React, { useState } from "react";
import { format, addMonths, subMonths, setMonth, setYear } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Event {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
}

interface EventCalendarProps {
  onSelectDate?: (date: Date | undefined) => void;
  className?: string;
  events?: Event[];
}

export const EventCalendar = ({ onSelectDate, className, events = [] }: EventCalendarProps) => {
  // Initialize with May 2025
  const initialDate = new Date(2025, 4, 1); // Month is 0-based, so 4 is May
  const [currentMonth, setCurrentMonth] = useState<Date>(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const start = new Date(event.start_date);
      const end = new Date(event.end_date);
      const currentDate = new Date(date);
      
      // Reset time part for accurate date comparison
      currentDate.setHours(0, 0, 0, 0);
      const startDate = new Date(start).setHours(0, 0, 0, 0);
      const endDate = new Date(end).setHours(0, 0, 0, 0);
      
      return currentDate >= startDate && currentDate <= endDate;
    });
  };

  const generateCalendarDays = () => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    let days: (Date | null)[] = [];
    
    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    let firstDayOfWeek = firstDay.getDay();
    // Adjust for Monday as first day of week
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // Add null for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    }
    
    // Add null for remaining days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days = 42
    for (let i = 0; i < remainingDays; i++) {
      days.push(null);
    }
    
    return days;
  };

  const handleDateSelect = (date: Date) => {
    if (date && selectedDate && 
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()) {
      setSelectedDate(undefined);
      if (onSelectDate) onSelectDate(undefined);
    } else {
      setSelectedDate(date);
      if (onSelectDate) onSelectDate(date);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const calendarDays = generateCalendarDays();

  return (
    <Card className={cn("bg-white p-4", className)}>
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Event Calendar</h4>
      
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handlePreviousMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h5 className="font-medium">{format(currentMonth, "MMMM yyyy")}</h5>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleNextMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div 
            key={day} 
            className="text-center text-sm font-medium text-gray-500 p-2"
          >
            {day}
          </div>
        ))}
        
        {calendarDays.map((date, index) => {
          if (!date) {
            return (
              <div 
                key={`empty-${index}`} 
                className="aspect-square p-2 text-center text-gray-400"
              />
            );
          }

          const dateEvents = getEventsForDate(date);
          const hasEvents = dateEvents.length > 0;
          
          const isSelected = selectedDate && 
            date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();

          const isToday = 
            date.getDate() === new Date().getDate() &&
            date.getMonth() === new Date().getMonth() &&
            date.getFullYear() === new Date().getFullYear();

          return (
            <TooltipProvider key={date.toISOString()}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleDateSelect(date)}
                    className={cn(
                      "aspect-square p-2 text-sm relative hover:bg-gray-100 rounded-md transition-colors w-full",
                      isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                      isToday && !isSelected && "bg-accent text-accent-foreground",
                    )}
                  >
                    <span>{date.getDate()}</span>
                    {hasEvents && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="h-1 w-1 bg-blue-500 rounded-full" />
                      </div>
                    )}
                  </button>
                </TooltipTrigger>
                {hasEvents && (
                  <TooltipContent>
                    <div className="space-y-1">
                      {dateEvents.map(event => (
                        <div key={event.id} className="text-sm">
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 truncate">
              Filtering on: {format(selectedDate, "MMMM d, yyyy")}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleDateSelect(selectedDate)}
              className="h-7 text-xs"
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
