
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, FileText, Layers, Percent, User, CalendarDays, BarChart, Building, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = usePrivy();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const fetchProfile = async () => {
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
      fetchProfile();
    }
  }, [user?.id]);

  const navItems = [
    {
      name: "Book",
      icon: CalendarDays,
      path: "/book",
      showAlways: true,
    },
    {
      name: "Events",
      icon: Calendar,
      path: "/events",
      showAlways: true,
    },
    {
      name: "Invoices",
      icon: FileText,
      path: "/invoices",
      adminOnly: true,
    },
    {
      name: "Reports",
      icon: BarChart,
      path: "/reports",
      adminOnly: true,
    },
    {
      name: "Profile",
      icon: User,
      path: "/profile",
      showAlways: true,
    },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.showAlways || (isAdmin && item.adminOnly)
  ).slice(0, 5); // Only show up to 5 items to avoid overcrowding the bottom nav

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200">
      <div className="grid h-full grid-cols-5">
        {filteredNavItems.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() => navigate(item.path)}
            className={cn(
              "inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50",
              location.pathname === item.path && "bg-primary/10 text-primary"
            )}
          >
            <item.icon className={cn(
              "w-6 h-6 mb-1",
              location.pathname === item.path ? "text-primary" : "text-gray-500"
            )} />
            <span className={cn(
              "text-xs",
              location.pathname === item.path ? "text-primary" : "text-gray-500"
            )}>
              {item.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
