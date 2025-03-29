
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, FileText, Layers, Percent, User, CalendarDays, BarChart, Building, Users, LogOut, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = usePrivy();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTimeoutRef = useRef<number | null>(null);
  
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

  // Handle scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Clear any existing timeout to prevent rapid firing
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      
      // Don't respond to tiny scroll amounts (helps with iOS bounce)
      if (Math.abs(currentScrollY - lastScrollY.current) < 10) {
        return;
      }
      
      // Determine if we should show/hide the nav
      if (currentScrollY > lastScrollY.current) {
        // Scrolling down - hide nav
        setIsVisible(false);
      } else {
        // Scrolling up - show nav
        setIsVisible(true);
      }
      
      // Update the last scroll position
      lastScrollY.current = currentScrollY;
      
      // Set a timeout before allowing another scroll event to trigger
      // This helps with inertial scrolling and bounce effects
      scrollTimeoutRef.current = window.setTimeout(() => {
        scrollTimeoutRef.current = null;
      }, 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Define a common type for navigation items
  type NavItem = {
    name: string;
    icon: typeof Calendar;
    path: string;
    showAlways: boolean;
  };

  const navItems: NavItem[] = [
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

  const adminItems: NavItem[] = [
    {
      name: "Invoices",
      icon: FileText,
      path: "/invoices",
      showAlways: false,
    },
    {
      name: "Reports",
      icon: BarChart,
      path: "/reports",
      showAlways: false,
    },
    {
      name: "Teams",
      icon: Building, 
      path: "/teams",
      showAlways: false,
    },
    {
      name: "Users",
      icon: Users,
      path: "/user-management",
      showAlways: false,
    },
    {
      name: "Room Types",
      icon: Layers,
      path: "/room-types",
      showAlways: false,
    },
    {
      name: "Discounts",
      icon: Percent,
      path: "/discounts",
      showAlways: false,
    },
  ];

  // Handle navigation
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  // Determine which items to show in the main nav (maximum 3 items)
  const mainNavItems = [...navItems];
  const moreItems: NavItem[] = [];

  // For admin users, add the first admin item to main nav and rest to more menu
  if (isAdmin) {
    mainNavItems.push(adminItems[0]);
    moreItems.push(...adminItems.slice(1));
  }

  return (
    <div className={cn(
      "fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 transition-transform duration-300",
      isVisible ? "translate-y-0" : "translate-y-full"
    )}>
      <div className="grid h-full grid-cols-4">
        {/* Display the main nav items */}
        {mainNavItems.slice(0, 3).map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() => handleNavigation(item.path)}
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
        
        {/* For non-admin users, show logout button as the 4th button */}
        {!isAdmin && (
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex flex-col items-center justify-center hover:bg-gray-50 text-red-500"
          >
            <LogOut className="w-6 h-6 mb-1" />
            <span className="text-xs">Logout</span>
          </button>
        )}
        
        {/* For admin users, show More button with popover as the 4th button */}
        {isAdmin && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex flex-col items-center justify-center hover:bg-gray-50"
              >
                <MoreHorizontal className="w-6 h-6 mb-1 text-gray-500" />
                <span className="text-xs text-gray-500">More</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2 z-[100]">
              <div className="flex flex-col space-y-1">
                {/* Display all additional admin items */}
                {moreItems.map((item) => (
                  <button
                    key={item.name}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100"
                    onClick={() => handleNavigation(item.path)}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </button>
                ))}
                {/* Logout button in the popover */}
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 rounded-md hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
};

export default BottomNav;
