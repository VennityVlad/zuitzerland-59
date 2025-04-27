
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle } from "@/components/PageTitle";
import { PrivacySettingsCard } from "@/components/privacy/PrivacySettingsCard";

const PrivacyDashboard = () => {
  const { user, authenticated } = usePrivy();
  const [privacySettings, setPrivacySettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrivacySettings = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('privacy_settings')
          .eq('privy_id', user.id)
          .single();

        if (error) throw error;
        setPrivacySettings(data.privacy_settings);
      } catch (error) {
        console.error('Error fetching privacy settings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (authenticated && user) {
      fetchPrivacySettings();
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
          {privacySettings && (
            <PrivacySettingsCard
              initialSettings={privacySettings}
              onUpdate={setPrivacySettings}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivacyDashboard;
