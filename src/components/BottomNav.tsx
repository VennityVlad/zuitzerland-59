
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, FileText, Layers, Percent, User, CalendarDays, BarChart, Building, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = usePrivy();
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
      name: "Profile",
      icon: User,
      path: "/profile",
      showAlways: true,
    },
  ];

  const adminItems = [
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
  ];

  // Add admin items if user is admin
  const displayItems = [...navItems];
  if (isAdmin) {
    displayItems.push(...adminItems);
  }

  // Add logout button (not a navigation item)
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200">
      <div className="grid h-full grid-cols-5">
        {displayItems.slice(0, 4).map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() => navigate(item.path)}
            className={cn(
              "inline-flex flex-col items-center justify-center hover:bg-gray-50",
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
        
        {/* Logout button always in last position */}
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex flex-col items-center justify-center hover:bg-gray-50 text-red-500"
        >
          <LogOut className="w-6 h-6 mb-1" />
          <span className="text-xs">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
