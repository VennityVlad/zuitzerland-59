
import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Share, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EventRSVPButton } from "@/components/events/EventRSVPButton";
import { EventDateBadge } from "@/components/events/EventDateBadge";
import { EventDetailsCard } from "@/components/events/EventDetailsCard";
import { Card } from "@/components/ui/card";

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
        
        if (user && data) {
          const hasRsvped = data.some(rsvp => rsvp.profile_id === user.id);
          setIsRsvped(hasRsvped);
        }
        
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

  const location = event?.locations ? 
    `${event.locations.name}${event.locations.building ? ` (${event.locations.building}${event.locations.floor ? `, Floor ${event.locations.floor}` : ''})` : ''}` :
    event?.location_text;

  const metaDescription = `${event.title} - ${event.description?.substring(0, 140)}...`;

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
        <div className="min-h-screen bg-white text-foreground">
          <div className="container max-w-4xl mx-auto px-4 py-8">
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="md:hidden">
                  <EventDateBadge date={new Date(event.start_date)} />
                </div>
                
                <div className="flex-1 space-y-4">
                  {event.profiles?.username && (
                    <p className="text-gray-500">Hosted by {event.profiles.username}</p>
                  )}
                  <h1 className="text-4xl font-bold text-hotel-navy">{event.title}</h1>
                  
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="hidden md:block">
                      <EventDateBadge date={new Date(event.start_date)} />
                    </div>
                    
                    <div className="flex gap-3">
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
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <Card className="bg-white border p-6">
                    <div className="prose max-w-none">
                      <p className="text-gray-700">{event.description}</p>
                    </div>
                  </Card>

                  {(event.speakers || event.av_needs) && (
                    <Card className="bg-white border p-6 space-y-4">
                      {event.speakers && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2 text-hotel-navy">Speakers</h3>
                          <p className="text-gray-700">{event.speakers}</p>
                        </div>
                      )}
                      {event.av_needs && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2 text-hotel-navy">AV Requirements</h3>
                          <p className="text-gray-700">{event.av_needs}</p>
                        </div>
                      )}
                    </Card>
                  )}
                </div>

                <div className="md:col-span-1">
                  <EventDetailsCard
                    startDate={new Date(event.start_date)}
                    endDate={new Date(event.end_date)}
                    isAllDay={event.is_all_day}
                    timezone={event.timezone}
                    location={location}
                    totalRsvps={rsvps.length}
                    attendees={rsvps}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EventPage;
