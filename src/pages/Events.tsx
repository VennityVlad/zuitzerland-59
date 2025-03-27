
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarDays, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageTitle } from "@/components/PageTitle";
import { CreateEventSheet } from "@/components/events/CreateEventSheet";
import { Badge } from "@/components/ui/badge";

interface Event {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  color: string;
  is_all_day: boolean;
  created_by: string;
  created_at: string;
}

const Events = () => {
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const { user } = usePrivy();

  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: true });

      if (error) {
        console.error("Error fetching events:", error);
        throw error;
      }

      return data as Event[];
    }
  });

  const handleCreateEventSuccess = () => {
    refetch();
  };

  return (
    <div className="container py-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <PageTitle 
          title="Events" 
          description="View and manage upcoming events" 
          icon={<CalendarDays className="h-8 w-8" />} 
        />
        <Button onClick={() => setCreateEventOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Event
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-pulse">Loading events...</div>
        </div>
      ) : !events || events.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
          <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No events found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Get started by creating a new event.
          </p>
          <Button className="mt-4" onClick={() => setCreateEventOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Event
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-md shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => {
                const startDate = new Date(event.start_date);
                const endDate = new Date(event.end_date);
                const isMultiDay = startDate.toDateString() !== endDate.toDateString();
                const isPast = endDate < new Date();
                
                return (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3" 
                          style={{ backgroundColor: event.color }}
                        />
                        <div>
                          <div>{event.title}</div>
                          {event.description && (
                            <div className="text-sm text-gray-500 truncate max-w-[300px]">
                              {event.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isMultiDay ? (
                        <span>
                          {format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
                          {event.is_all_day && " (All day)"}
                        </span>
                      ) : (
                        <span>
                          {format(startDate, "MMM d, yyyy")}
                          {!event.is_all_day && (
                            <> {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}</>
                          )}
                          {event.is_all_day && " (All day)"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{event.location || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={isPast ? "outline" : "default"}>
                        {isPast ? "Past" : "Upcoming"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateEventSheet
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
        onSuccess={handleCreateEventSuccess}
        userId={user?.id || ""}
      />
    </div>
  );
};

export default Events;
