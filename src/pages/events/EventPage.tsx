import { useEffect, useState } from "react";
import { useParams, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Share, LogIn, FileText, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EventRSVPButton } from "@/components/events/EventRSVPButton";
import { EventDateBadge } from "@/components/events/EventDateBadge";
import { EventDetailsCard } from "@/components/events/EventDetailsCard";
import { CalendarOptionsPopover } from "@/components/events/CalendarOptionsPopover";
import { Card } from "@/components/ui/card";
import { usePaidInvoiceStatus } from "@/hooks/usePaidInvoiceStatus";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

const EventPage = () => {
  const { eventId } = useParams();
  const { user, authenticated } = usePrivy();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [coHosts, setCoHosts] = useState<any[]>([]);
  const [isRsvped, setIsRsvped] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [addCoHostOpen, setAddCoHostOpen] = useState(false);
  const { toast } = useToast();
  const locationData = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const { hasPaidInvoice, isLoading: isPaidInvoiceLoading, isAdmin } = usePaidInvoiceStatus(
    user?.id
  );
  
  console.log("🎪 EventPage - Auth status:", { authenticated, userId: user?.id });
  console.log("🎪 EventPage - Invoice status:", { hasPaidInvoice, isPaidInvoiceLoading, isAdmin });
  console.log("🎪 EventPage - Current path:", locationData.pathname);

  // Handle unauthenticated users by redirecting to sign in with return path
  useEffect(() => {
    if (authenticated === false && !isPaidInvoiceLoading) {
      // Redirect to signin with the current path as a redirect parameter
      const currentPath = locationData.pathname;
      navigate(`/signin?redirect=${encodeURIComponent(currentPath)}`, { replace: true });
    }
  }, [authenticated, isPaidInvoiceLoading, locationData.pathname, navigate]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("id, privy_id, role")  // Added role to the selection
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
            profiles:profiles(id, username, avatar_url, privacy_settings)
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

    const fetchCoHosts = async () => {
      if (!eventId) return;
      
      try {
        const { data, error } = await supabase
          .from("event_co_hosts")
          .select(`
            profile_id,
            profiles:profiles(id, username, avatar_url)
          `)
          .eq("event_id", eventId);

        if (error) throw error;
        
        if (data) {
          setCoHosts(data.map(item => item.profiles));
        }
      } catch (error) {
        console.error("Error fetching co-hosts:", error);
      }
    };

    // Only proceed if we have determined access status
    if (eventId && !isPaidInvoiceLoading) {
      fetchEvent();
      if (userProfile) {
        fetchRsvps();
        fetchCoHosts();
      }
    }
  }, [eventId, userProfile, hasPaidInvoice, isAdmin, isPaidInvoiceLoading]);

  // Check if the current user is the creator of the event
  const isEventCreator = event && userProfile && event.created_by === userProfile.id;
  
  // Check if the current user is a co-host
  const isCoHost = userProfile && coHosts.some(host => host.id === userProfile.id);
  
  // Generate the appropriate Meerkat URL based on user role
  const getMeerkatUrl = () => {
    if (!event?.meerkat_url) return '';
    
    // If the user is the event creator, show the original meerkat URL (for hosts)
    // Otherwise, add "/remote" to the URL for attendees
    return isEventCreator ? event.meerkat_url : `${event.meerkat_url}/remote`;
  };

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

  const handleCoHostAdded = () => {
    // Refresh co-hosts list
    if (eventId) {
      supabase
        .from("event_co_hosts")
        .select(`
          profile_id,
          profiles:profiles(id, username, avatar_url)
        `)
        .eq("event_id", eventId)
        .then(({ data, error }) => {
          if (!error && data) {
            setCoHosts(data.map(item => item.profiles));
          }
        });
    }
  };

  const isEventInPast = event ? new Date(event.end_date) < new Date() : false;

  if (isPaidInvoiceLoading || loading) {
    return (
      <div className="container py-12 max-w-4xl mx-auto">
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <div className="flex justify-between">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-32 w-full" />
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-52 w-full" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!event && !loading && (hasPaidInvoice || isAdmin)) {
    return <Navigate to="/404" replace />;
  }

  const eventLocation = event?.locations ? 
    `${event.locations.name}${event.locations.building ? ` (${event.locations.building}${event.locations.floor ? `, Floor ${event.locations.floor}` : ''})` : ''}` :
    event?.location_text;

  const metaDescription = event?.description 
    ? (event.description.length > 160 ? `${event.description.substring(0, 157)}...` : event.description)
    : `Event at ${eventLocation} on ${new Date(event?.start_date).toLocaleDateString()}`;

  return (
    <>
      <Helmet>
        <title>{event?.title || "Event"} | Zuitzerland</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={`${event?.title} | Zuitzerland`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="event" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:image" content="/lovable-uploads/3ffe57c2-320a-4cca-86fd-dab25c9ecd8f.png" />
        {event?.start_date && <meta property="event:start_time" content={new Date(event.start_date).toISOString()} />}
        {event?.end_date && <meta property="event:end_time" content={new Date(event.end_date).toISOString()} />}
        {eventLocation && <meta property="event:location" content={eventLocation} />}
      </Helmet>

      {!authenticated ? (
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <Card className="p-6 text-center space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Sign in to view event details</h2>
            <p className="text-muted-foreground">
              This event is only visible to authenticated users. Please sign in to view the complete details.
            </p>
            <Button onClick={() => {
              // Pass the current URL as a redirect parameter
              navigate(`/signin?redirect=${encodeURIComponent(locationData.pathname)}`);
            }}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
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
                <EventDateBadge date={new Date(event?.start_date)} />
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">
                    {event?.profiles?.username && (
                      <>
                        Hosted by {event.profiles.username}
                        {coHosts.length > 0 && (
                          <span className="text-gray-500">
                            {" "}• Co-hosts: {coHosts.map(host => host.username).join(', ')}
                          </span>
                        )}
                      </>
                    )}
                  </p>
                  {(isEventCreator || isAdmin) && !isEventInPast && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAddCoHostOpen(true)}
                      className="text-xs"
                    >
                      Add Co-host
                    </Button>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-foreground">{event?.title}</h1>
                
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="hidden md:block">
                    <EventDateBadge date={new Date(event?.start_date)} />
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
                    {event && (
                      <CalendarOptionsPopover event={event} isMobile={isMobile} />
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
                      <p className="text-muted-foreground">{event?.description}</p>
                    </div>
                  </div>
                </Card>

                {/* Meerkat Q&A Section with conditional URL */}
                {event?.meerkat_enabled && event?.meerkat_url && (
                  <Card className="border shadow-sm border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                        <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                          Interactive Q&A Available
                        </h3>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
                        This event has an interactive Q&A session. Join the conversation, ask questions, and participate in polls.
                      </p>
                      <Button 
                        variant="outline" 
                        className="bg-white dark:bg-blue-900 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300"
                        asChild
                      >
                        <a href={getMeerkatUrl()} target="_blank" rel="noopener noreferrer">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          {isEventCreator ? "Open Q&A Host Session" : "Open Q&A Session"}
                        </a>
                      </Button>
                    </div>
                  </Card>
                )}

                {(event?.speakers || event?.av_needs) && (
                  <Card className="border shadow-sm">
                    <div className="p-6 space-y-6">
                      {event?.speakers && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2 text-foreground">Speakers</h3>
                          <p className="text-muted-foreground">{event.speakers}</p>
                        </div>
                      )}
                      {event?.av_needs && (
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
                  startDate={event?.start_date ? new Date(event.start_date) : new Date()}
                  endDate={event?.end_date ? new Date(event.end_date) : new Date()}
                  isAllDay={event?.is_all_day ?? false}
                  timezone={event?.timezone ?? "Europe/Zurich"}
                  location={eventLocation ?? ""}
                  totalRsvps={rsvps.length}
                  attendees={rsvps}
                  coHosts={coHosts}
                />
              </div>
            </div>
          </div>

          {/* Add Co-host Dialog */}
          <AddCoHostDialog
            open={addCoHostOpen}
            onOpenChange={setAddCoHostOpen}
            eventId={eventId || ''}
            createdBy={userProfile?.id || ''}
            onCoHostAdded={handleCoHostAdded}
          />
        </div>
      )}
    </>
  );
};

export default EventPage;
