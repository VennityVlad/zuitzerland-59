
import React, { useState, useEffect, useCallback } from "react";
import { Search, X, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

interface Event {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  is_all_day: boolean;
  locations?: {
    name: string;
    building: string | null;
    floor: string | null;
  } | null;
  location_text: string | null;
  timezone: string;
}

interface EventSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: Event[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const EventSearchModal = ({ 
  open, 
  onOpenChange, 
  events,
  onRefresh,
  isRefreshing = false
}: EventSearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Event[]>([]);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  // Auto-focus the search input when the modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const searchInput = document.getElementById("event-search-input");
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    } else {
      // Clear search when modal closes
      setSearchQuery("");
    }
  }, [open]);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = events.filter(
      (event) => event.title.toLowerCase().includes(query)
    );
    setSearchResults(results);
  }, [searchQuery, events]);

  // Set up periodic refresh timer - refresh every minute
  useEffect(() => {
    let refreshTimer: NodeJS.Timeout | null = null;
    
    if (open && onRefresh) {
      refreshTimer = setInterval(() => {
        console.log("Auto-refreshing search events");
        setLastRefreshTime(new Date());
        onRefresh();
      }, 60000); // Every 1 minute
    }
    
    return () => {
      if (refreshTimer) clearInterval(refreshTimer);
    };
  }, [open, onRefresh]);

  const handleRefresh = () => {
    if (onRefresh) {
      setLastRefreshTime(new Date());
      onRefresh();
    }
  };

  const formatEventDate = (startDate: string, endDate: string, isAllDay: boolean) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isAllDay) {
      return `${format(start, "MMM d")} - ${format(end, "MMM d")}`;
    }
    
    return `${format(start, "MMM d, h:mm a")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle>Search Events</DialogTitle>
            {onRefresh && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="sr-only">Refresh events</span>
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="event-search-input"
            className="pl-9"
            placeholder="Search events by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="overflow-y-auto flex-1 pr-1">
          {searchResults.length > 0 ? (
            <div className="space-y-3">
              {searchResults.map((event) => (
                <Card 
                  key={event.id} 
                  className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    onOpenChange(false);
                  }}
                >
                  <Link to={`/events/${event.id}`} className="block">
                    <h3 className="font-medium text-lg">{event.title}</h3>
                    <div className="text-sm text-gray-500 mt-1">
                      {formatEventDate(event.start_date, event.end_date, event.is_all_day)}
                    </div>
                    {(event.locations || event.location_text) && (
                      <div className="text-sm text-gray-500 mt-1">
                        {event.locations 
                          ? `${event.locations.name}${event.locations.building ? ` (${event.locations.building})` : ''}`
                          : event.location_text}
                      </div>
                    )}
                  </Link>
                </Card>
              ))}
            </div>
          ) : searchQuery.length > 0 ? (
            <div className="text-center py-8 text-gray-500">
              No events found matching "{searchQuery}"
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Start typing to search for events
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
