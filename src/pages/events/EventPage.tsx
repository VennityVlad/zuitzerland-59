import { useEffect, useState, useRef } from "react";
import { useParams, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Share, LogIn, FileText, MessageSquare, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EventRSVPButton } from "@/components/events/EventRSVPButton";
import { EventDateBadge } from "@/components/events/EventDateBadge";
import { EventDetailsCard } from "@/components/events/EventDetailsCard";
import { CalendarOptionsPopover } from "@/components/events/CalendarOptionsPopover";
import { Card } from "@/components/ui/card";
import { usePaidInvoiceStatus } from "@/hooks/usePaidInvoiceStatus";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { AddCoHostPopover } from "@/components/events/AddCoHostPopover";
import { CreateEventSheet } from "@/components/events/CreateEventSheet";
import { EventComments } from "@/components/events/EventComments";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getRsvpProfilesQuery } from "@/lib/utils";

const EventPage = () => {
  const { eventId } = useParams();
  const { user, authenticated } = usePrivy();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [isRsvped, setIsRsvped] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isCoHost, setIsCoHost] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any>(null);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [coHosts, setCoHosts] = useState<any[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const commentsRef = useRef<HTMLDivElement>(null);
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

  // Define the fetchRsvps function to fix the error
  const fetchRsvps = async () => {
    if (!eventId) return;
    
    try {
      const { data, error } = await getRsvpProfilesQuery(supabase, eventId);

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
    const checkCoHostStatus = async () => {
      if (userProfile?.id && eventId) {
        try {
          const { data, error } = await supabase
            .from("event_co_hosts")
            .select("id")
            .eq("event_id", eventId)
            .eq("profile_id", userProfile.id)
            .maybeSingle();
          
          if (error) throw error;
          setIsCoHost(!!data);
        } catch (error) {
          console.error("Error checking co-host status:", error);
          setIsCoHost(false);
        }
      }
    };
    
    checkCoHostStatus();
  }, [userProfile, eventId]);

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

  useEffect(() => {
    const fetchCoHosts = async () => {
      if (eventId) {
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
            const coHostsData = data.map(item => item.profiles || {});
            setCoHosts(coHostsData);
          }
        } catch (error) {
          console.error("Error fetching co-hosts:", error);
        }
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

  // Fetch comment count
  useEffect(() => {
    const fetchCommentCount = async () => {
      if (eventId) {
        try {
          const { count, error } = await supabase
            .from("event_comments")
            .select("id", { count: "exact", head: true })
            .eq("event_id", eventId);
            
          if (error) throw error;
          setCommentCount(count || 0);
        } catch (error) {
          console.error("Error fetching comment count:", error);
        }
      }
    };

    fetchCommentCount();
  }, [eventId]);

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
          // When any RSVP change happens, refresh the RSVPs
          fetchRsvps();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  // Listen for real-time comment updates to update the count
  useEffect(() => {
    if (!eventId) return;
    
    // Subscribe to comment changes to update the count
    const channel = supabase
      .channel('comment_count_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_comments',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          // Update the count based on the operation
          if (payload.eventType === 'INSERT') {
            setCommentCount(prevCount => prevCount + 1);
          } else if (payload.eventType === 'DELETE') {
            setCommentCount(prevCount => Math.max(0, prevCount - 1));
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  // Check if the current user is the creator of the event or a co-host
  const isEventCreator = event && userProfile && event.created_by === userProfile.id;
  const canEditEvent = isEventCreator || isCoHost || isAdmin;

  // Generate the appropriate Meerkat URL based on user role
  const getMeerkatUrl = () => {
    if (!event?.meerkat_url) return '';
    
    // If the user is the event creator or co-host, show the original meerkat URL (for hosts)
    // Otherwise, add "/remote" to the URL for attendees
    return (isEventCreator || isCoHost) ? event.meerkat_url : `${event.meerkat_url}/remote`;
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

  const handleEditEvent = () => {
    setEventToEdit(event);
    setCreateEventOpen(true);
  };

  const handleCreateEventSuccess = () => {
    fetchEvent();
    setCreateEventOpen(false);
    setEventToEdit(null);
  };

  const handleRsvpChange = (newStatus: boolean) => {
    setIsRsvped(newStatus);
    // Use the consistent query helper to fetch updated RSVPs
    fetchRsvps();
  };

  const handleCoHostAdded = () => {
    fetchEvent();
    // Fetch co-hosts after adding one
    supabase
      .from("event_co_hosts")
      .select(`
        profile_id,
        profiles:profiles(id, username, avatar_url)
      `)
      .eq("event_id", eventId)
      .then(({ data, error }) => {
        if (!error && data) {
          const coHostsData = data.map(item => item.profiles || {});
          setCoHosts(coHostsData);
        }
      });
    toast({
      title: "Co-host added",
      description: "Co-host has been successfully added to this event"
    });
  };

  const isEventInPast = event ? new Date(event.end_date) < new Date() : false;

  if (isPaidInvoiceLoading || loading) {
    return (
      <div className="container py-8 px-4 max-w-4xl mx-auto">
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

  console.log("🔍 Event Object:", event);
  console.log("🎤 Speakers data:", event?.speakers);
  console.log("📊 Does speakers field exist:", event?.hasOwnProperty('speakers'));
  console.log("📝 Speakers type:", typeof event?.speakers);

  const scrollToComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
        <div className="container max-w-4xl mx-auto px-4 py-8">
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
        <div className="container max-w-4xl mx-auto px-4 py-8">
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
            {/* Event Header Section */}
            <div className="flex flex-col gap-4">
              <div className="md:hidden">
                <EventDateBadge date={new Date(event?.start_date)} />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground flex items-center">
                    {event?.profiles?.username && `Hosted by ${event.profiles.username}`}
                    
                    {/* Add Co-Host Button - Only visible if user is the creator of the event */}
                    {isEventCreator && userProfile && eventId && (
                      <AddCoHostPopover 
                        eventId={eventId}
                        profileId={userProfile.id}
                        onSuccess={handleCoHostAdded}
                      />
                    )}
                  </p>
                  
                  {/* Edit Button - Only visible if user can edit this event */}
                  {canEditEvent && !isEventInPast && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleEditEvent}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Event
                    </Button>
                  )}
                </div>
                
                <h1 className="text-2xl md:text-3xl font-bold text-foreground break-words">{event?.title}</h1>
                
                <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-between">
                  <div className="hidden md:block">
                    <EventDateBadge date={new Date(event?.start_date)} />
                  </div>
                  
                  <div className="flex flex-wrap gap-2 md:gap-3">
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
                    {/* Add Comments Button here, inline with other actions */}
                    {eventId && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={scrollToComments}
                        className="flex items-center"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Comments
                        {commentCount > 0 && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {commentCount}
                          </Badge>
                        )}
                      </Button>
                    )}
                    <Button onClick={handleShare} variant="outline" size="sm">
                      <Share className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Content Section - Reordered to show details card first on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Details Card - Full width on mobile, right column on desktop */}
              <div className="md:order-2 md:col-span-1">
                <EventDetailsCard
                  startDate={event?.start_date ? new Date(event.start_date) : new Date()}
                  endDate={event?.end_date ? new Date(event.end_date) : new Date()}
                  isAllDay={event?.is_all_day ?? false}
                  timezone={event?.timezone ?? "Europe/Zurich"}
                  location={eventLocation ?? ""}
                  totalRsvps={rsvps.length}
                  attendees={rsvps}
                  eventId={eventId}
                  profileId={userProfile?.id}
                  canEdit={isEventCreator}
                  onCoHostAdded={handleCoHostAdded}
                  hostUsername={event?.profiles?.username}
                  coHosts={coHosts}
                  speakers={event?.speakers}
                  commentCount={commentCount}
                  onCommentClick={scrollToComments}
                />
              </div>

              {/* Description and other info - Full width on mobile, left column on desktop */}
              <div className="md:order-1 md:col-span-2 space-y-6">
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
                          {isEventCreator || isCoHost ? "Open Q&A Host Session" : "Open Q&A Session"}
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

                {/* Comments Section with ref for scrolling */}
                <Card className="border shadow-sm" id="comments" ref={commentsRef}>
                  <div className="p-6">
                    <EventComments eventId={eventId || ''} profileId={userProfile?.id} />
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}

      <CreateEventSheet
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
        onSuccess={handleCreateEventSuccess}
        userId={user?.id || ''}
        profileId={userProfile?.id}
        event={eventToEdit}
        userProfileData={userProfile}
      />
    </>
  );
};

export default EventPage;
