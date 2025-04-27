import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";
import { PageTitle } from "@/components/PageTitle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CalendarDays, LogIn, Share, MapPin, User, CalendarPlus } from "lucide-react";
import { formatTimeRange } from "@/lib/date-utils";
import { useToast } from "@/hooks/use-toast";
import { EventRSVPButton } from "@/components/events/EventRSVPButton";
import { EventRSVPAvatars } from "@/components/events/EventRSVPAvatars";

const EventPage = () => {
  const { eventId } = useParams();
  const { user, authenticated } = usePrivy();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

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

  const location = event.locations ? 
    `${event.locations.name}${event.locations.building ? ` (${event.locations.building}${event.locations.floor ? `, Floor ${event.locations.floor}` : ''})` : ''}` :
    event.location_text;

  const metaDescription = `${event.title} - ${formatTimeRange(new Date(event.start_date), new Date(event.end_date), event.is_all_day, event.timezone)} ${location ? `at ${location}` : ''}`;

  const handleShare = async () => {
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: metaDescription,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied",
          description: "The event link has been copied to your clipboard.",
        });
      } catch (err) {
        console.error('Error copying to clipboard:', err);
        toast({
          title: "Error",
          description: "Failed to copy the link. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

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
        <div className="container py-6 max-w-4xl mx-auto px-4">
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
        <div className="min-h-screen bg-gray-50">
          {event.image_url && (
            <div className="w-full h-64 md:h-96 relative overflow-hidden">
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
            </div>
          )}
          
          <div className="container max-w-4xl mx-auto px-4 py-8">
            <div className="space-y-8">
              <div className={`space-y-4 ${event.image_url ? '-mt-32 relative z-10' : ''}`}>
                <div className="flex flex-wrap items-start gap-4">
                  <Badge className="bg-white text-gray-700">
                    Featured in {event.location_text?.split(',')[1]?.trim() || 'Zurich'}
                  </Badge>
                </div>
                
                <h1 className={`text-4xl md:text-5xl font-bold ${event.image_url ? 'text-white' : 'text-gray-900'}`}>
                  {event.title}
                </h1>

                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="flex items-center gap-2">
                    <CalendarDays className={`h-5 w-5 ${event.image_url ? 'text-white' : 'text-gray-600'}`} />
                    <span className={`${event.image_url ? 'text-white' : 'text-gray-700'}`}>
                      {formatTimeRange(new Date(event.start_date), new Date(event.end_date), event.is_all_day, event.timezone)}
                    </span>
                  </div>
                  {location && (
                    <div className="flex items-center gap-2">
                      <MapPin className={`h-5 w-5 ${event.image_url ? 'text-white' : 'text-gray-600'}`} />
                      <span className={`${event.image_url ? 'text-white' : 'text-gray-700'}`}>
                        {location}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">About Event</h2>
                    <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
                    
                    {event.speakers && (
                      <div className="mt-6">
                        <h3 className="font-semibold mb-2">Featuring</h3>
                        <p className="text-gray-600">{event.speakers}</p>
                      </div>
                    )}
                    
                    {event.location_text && (
                      <div className="mt-6">
                        <h3 className="font-semibold mb-2">Location Details</h3>
                        <p className="text-gray-600">{event.location_text}</p>
                      </div>
                    )}
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-gray-600" />
                      <span className="text-sm font-medium">
                        Hosted by {event.profiles?.username || "Anonymous"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {!!profileId && (
                        <EventRSVPButton
                          eventId={event.id}
                          profileId={profileId}
                          initialRSVP={userRSVPEventIds.includes(event.id)}
                          onChange={refetchRSVPs}
                        />
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addToCalendar(event)}
                        className="w-full"
                      >
                        <CalendarPlus className="h-4 w-4 mr-2" />
                        Add to Calendar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShare}
                        className="w-full"
                      >
                        <Share className="h-4 w-4 mr-2" />
                        Share Event
                      </Button>
                    </div>

                    {rsvpMap[event.id] && rsvpMap[event.id].length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600 mb-2 block">
                          {rsvpMap[event.id].length} people going
                        </span>
                        <EventRSVPAvatars profiles={rsvpMap[event.id]} />
                      </div>
                    )}
                  </Card>

                  {event.event_tags && event.event_tags.length > 0 && (
                    <Card className="p-6">
                      <h3 className="text-sm font-medium mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {event.event_tags.map(tag => (
                          <Badge key={tag.tags.id} variant="secondary">
                            {tag.tags.name}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  )}
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
