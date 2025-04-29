
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { getSettingEnabled } from "@/utils/settingsUtils";

export const useMenuVisibility = (userId: string | undefined) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);
  const [hasPaidInvoice, setHasPaidInvoice] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkAccess = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Check if user is admin using the security definer function
        const { data: userRole, error: roleError } = await supabase
          .rpc('get_user_role')
          .single();

        if (roleError) throw roleError;
        
        setIsAdmin(userRole === 'admin');

        // Get profile id safely for checking invoices
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('privy_id', userId)
          .maybeSingle();

        if (profileError) throw profileError;

        if (profileData?.id) {
          const { data: invoiceData, error: invoiceError } = await supabase
            .from('invoices')
            .select('id')
            .eq('profile_id', profileData.id)
            .eq('status', 'paid')
            .maybeSingle();

          if (invoiceError) throw invoiceError;
          setHasPaidInvoice(!!invoiceData);
        }

        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', ['show_onboarding_page', 'show_directory_page']);

        if (settingsError) throw settingsError;

        if (settingsData) {
          const onboardingSetting = settingsData.find(s => s.key === 'show_onboarding_page')?.value;
          const directorySetting = settingsData.find(s => s.key === 'show_directory_page')?.value;

          setShowOnboarding(getSettingEnabled(onboardingSetting));
          setShowDirectory(getSettingEnabled(directorySetting));
        }
      } catch (error) {
        console.error('Error checking access:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [userId]);

  return {
    isAdmin,
    showOnboarding,
    showDirectory,
    hasPaidInvoice,
    isLoading
  };
};
