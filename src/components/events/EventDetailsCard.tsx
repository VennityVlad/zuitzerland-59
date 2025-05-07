
import { Calendar, Clock, MapPin, Users, UserPlus } from "lucide-react";
import { formatTimeRange } from "@/lib/date-utils";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { EventRSVPAvatars } from "./EventRSVPAvatars";
import { AddCoHostPopover } from "./AddCoHostPopover";

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
  coHosts?: any[]; // Added co-hosts prop
}

export const EventDetailsCard = ({
  startDate,
  endDate,
  isAllDay,
  timezone,
  location,
  totalRsvps,
  attendees,
  eventId,
  profileId,
  canEdit = false,
  onCoHostAdded,
  coHosts = [], // Default to empty array
}: EventDetailsCardProps) => {
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

          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 mt-1 text-muted-foreground" />
            <div className="space-y-2">
              <p className="font-medium text-foreground">{totalRsvps} attending</p>
              <EventRSVPAvatars profiles={attendees} />
            </div>
          </div>

          {/* Add Co-Host button - only visible if user can edit and eventId exists */}
          {canEdit && eventId && profileId && (
            <div className="flex items-start gap-3">
              <UserPlus className="h-5 w-5 mt-1 text-muted-foreground" />
              <div>
                <AddCoHostPopover 
                  eventId={eventId}
                  profileId={profileId}
                  onSuccess={onCoHostAdded}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
