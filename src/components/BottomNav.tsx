
import { usePrivy } from "@privy-io/react-auth";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CalendarDays, FileText, User, Percent, Layers, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const BottomNav = () => {
  const { user } = usePrivy();
  const navigate = useNavigate();
  const location = useLocation();
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
      label: "Book",
      icon: <CalendarDays className="h-5 w-5" />,
      path: "/book",
    },
    {
      label: "Invoices",
      icon: <FileText className="h-5 w-5" />,
      path: "/invoices",
    },
    {
      label: "Profile",
      icon: <User className="h-5 w-5" />,
      path: "/profile",
    }
  ];

  // Add admin-only items if the user is an admin
  if (isAdmin) {
    navItems.splice(2, 0, {
      label: "Reports",
      icon: <BarChart className="h-5 w-5" />,
      path: "/reports",
    });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full p-1",
                isActive ? "text-primary" : "text-gray-500"
              )}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
