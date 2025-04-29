import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Share, LogIn, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EventRSVPButton } from "@/components/events/EventRSVPButton";
import { EventDateBadge } from "@/components/events/EventDateBadge";
import { EventDetailsCard } from "@/components/events/EventDetailsCard";
import { Card } from "@/components/ui/card";
import { usePaidInvoiceStatus } from "@/hooks/usePaidInvoiceStatus";

const EventPage = () => {
  const { eventId } = useParams();
  const { user, authenticated } = usePrivy();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [isRsvped, setIsRsvped] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();
  
  const { hasPaidInvoice, isLoading: isPaidInvoiceLoading, isAdmin } = usePaidInvoiceStatus(
    user?.id
  );
  
  console.log("🎪 EventPage - Auth status:", { authenticated, userId: user?.id });
  console.log("🎪 EventPage - Invoice status:", { hasPaidInvoice, isPaidInvoiceLoading, isAdmin });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("id, privy_id")
            .eq("privy_id", user.id)
            .maybeSingle();

          if (error) throw error;
          if (data) setUserProfile(data);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    };

    if (authenticated && user) {
      fetchUserProfile();
    }
  }, [user, authenticated]);

  useEffect(() => {
    const fetchEvent = async () => {
      // Only fetch event data if user has access (paid invoice or admin)
      if (!hasPaidInvoice && !isAdmin && !isPaidInvoiceLoading) {
        console.log("🚫 Skipping event fetch - No access");
        setLoading(false);
        return;
      }
      
      try {
        console.log("🔍 Fetching event data with ID:", eventId);
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
        console.log("✅ Event data fetched successfully:", data);
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
        
        if (userProfile && data) {
          const hasRsvped = data.some(rsvp => rsvp.profile_id === userProfile.id);
          setIsRsvped(hasRsvped);
        }
        
        const profileData = data?.map(rsvp => rsvp.profiles) || [];
        setRsvps(profileData);
      } catch (error) {
        console.error("Error fetching RSVPs:", error);
      }
    };

    // Only proceed if we have determined access status
    if (eventId && !isPaidInvoiceLoading) {
      fetchEvent();
      if (userProfile) {
        fetchRsvps();
      }
    }
  }, [eventId, userProfile, hasPaidInvoice, isAdmin, isPaidInvoiceLoading]);

  const handleShare = async () => {
    try {
      const eventUrl = window.location.href;
      
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: eventUrl,
        });
      } else {
        await navigator.clipboard.writeText(eventUrl);
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
    if (eventId && userProfile) {
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

  const isEventInPast = event ? new Date(event.end_date) < new Date() : false;

  if (isPaidInvoiceLoading) {
    return (
      <div className="container py-12">
        <div className="animate-pulse">Checking access status...</div>
      </div>
    );
  }

  if (loading && (hasPaidInvoice || isAdmin)) {
    return (
      <div className="container py-12">
        <div className="animate-pulse">Loading event...</div>
      </div>
    );
  }

  if (!event && !loading && (hasPaidInvoice || isAdmin)) {
    return <Navigate to="/404" replace />;
  }

  const location = event?.locations ? 
    `${event.locations.name}${event.locations.building ? ` (${event.locations.building}${event.locations.floor ? `, Floor ${event.locations.floor}` : ''})` : ''}` :
    event?.location_text;

  const metaDescription = event.description 
    ? (event.description.length > 160 ? `${event.description.substring(0, 157)}...` : event.description)
    : `Event at ${location} on ${new Date(event.start_date).toLocaleDateString()}`;

  return (
    <>
      <Helmet>
        <title>{event.title} | Zuitzerland</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={`${event.title} | Zuitzerland`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="event" />
        <meta property="og:url" content={window.location.href} />
        <meta property="event:start_time" content={new Date(event.start_date).toISOString()} />
        <meta property="event:end_time" content={new Date(event.end_date).toISOString()} />
        {location && <meta property="event:location" content={location} />}
      </Helmet>

      {!authenticated ? (
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <Card className="p-6 text-center space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Sign in to view event details</h2>
            <p className="text-muted-foreground">
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
      ) : !hasPaidInvoice && !isPaidInvoiceLoading && !isAdmin ? (
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <Card className="p-6 text-center space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Access Restricted</h2>
            <p className="text-muted-foreground">
              You must have a paid invoice to view event details. Once your payment is confirmed, you'll have full access to all events.
            </p>
            <Button asChild>
              <a href="/invoices">
                <FileText className="mr-2 h-4 w-4" />
                View Invoices
              </a>
            </Button>
          </Card>
        </div>
      ) : (
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="md:hidden">
                <EventDateBadge date={new Date(event.start_date)} />
              </div>
              
              <div className="flex-1 space-y-4">
                <p className="text-muted-foreground">
                  {event.profiles?.username && `Hosted by ${event.profiles.username}`}
                </p>
                <h1 className="text-3xl font-bold text-foreground">{event.title}</h1>
                
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="hidden md:block">
                    <EventDateBadge date={new Date(event.start_date)} />
                  </div>
                  
                  <div className="flex gap-3">
                    {userProfile && !isEventInPast && (
                      <EventRSVPButton 
                        eventId={eventId || ''} 
                        profileId={userProfile.id}
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
                <Card className="border shadow-sm">
                  <div className="p-6">
                    <div className="prose max-w-none">
                      <p className="text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                </Card>

                {(event.speakers || event.av_needs) && (
                  <Card className="border shadow-sm">
                    <div className="p-6 space-y-6">
                      {event.speakers && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2 text-foreground">Speakers</h3>
                          <p className="text-muted-foreground">{event.speakers}</p>
                        </div>
                      )}
                      {event.av_needs && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2 text-foreground">AV Requirements</h3>
                          <p className="text-muted-foreground">{event.av_needs}</p>
                        </div>
                      )}
                    </div>
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
      )}
    </>
  );
};

export default EventPage;
