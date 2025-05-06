
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddCoHostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  createdBy: string;
  onCoHostAdded: () => void;
}

export function AddCoHostDialog({ 
  open, 
  onOpenChange, 
  eventId, 
  createdBy,
  onCoHostAdded 
}: AddCoHostDialogProps) {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleAddCoHost = async () => {
    if (!identifier.trim()) {
      setError("Please enter an email or username");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      // First, find the user by email or username
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, email")
        .or(`username.eq.${identifier},email.eq.${identifier}`)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profileData) {
        setError("User not found. Please check the email or username and try again.");
        setLoading(false);
        return;
      }

      // Check if the user is already a co-host
      const { data: existingCoHost, error: checkError } = await supabase
        .from("event_co_hosts")
        .select("id")
        .eq("event_id", eventId)
        .eq("profile_id", profileData.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingCoHost) {
        setError("This user is already a co-host for this event.");
        setLoading(false);
        return;
      }

      // Add the co-host
      const { error: insertError } = await supabase
        .from("event_co_hosts")
        .insert({
          event_id: eventId,
          profile_id: profileData.id,
          created_by: createdBy
        });

      if (insertError) throw insertError;

      toast({
        title: "Co-host added",
        description: `${profileData.username || profileData.email} has been added as a co-host.`
      });

      setIdentifier("");
      onCoHostAdded();
      onOpenChange(false);
    } catch (err) {
      console.error("Error adding co-host:", err);
      setError("Failed to add co-host. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Co-host</DialogTitle>
          <DialogDescription>
            Add a co-host who will have edit access to this event.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Input
              placeholder="Enter email or username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={handleAddCoHost} 
            disabled={loading || !identifier.trim()}
          >
            {loading ? "Adding..." : "Add Co-host"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
