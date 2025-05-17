
import React, { useState } from "react";
import { Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EventCalendar } from "@/components/calendar/EventCalendar";

interface Event {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
}

interface MobileCalendarDialogProps {
  events: Event[];
  onSelectDate: (date: Date | undefined, shouldSwitchTab?: boolean) => void;
  selectedDate?: Date;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const MobileCalendarDialog = ({ 
  events = [], 
  onSelectDate, 
  selectedDate,
  onRefresh,
  isRefreshing = false
}: MobileCalendarDialogProps) => {
  const [open, setOpen] = React.useState(false);
  
  const handleDateSelect = (date: Date | undefined, shouldSwitchTab?: boolean) => {
    // Always pass true as the second parameter to indicate we want to switch to date filter mode
    onSelectDate(date, true);
    if (date) {
      // Close dialog after date selection
      setTimeout(() => setOpen(false), 100);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className={`h-10 w-10 ${selectedDate ? 'border-primary text-primary' : ''}`}
        >
          <Calendar className="h-4 w-4" />
          <span className="sr-only">Open calendar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Event Calendar</DialogTitle>
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh</span>
            </Button>
          )}
        </DialogHeader>
        <div className="mt-2">
          <EventCalendar 
            onSelectDate={handleDateSelect}
            events={events}
            className="min-h-[320px] p-0 border-0 shadow-none"
            hideTitle={true}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            selectedDate={selectedDate}
          />
          
          {selectedDate && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Filtering on: {selectedDate.toLocaleDateString()}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    handleDateSelect(undefined, true);
                  }}
                  className="h-7 text-xs"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
