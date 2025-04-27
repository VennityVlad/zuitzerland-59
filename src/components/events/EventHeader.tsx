
import { Badge } from "@/components/ui/badge";
import { EventRSVPButton } from "./EventRSVPButton";
import { Button } from "@/components/ui/button";
import { Share } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EventHeaderProps {
  title: string;
  location: string;
  isAuthenticated: boolean;
  userId?: string;
  eventId: string;
  isRsvped: boolean;
  onRsvpChange: (status: boolean) => void;
}

export const EventHeader = ({ 
  title, 
  location, 
  isAuthenticated,
  userId,
  eventId,
  isRsvped,
  onRsvpChange
}: EventHeaderProps) => {
  const { toast } = useToast();

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: `Check out this event: ${title}`,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-4xl font-bold text-white">{title}</h1>
        <div className="flex gap-2">
          {isAuthenticated && (
            <EventRSVPButton 
              eventId={eventId}
              profileId={userId || ''}
              initialRSVP={isRsvped}
              onChange={onRsvpChange}
            />
          )}
          <Button onClick={handleShare} variant="outline" size="sm">
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="text-sm">
          Featured in {location}
        </Badge>
      </div>
    </div>
  );
};
