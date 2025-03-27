
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/types/invoice";

export const useProfileInvitationStatus = (
  isAdmin: boolean,
  invoicesLoading: boolean,
  invoices: Invoice[]
) => {
  const [profileInvitationStatus, setProfileInvitationStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchInvitationStatus = async () => {
      if (!isAdmin || invoicesLoading || invoices.length === 0) return;
      
      const profileIds = invoices
        .filter(invoice => invoice.status === 'paid' && invoice.profile_id)
        .map(invoice => invoice.profile_id)
        .filter((id, index, self) => id && self.indexOf(id) === index) as string[];
      
      if (profileIds.length === 0) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, is_guild_invited')
          .in('id', profileIds);
        
        if (error) throw error;
        
        const statusMap: Record<string, boolean> = {};
        data.forEach(profile => {
          statusMap[profile.id] = profile.is_guild_invited || false;
        });
        
        setProfileInvitationStatus(statusMap);
      } catch (error) {
        console.error('Error fetching guild invitation status:', error);
      }
    };
    
    fetchInvitationStatus();
  }, [isAdmin, invoices, invoicesLoading]);

  return { profileInvitationStatus };
};
