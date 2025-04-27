
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

type PrivacySettings = {
  directory_visibility: 'none' | 'basic' | 'full';
  event_rsvp_visibility: 'private' | 'public';
  room_history_retention_days: number;
  booking_info_retention_days: number;
  allow_event_reminders: boolean;
  share_basic_profile: boolean;
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
      const { error } = await supabase
        .from('profiles')
        .update({ privacy_settings: settings })
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
          <div className="space-y-2">
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
                <SelectItem value="none">Hidden</SelectItem>
                <SelectItem value="basic">Basic Info</SelectItem>
                <SelectItem value="full">Full Profile</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
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
          </div>

          <div className="space-y-2">
            <Label>Room History Retention (days): {settings.room_history_retention_days}</Label>
            <Slider
              value={[settings.room_history_retention_days]}
              onValueChange={([value]) => 
                setSettings(s => ({ ...s, room_history_retention_days: value }))
              }
              min={30}
              max={365}
              step={30}
            />
          </div>

          <div className="space-y-2">
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
          </div>

          <div className="flex items-center justify-between">
            <Label>Allow Event Reminders</Label>
            <Switch
              checked={settings.allow_event_reminders}
              onCheckedChange={(checked) => 
                setSettings(s => ({ ...s, allow_event_reminders: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Share Basic Profile with Event Organizers</Label>
            <Switch
              checked={settings.share_basic_profile}
              onCheckedChange={(checked) => 
                setSettings(s => ({ ...s, share_basic_profile: checked }))
              }
            />
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
