
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { formatTimeRange } from "@/lib/date-utils";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { EventRSVPAvatars } from "./EventRSVPAvatars";

interface EventDetailsCardProps {
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  timezone: string;
  location: string;
  totalRsvps: number;
  attendees: any[];
}

export const EventDetailsCard = ({
  startDate,
  endDate,
  isAllDay,
  timezone,
  location,
  totalRsvps,
  attendees,
}: EventDetailsCardProps) => {
  const dateStr = format(startDate, "EEEE, MMMM d");
  const timeRange = formatTimeRange(startDate, endDate, isAllDay, timezone);

  return (
    <Card className="bg-white/10 border-0 backdrop-blur-sm p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 mt-1 text-gray-300" />
          <div>
            <p className="font-medium text-white">{dateStr}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 mt-1 text-gray-300" />
          <div>
            <p className="font-medium text-white">{timeRange}</p>
          </div>
        </div>

        {location && (
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 mt-1 text-gray-300" />
            <div>
              <p className="font-medium text-white">{location}</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 mt-1 text-gray-300" />
          <div className="space-y-2">
            <p className="font-medium text-white">{totalRsvps} attending</p>
            <EventRSVPAvatars profiles={attendees} />
          </div>
        </div>
      </div>
    </Card>
  );
};
