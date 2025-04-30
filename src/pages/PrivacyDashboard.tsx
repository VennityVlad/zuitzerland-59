
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle } from "@/components/PageTitle";
import { PrivacySettingsCard } from "@/components/privacy/PrivacySettingsCard";

type PrivacySettings = {
  directory_visibility: 'none' | 'basic' | 'full';
  event_rsvp_visibility: 'private' | 'public';
  booking_info_retention_days: number;
};

const defaultPrivacySettings: PrivacySettings = {
  directory_visibility: 'none',
  event_rsvp_visibility: 'private',
  booking_info_retention_days: 90,
};

const PrivacyDashboard = () => {
  const { user, authenticated } = usePrivy();
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(defaultPrivacySettings);
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
        
        // Convert legacy opt_in_directory to directory_visibility if needed
        let settings = data.privacy_settings || {...defaultPrivacySettings};
        
        if (data.opt_in_directory !== null && settings.directory_visibility === 'none') {
          settings.directory_visibility = data.opt_in_directory ? 'basic' : 'none';
        }
        
        setPrivacySettings(settings);
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
            onUpdate={setPrivacySettings}
          />
        </div>
      </div>
    </div>
  );
};

export default PrivacyDashboard;
