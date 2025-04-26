
import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";
import { PageTitle } from "@/components/PageTitle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarDays, LogIn } from "lucide-react";
import { formatTimeRange } from "@/lib/date-utils";

const EventPage = () => {
  const { eventId } = useParams();
  const { user, authenticated } = usePrivy();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

      <div className="container py-6 max-w-4xl mx-auto px-4">
        <PageTitle 
          title={event.title}
          description="Event Details"
          icon={<CalendarDays className="h-8 w-8" />}
        />

        {!authenticated ? (
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
        ) : (
          <div className="space-y-6">
            {/* Show full event details for authenticated users */}
            {/* ... similar to the event card in the Events page, but with more details */}
            {/* We'll create this in the next iteration if needed */}
          </div>
        )}
      </div>
    </>
  );
};

export default EventPage;
