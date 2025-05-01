
import { useState, useEffect } from "react";
import { Check, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EventRSVPButtonProps {
  eventId: string;
  profileId: string;
  initialRSVP?: boolean; // Keep original prop but make it optional
  isAttending?: boolean; // Add the new prop being used
  onChange?: (newStatus: boolean) => void;
  onUpdate?: () => void; // Add the new callback being used
}

export function EventRSVPButton({
  eventId,
  profileId,
  initialRSVP,
  isAttending,
  onChange,
  onUpdate,
}: EventRSVPButtonProps) {
  // Use isAttending if provided, otherwise fallback to initialRSVP
  const [isRSVPed, setIsRSVPed] = useState(isAttending ?? initialRSVP ?? false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Update internal state when isAttending prop changes
  useEffect(() => {
    if (isAttending !== undefined) {
      setIsRSVPed(isAttending);
    }
  }, [isAttending]);

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
        if (onChange) onChange(true);
        if (onUpdate) onUpdate();
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
        if (onChange) onChange(false);
        if (onUpdate) onUpdate();
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
