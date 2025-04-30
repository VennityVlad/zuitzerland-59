
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePrivy } from "@privy-io/react-auth";
import { useState } from "react";
import { Eye } from "lucide-react";
import { CalendarCheck } from "lucide-react";
import { Clock } from "lucide-react";

type PrivacySettings = {
  directory_visibility: 'none' | 'basic' | 'full';
  event_rsvp_visibility: 'private' | 'public';
  booking_info_retention_days: number;
};

export const PrivacySettingsCard = ({ 
  initialSettings,
  onUpdate
}: { 
  initialSettings: PrivacySettings;
  onUpdate: (settings: PrivacySettings) => void;
}) => {
  const [settings, setSettings] = useState<PrivacySettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = usePrivy();

  const handleSave = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      // Determine opt_in_directory value based on directory_visibility
      const optInDirectory = settings.directory_visibility !== 'none';

      const { error } = await supabase
        .from('profiles')
        .update({ 
          privacy_settings: settings,
          opt_in_directory: optInDirectory
        })
        .eq('privy_id', user.id);

      if (error) throw error;

      onUpdate(settings);
      toast({
        title: "Settings saved",
        description: "Your privacy preferences have been updated",
      });
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to save privacy settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
        <CardDescription>
          Manage how your information is shared and stored
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Eye className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-2 flex-1">
              <Label>Directory Visibility</Label>
              <Select
                value={settings.directory_visibility}
                onValueChange={(value: 'none' | 'basic' | 'full') => 
                  setSettings(s => ({ ...s, directory_visibility: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Hidden (Not in Directory)</SelectItem>
                  <SelectItem value="basic">Basic Info</SelectItem>
                  <SelectItem value="full">Full Profile</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Choose how your profile appears in the resident directory
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <CalendarCheck className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-2 flex-1">
              <Label>Event RSVP Visibility</Label>
              <Select
                value={settings.event_rsvp_visibility}
                onValueChange={(value: 'private' | 'public') => 
                  setSettings(s => ({ ...s, event_rsvp_visibility: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Control whether others can see your event RSVPs
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-2 flex-1">
              <Label>Booking Info Retention (days): {settings.booking_info_retention_days}</Label>
              <Slider
                value={[settings.booking_info_retention_days]}
                onValueChange={([value]) => 
                  setSettings(s => ({ ...s, booking_info_retention_days: value }))
                }
                min={30}
                max={365}
                step={30}
              />
              <p className="text-sm text-muted-foreground mt-1">
                How long to retain your booking information after checkout
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
};
