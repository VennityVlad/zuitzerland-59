
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AddCoHostPopoverProps {
  eventId: string;
  profileId: string;
  onSuccess?: () => void;
}

export const AddCoHostPopover = ({ eventId, profileId, onSuccess }: AddCoHostPopoverProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleAddCoHost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First, find the profile with the given email
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.toLowerCase())
        .maybeSingle();
        
      if (profileError) throw profileError;
      
      if (!profileData) {
        toast({
          title: "User not found",
          description: "No user found with that email address",
          variant: "destructive",
        });
        return;
      }
      
      // Check if this person is already a co-host
      const { data: existingCoHost, error: checkError } = await supabase
        .from("event_co_hosts")
        .select("id")
        .eq("event_id", eventId)
        .eq("profile_id", profileData.id)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      if (existingCoHost) {
        toast({
          title: "Already a co-host",
          description: "This user is already a co-host for this event",
        });
        return;
      }
      
      // Add the co-host
      const { error: insertError } = await supabase
        .from("event_co_hosts")
        .insert({
          event_id: eventId,
          profile_id: profileData.id,
          created_by: profileId
        });
      
      if (insertError) throw insertError;
      
      toast({
        title: "Co-host added",
        description: "Successfully added co-host to the event",
      });
      
      // Reset form and close popover
      setEmail("");
      setIsOpen(false);
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error("Error adding co-host:", error);
      toast({
        title: "Error",
        description: "Failed to add co-host. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground">
          Add Co-Host
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Add Co-Host</h4>
          <p className="text-sm text-muted-foreground">
            Add a co-host who can edit this event.
          </p>
          <form onSubmit={handleAddCoHost} className="space-y-3">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Co-Host"}
              </Button>
            </div>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
};
