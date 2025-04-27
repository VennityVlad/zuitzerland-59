import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, MapPin, LogIn, Users } from "lucide-react";
import { formatTimeRange } from "@/lib/date-utils";
import { EventRSVPAvatars } from "@/components/events/EventRSVPAvatars";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { DateDisplay } from "@/components/events/DateDisplay";
import { EventHeader } from "@/components/events/EventHeader";
import { Separator } from "@/components/ui/separator";

const EventPage = () => {
  const { eventId } = useParams();
  const { user, authenticated } = usePrivy();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [isRsvped, setIsRsvped] = useState(false);
  const [metaDescription, setMetaDescription] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data, error } = await supabase
          .from("events")
          .select(`
            *,
            profiles:profiles!events_created_by_fkey(username),
            locations:location_id (name, building, floor),
            event_tags:event_tag_relations (
              tags:event_tags (id, name)
            )
          `)
          .eq("id", eventId)
          .single();

        if (error) throw error;
        setEvent(data);
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRsvps = async () => {
      try {
        const { data, error } = await supabase
          .from("event_rsvps")
          .select(`
            profile_id,
            profiles:profiles(id, username, avatar_url)
          `)
          .eq("event_id", eventId);

        if (error) throw error;
        
        // Check if current user has RSVPed
        if (user && data) {
          const hasRsvped = data.some(rsvp => rsvp.profile_id === user.id);
          setIsRsvped(hasRsvped);
        }
        
        // Extract profile data for display
        const profileData = data?.map(rsvp => rsvp.profiles) || [];
        setRsvps(profileData);
      } catch (error) {
        console.error("Error fetching RSVPs:", error);
      }
    };

    if (eventId) {
      fetchEvent();
      fetchRsvps();
    }
  }, [eventId, user]);

  const handleRsvpChange = (newStatus: boolean) => {
    setIsRsvped(newStatus);
    // Refresh RSVPs after change
    if (eventId) {
      supabase
        .from("event_rsvps")
        .select(`
          profile_id,
          profiles:profiles(id, username, avatar_url)
        `)
        .eq("event_id", eventId)
        .then(({ data, error }) => {
          if (!error && data) {
            const profileData = data.map(rsvp => rsvp.profiles);
            setRsvps(profileData);
          }
        });
    }
  };

  const location = event?.locations ? 
    `${event.locations.name}${event.locations.building ? ` (${event.locations.building}${event.locations.floor ? `, Floor ${event.locations.floor}` : ''})` : ''}` :
    event?.location_text;

  useEffect(() => {
    if (event) {
      const formattedDate = format(new Date(event.start_date), "MMMM d, yyyy");
      setMetaDescription(`${event.title} - ${formattedDate} ${location ? `at ${location}` : ''}`);
    }
  }, [event, location]);

  if (loading) {
    return (
      <div className="container py-12">
        <div className="animate-pulse">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return <Navigate to="/404" replace />;
  }

  let timeRange = "";
  try {
    timeRange = formatTimeRange(event.start_date, event.end_date, event.is_all_day, event.timezone);
  } catch (error) {
    console.error("Error formatting time range:", error);
    timeRange = "Time information unavailable";
  }

  return (
    <>
      <Helmet>
        <title>{event.title} | Zuitzerland</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={`${event.title} | Zuitzerland`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="event" />
        <meta property="og:url" content={window.location.href} />
      </Helmet>

      {!authenticated ? (
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <Card className="p-6 text-center space-y-4">
            <h2 className="text-xl font-semibold">Sign in to view event details</h2>
            <p className="text-gray-600">
              This event is only visible to authenticated users. Please sign in to view the complete details.
            </p>
            <Button asChild>
              <a href="/signin">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </a>
            </Button>
          </Card>
        </div>
      ) : (
        <div className="min-h-screen bg-[#1A1F2C]">
          <div className="container max-w-4xl mx-auto px-4 py-8">
            <EventHeader
              title={event.title}
              location={location || ''}
              isAuthenticated={authenticated}
              userId={user?.id}
              eventId={eventId || ''}
              isRsvped={isRsvped}
              onRsvpChange={handleRsvpChange}
            />

            <div className="mt-8 space-y-6">
              <Card className="bg-white/10 border-0 backdrop-blur-sm text-white p-6">
                <div className="grid gap-6 md:grid-cols-[auto,1fr]">
                  <DateDisplay date={event.start_date} />
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 mt-1 text-gray-300" />
                      <div>
                        <p className="font-medium">{timeRange}</p>
                      </div>
                    </div>

                    {location && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 mt-1 text-gray-300" />
                        <div>
                          <p className="font-medium">{location}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 mt-1 text-gray-300" />
                      <div>
                        <p className="font-medium mb-2">Attendees</p>
                        <EventRSVPAvatars profiles={rsvps} />
                      </div>
                    </div>
                  </div>
                </div>

                {event.description && (
                  <>
                    <Separator className="my-6" />
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">About Event</h3>
                      <div className="prose prose-invert max-w-none">
                        <p>{event.description}</p>
                      </div>
                    </div>
                  </>
                )}

                {(event.speakers || event.av_needs) && (
                  <>
                    <Separator className="my-6" />
                    <div className="space-y-4">
                      {event.speakers && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Speakers</h3>
                          <p>{event.speakers}</p>
                        </div>
                      )}
                      {event.av_needs && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">AV Requirements</h3>
                          <p>{event.av_needs}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EventPage;
