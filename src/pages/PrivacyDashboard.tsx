
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle } from "@/components/PageTitle";
import { PrivacySettingsCard } from "@/components/privacy/PrivacySettingsCard";
import { Json } from "@/integrations/supabase/types";

type PrivacySettings = {
  event_rsvp_visibility: 'private' | 'public';
  booking_info_retention_days: number;
};

const defaultPrivacySettings: PrivacySettings = {
  event_rsvp_visibility: 'private',
  booking_info_retention_days: 90,
};

const PrivacyDashboard = () => {
  const { user, authenticated } = usePrivy();
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(defaultPrivacySettings);
  const [directoryVisibility, setDirectoryVisibility] = useState<'none' | 'basic' | 'full'>('none');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrivacySettings = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('privacy_settings, opt_in_directory')
          .eq('privy_id', user.id)
          .single();

        if (error) throw error;
        
        // Set directory visibility based on opt_in_directory boolean
        const visibilitySetting = data.opt_in_directory ? 'basic' : 'none';
        setDirectoryVisibility(visibilitySetting);
        
        // Extract the privacy settings from JSON and ensure it conforms to our type
        if (data.privacy_settings && typeof data.privacy_settings === 'object' && !Array.isArray(data.privacy_settings)) {
          // Safely extract the values we need
          const settings = data.privacy_settings as Record<string, Json>;
          
          // Extract the keys we need and provide defaults for missing values
          const extractedSettings: PrivacySettings = {
            event_rsvp_visibility: 
              (settings.event_rsvp_visibility === 'private' || settings.event_rsvp_visibility === 'public') 
                ? settings.event_rsvp_visibility 
                : defaultPrivacySettings.event_rsvp_visibility,
            booking_info_retention_days: 
              typeof settings.booking_info_retention_days === 'number'
                ? settings.booking_info_retention_days
                : defaultPrivacySettings.booking_info_retention_days
          };
          
          setPrivacySettings(extractedSettings);
        } else {
          setPrivacySettings({...defaultPrivacySettings});
        }
      } catch (error) {
        console.error('Error fetching privacy settings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (authenticated && user) {
      fetchPrivacySettings();
    } else {
      setLoading(false);
    }
  }, [user, authenticated]);

  if (!authenticated) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          Please sign in to access your privacy settings.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">Loading privacy settings...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageTitle 
        title="Privacy Dashboard" 
        description="Manage your privacy settings and data retention preferences"
      />
      
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          <PrivacySettingsCard
            initialSettings={privacySettings}
            initialDirectoryVisibility={directoryVisibility}
            onUpdate={(settings, visibility) => {
              setPrivacySettings(settings);
              setDirectoryVisibility(visibility);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PrivacyDashboard;
