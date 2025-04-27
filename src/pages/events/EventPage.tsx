
import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";
import { PageTitle } from "@/components/PageTitle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Link, LogIn, Share, Users } from "lucide-react";
import { formatTimeRange } from "@/lib/date-utils";
import { useToast } from "@/hooks/use-toast";
import { EventRSVPAvatars } from "@/components/events/EventRSVPAvatars";
import { EventRSVPButton } from "@/components/events/EventRSVPButton";
import { format } from "date-fns";

const EventPage = () => {
  const { eventId } = useParams();
  const { user, authenticated } = usePrivy();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [isRsvped, setIsRsvped] = useState(false);
  const { toast } = useToast();

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

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text: `Check out this event: ${event.title}`,
          url: window.location.href,
        });
      } else {
        // Fallback for browsers that don't support the Web Share API
        await navigator.clipboard.writeText(window.location.href);
        toast({ 
          title: "Link copied!",
          description: "Event link copied to clipboard" 
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

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

  // Safely format the date to prevent crashes with invalid dates
  const safeFormatDate = (date: string | Date | null | undefined) => {
    if (!date) return "";
    try {
      return format(new Date(date), "EEEE, MMMM d");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Safely format time range to prevent crashes with invalid dates
  const safeFormatTimeRange = (start: string | Date | null | undefined, end: string | Date | null | undefined, isAllDay: boolean, timezone: string) => {
    if (!start || !end) return "";
    try {
      return formatTimeRange(new Date(start), new Date(end), isAllDay, timezone);
    } catch (error) {
      console.error("Error formatting time range:", error);
      return "";
    }
  };

  const location = event?.locations ? 
    `${event.locations.name}${event.locations.building ? ` (${event.locations.building}${event.locations.floor ? `, Floor ${event.locations.floor}` : ''})` : ''}` :
    event?.location_text;

  const metaDescription = event ? 
    `${event.title} - ${safeFormatTimeRange(event.start_date, event.end_date, event.is_all_day, event.timezone)} ${location ? `at ${location}` : ''}` :
    "Event details";

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

  const dateStr = safeFormatDate(event.start_date);
  const timeRange = safeFormatTimeRange(event.start_date, event.end_date, event.is_all_day, event.timezone);

  return (
    <>
      <Helmet>
        <title>{event.title} | Zuitzerland</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={`${event.title} | Zuitzerland`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="event" />
        <meta property="og:url" content={window.location.href} />
        {event.image_url && <meta property="og:image" content={event.image_url} />}
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
        <div className="min-h-screen bg-[#1A1F2C] text-white">
          {event.image_url && (
            <div className="w-full h-64 md:h-96 relative overflow-hidden">
              <div 
                className="absolute inset-0 bg-center bg-cover"
                style={{ 
                  backgroundImage: `url(${event.image_url})`,
                  filter: 'blur(2px)',
                  transform: 'scale(1.1)'
                }}
              />
              <div className="absolute inset-0 bg-black/50" />
            </div>
          )}
          
          <div className="container max-w-4xl mx-auto px-4 py-8 -mt-32 relative z-10">
            <div className="space-y-8">
              <div>
                {dateStr && (
                  <div className="text-sm text-gray-300 flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4" />
                    {dateStr}
                  </div>
                )}
                <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
                {event.profiles?.username && (
                  <p className="text-gray-300">Hosted by {event.profiles.username}</p>
                )}
              </div>

              <Card className="bg-white/10 border-0 backdrop-blur-sm text-white p-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    {timeRange && (
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 mt-1 text-gray-300" />
                        <div>
                          <p className="font-medium">{timeRange}</p>
                        </div>
                      </div>
                    )}

                    {location && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 mt-1 text-gray-300" />
                        <div>
                          <p className="font-medium">{location}</p>
                        </div>
                      </div>
                    )}

                    {event.link && (
                      <div className="flex items-start gap-3">
                        <Link className="h-5 w-5 mt-1 text-gray-300" />
                        <a 
                          href={event.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Event Link
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 mt-1 text-gray-300" />
                      <div>
                        <EventRSVPAvatars profiles={rsvps} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-4">
                  <div className="prose prose-invert max-w-none">
                    <p>{event.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/10">
                  {user && (
                    <EventRSVPButton 
                      eventId={eventId || ''} 
                      profileId={user.id}
                      initialRSVP={isRsvped}
                      onChange={handleRsvpChange}
                    />
                  )}
                  <Button onClick={handleShare} variant="outline" size="sm">
                    <Share className="mr-2 h-4 w-4" />
                    Share Event
                  </Button>
                </div>
              </Card>

              {(event.speakers || event.av_needs) && (
                <Card className="bg-white/10 border-0 backdrop-blur-sm text-white p-6 space-y-4">
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
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EventPage;
