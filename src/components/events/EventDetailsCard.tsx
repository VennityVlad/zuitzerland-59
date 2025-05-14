
import { Calendar, Clock, MapPin, Users, UserPlus, Mic, MessageSquare } from "lucide-react";
import { formatTimeRange } from "@/lib/date-utils";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { EventRSVPAvatars } from "./EventRSVPAvatars";
import { AddCoHostPopover } from "./AddCoHostPopover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EventDetailsCardProps {
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  timezone: string;
  location: string;
  totalRsvps: number;
  attendees: any[];
  eventId?: string;
  profileId?: string;
  canEdit?: boolean;
  onCoHostAdded?: () => void;
  hostUsername?: string;
  coHosts?: {username: string}[];
  speakers?: string;
  commentCount?: number;
  onCommentClick?: () => void;
}

export const EventDetailsCard = ({
  startDate,
  endDate,
  isAllDay,
  timezone,
  location,
  totalRsvps: initialTotalRsvps,
  attendees: initialAttendees,
  eventId,
  profileId,
  canEdit = false,
  onCoHostAdded,
  hostUsername,
  coHosts = [],
  speakers,
  commentCount = 0,
  onCommentClick,
}: EventDetailsCardProps) => {
  const [attendees, setAttendees] = useState(initialAttendees);
  const [totalRsvps, setTotalRsvps] = useState(initialTotalRsvps);
  const [isUserRsvped, setIsUserRsvped] = useState(false);

  // Check if the current user is already RSVPed
  useEffect(() => {
    if (profileId && eventId) {
      const isRsvped = initialAttendees.some(attendee => attendee.id === profileId);
      setIsUserRsvped(isRsvped);
    }
  }, [profileId, eventId, initialAttendees]);

  // Update local state when props change
  useEffect(() => {
    setAttendees(initialAttendees);
    setTotalRsvps(initialTotalRsvps);
  }, [initialAttendees, initialTotalRsvps]);

  // Set up real-time subscription for RSVP changes
  useEffect(() => {
    if (!eventId) return;
    
    // Subscribe to RSVP changes for this event
    const channel = supabase
      .channel(`event_rsvps_${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',  // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'event_rsvps',
          filter: `event_id=eq.${eventId}`
        },
        () => {
          // When any RSVP change happens, refresh the attendees data
          refreshAttendees();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  // Function to refresh attendees data
  const refreshAttendees = async () => {
    if (!eventId) return;
    
    try {
      const { data } = await supabase
        .from("event_rsvps")
        .select("profiles:profiles(id, username, avatar_url, privacy_settings)")
        .eq("event_id", eventId);
      
      if (data) {
        const newAttendees = data.map(rsvp => rsvp.profiles);
        setAttendees(newAttendees);
        setTotalRsvps(newAttendees.length);
        
        // Update the user's RSVP status
        if (profileId) {
          const isRsvped = newAttendees.some(attendee => attendee.id === profileId);
          setIsUserRsvped(isRsvped);
        }
      }
    } catch (error) {
      console.error("Error refreshing attendees:", error);
    }
  };

  // Handle RSVP status change
  const handleRsvpChange = async (newStatus: boolean) => {
    setIsUserRsvped(newStatus);
    await refreshAttendees();
  };

  // Create a formatted hosts string
  const formatHosts = () => {
    if (!hostUsername) return "";
    
    const hosts = [hostUsername];
    if (coHosts && coHosts.length > 0) {
      coHosts.forEach(host => {
        if (host.username) {
          hosts.push(host.username);
        }
      });
    }
    
    return hosts.join(", ");
  };
  
  const hostsString = formatHosts();

  return (
    <Card className="border shadow-sm">
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 mt-1 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">{format(startDate, "EEEE, MMMM d")}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 mt-1 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">
                {formatTimeRange(startDate, endDate, isAllDay, timezone)}
              </p>
            </div>
          </div>

          {location && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 mt-1 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">{location}</p>
              </div>
            </div>
          )}

          {/* Speakers section */}
          {speakers && (
            <div className="flex items-start gap-3">
              <Mic className="h-5 w-5 mt-1 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">{speakers}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 mt-1 text-muted-foreground" />
            <div className="space-y-2">
              <p className="font-medium text-foreground">{totalRsvps} attending</p>
              <EventRSVPAvatars profiles={attendees} />
              
              {/* Add RSVP button if user is logged in and has a profileId */}
              {profileId && eventId && (
                <div className="mt-3">
                  <Button 
                    onClick={onCommentClick}
                    variant="outline"
                    size="sm"
                    className="mt-2 flex items-center"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Comments
                    {commentCount > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {commentCount}
                      </Badge>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Host information */}
          {hostsString && (
            <div className="flex items-start gap-3">
              <UserPlus className="h-5 w-5 mt-1 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-muted-foreground">Hosted by {hostsString}</p>
                
                {/* Add Co-Host Button - Only visible if user can edit */}
                {canEdit && eventId && profileId && (
                  <div className="mt-2">
                    <AddCoHostPopover
                      eventId={eventId}
                      profileId={profileId}
                      onSuccess={onCoHostAdded}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
