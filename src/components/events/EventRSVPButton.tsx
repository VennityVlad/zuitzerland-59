
import { useState } from "react";
import { Check, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EventRSVPButtonProps {
  eventId: string;
  profileId: string;
  initialRSVP: boolean;
  onChange: (newStatus: boolean) => void;
}

export function EventRSVPButton({
  eventId,
  profileId,
  initialRSVP,
  onChange,
}: EventRSVPButtonProps) {
  const [isRSVPed, setIsRSVPed] = useState(initialRSVP);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleToggleRSVP = async () => {
    if (!profileId) {
      toast({ 
        title: "Error", 
        description: "Unable to identify your profile. Please refresh the page or sign in again.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      if (!isRSVPed) {
        // RSVP
        const { error } = await supabase
          .from("event_rsvps")
          .insert([{ event_id: eventId, profile_id: profileId }]);
        if (error) throw error;
        setIsRSVPed(true);
        onChange(true);
        toast({ title: "RSVP added", description: "You are now going to this event!" });
      } else {
        // Remove RSVP
        const { error } = await supabase
          .from("event_rsvps")
          .delete()
          .eq("event_id", eventId)
          .eq("profile_id", profileId);
        if (error) throw error;
        setIsRSVPed(false);
        onChange(false);
        toast({ title: "RSVP removed", description: "You are no longer going to this event." });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update RSVP.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={isRSVPed ? "secondary" : "outline"}
      size="sm"
      onClick={handleToggleRSVP}
      disabled={loading}
      className={`border-green-600 text-green-700 hover:bg-green-50 min-w-[90px]`}
    >
      <Users className="h-4 w-4 mr-2" />
      {isRSVPed ? "Going" : "RSVP"}
      {isRSVPed && <Check className="h-4 w-4 ml-1 text-green-700" />}
    </Button>
  );
}
