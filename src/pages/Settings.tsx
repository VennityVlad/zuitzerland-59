
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DisplayCode } from '@/hooks/useDisplayCode';
import { DisplayCodeSection } from '@/components/settings/DisplayCodeSection';
import { Settings as SettingsIcon } from 'lucide-react';
import { PageTitle } from "@/components/PageTitle";

const Settings = () => {
  const [displayCodes, setDisplayCodes] = useState<DisplayCode[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [eventTags, setEventTags] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchDisplayCodes();
    fetchLocations();
    fetchEventTags();
  }, []);

  const fetchDisplayCodes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('display_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDisplayCodes(data || []);
    } catch (error) {
      console.error('Error fetching display codes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchEventTags = async () => {
    try {
      const { data, error } = await supabase
        .from('event_tags')
        .select('id, name');

      if (error) throw error;
      setEventTags(data || []);
    } catch (error) {
      console.error('Error fetching event tags:', error);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <PageTitle title="Settings" icon={<SettingsIcon className="h-5 w-5" />} />
      
      {isLoading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <DisplayCodeSection 
          displayCodes={displayCodes}
          locations={locations}
          eventTags={eventTags}
          onDisplayCodesChange={fetchDisplayCodes}
        />
      )}
    </div>
  );
};

export default Settings;
