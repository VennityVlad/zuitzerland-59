
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle } from "@/components/PageTitle";
import { EventWithProfile, CoHostRecord } from "@/types/event";
import { usePaidInvoiceStatus } from "@/hooks/usePaidInvoiceStatus";
import { usePrivy } from "@privy-io/react-auth";

// Function to check if user can edit an event
const canEditEvent = (event: EventWithProfile, isAdminUser: boolean, profileId: string, coHosts: CoHostRecord) => {
  if (isAdminUser) return true;
  if (event.profiles?.id === profileId) return true;
  
  // Check if user is a co-host
  const eventCoHosts = coHosts[event.id] || [];
  if (eventCoHosts.some(host => host.id === profileId)) return true;
  
  return false;
};

const Events = () => {
  const [events, setEvents] = useState<EventWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [coHosts, setCoHosts] = useState<CoHostRecord>({});
  const { user } = usePrivy();
  const { isAdmin: isAdminUser } = usePaidInvoiceStatus(user?.id);
  const [profileId, setProfileId] = useState<string>("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('privy_id', user.id)
          .maybeSingle();
        
        if (data) {
          setProfileId(data.id);
        }
      }
    };

    fetchProfile();
  }, [user?.id]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*, profiles:profiles!events_created_by_fkey(id, username)')
          .order('start_date', { ascending: true });

        if (error) throw error;
        if (data) setEvents(data as EventWithProfile[]);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCoHosts = async () => {
      try {
        const { data, error } = await supabase
          .from('event_co_hosts')
          .select('event_id, profiles:profile_id(id, username, avatar_url)');

        if (error) throw error;
        
        if (data) {
          const coHostsMap: CoHostRecord = {};
          
          data.forEach(item => {
            if (!coHostsMap[item.event_id]) {
              coHostsMap[item.event_id] = [];
            }
            // Check if profiles exists and is a valid object with an id property
            if (item.profiles && typeof item.profiles === 'object' && item.profiles !== null && 'id' in item.profiles) {
              // Use a type guard function to ensure profiles has the correct shape
              const profile = item.profiles as { id: string; username: string; avatar_url?: string | null };
              coHostsMap[item.event_id].push({
                id: profile.id,
                username: profile.username,
                avatar_url: profile.avatar_url
              });
            }
          });
          
          setCoHosts(coHostsMap);
        }
      } catch (error) {
        console.error('Error fetching co-hosts:', error);
      }
    };

    fetchEvents();
    fetchCoHosts();
  }, []);

  return (
    <div className="container py-8">
      <PageTitle title="Events" />
      <div className="space-y-4">
        {loading ? (
          <p>Loading events...</p>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(event => (
              <div key={event.id} className="border rounded-lg p-4">
                <h3 className="text-lg font-medium">{event.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Hosted by {event.profiles?.username}
                  {coHosts[event.id] && coHosts[event.id].length > 0 && (
                    <span className="text-gray-500">
                      {" "}• Co-hosts: {coHosts[event.id].map(host => host.username).join(', ')}
                    </span>
                  )}
                </p>
                <div className="mt-2">
                  {canEditEvent(event, isAdminUser, profileId, coHosts) && (
                    <button className="text-sm text-blue-500 hover:underline">Edit</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No events found.</p>
        )}
      </div>
    </div>
  );
};

export default Events;
