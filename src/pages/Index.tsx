
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavMenu from "@/components/NavMenu";
import BottomNav from "@/components/BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = usePrivy();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('privy_id', user.id)
          .maybeSingle();

        if (error) throw error;
        
        setIsAdmin(data?.role === 'admin');
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    if (user?.id) {
      checkAdminStatus();
    }
  }, [user?.id]);

  useEffect(() => {
    navigate("/book");
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!isMobile && <NavMenu />}
      <main className="flex-1">
        {/* Content will be rendered via navigation */}
      </main>
      {isMobile && <BottomNav />}
    </div>
  );
};

export default Index;
