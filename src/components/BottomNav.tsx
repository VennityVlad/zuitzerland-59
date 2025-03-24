
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CalendarDays, FileText, Users, MoreHorizontal, User, LogOut, Building } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [atBottom, setAtBottom] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, logout } = usePrivy();

  // Check if user is admin
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

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Check if we're at the bottom of the page
      const isAtBottom = currentScrollY + windowHeight >= documentHeight - 20;
      setAtBottom(isAtBottom);
      
      // Only change visibility for non-bottom scrolling
      if (!isAtBottom) {
        // Determine scroll direction and update visibility
        if (currentScrollY > lastScrollY && currentScrollY > 50) {
          // Scrolling down
          setIsVisible(false);
        } else if (currentScrollY < lastScrollY) {
          // Scrolling up
          setIsVisible(true);
        }
      }
      
      // Update last scroll position
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Create menu items based on admin status
  let menuItems = [];
  
  if (isAdmin) {
    // Admin menu: Book, Invoices, Users, Teams, More
    menuItems = [
      {
        icon: CalendarDays,
        label: "Book",
        path: "/book",
        action: () => navigate("/book")
      },
      {
        icon: FileText,
        label: "Invoices",
        path: "/invoices",
        action: () => navigate("/invoices")
      },
      {
        icon: Users,
        label: "Users",
        path: "/user-management",
        action: () => navigate("/user-management")
      },
      {
        icon: Building,
        label: "Teams",
        path: "/teams",
        action: () => navigate("/teams")
      },
      {
        icon: MoreHorizontal,
        label: "More",
        isDropdown: true
      }
    ];
  } else {
    // Non-admin menu: Book, Profile, Logout
    menuItems = [
      {
        icon: CalendarDays,
        label: "Book",
        path: "/book",
        action: () => navigate("/book")
      },
      {
        icon: User,
        label: "Profile",
        path: "/profile",
        action: () => navigate("/profile")
      },
      {
        icon: LogOut,
        label: "Log Out",
        action: () => logout()
      }
    ];
  }

  // Define dropdown items for "More" menu (admin only)
  const moreMenuItems = [
    {
      icon: User,
      label: "Profile",
      action: () => navigate("/profile")
    },
    {
      icon: CalendarDays,
      label: "Reports",
      action: () => navigate("/reports")
    },
    {
      icon: FileText,
      label: "Discounts",
      action: () => navigate("/discounts")
    },
    {
      icon: FileText,
      label: "Room Types",
      action: () => navigate("/room-types")
    },
    {
      icon: LogOut,
      label: "Log Out",
      action: () => logout()
    }
  ];

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 transition-all duration-300",
        isVisible ? "translate-y-0" : "translate-y-full",
        atBottom && "hidden" // Hide when at bottom
      )}
    >
      <div className={`grid ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} h-16`}>
        {menuItems.map((item, index) => {
          const isActive = !item.isDropdown && location.pathname === item.path;
          
          if (item.isDropdown) {
            return (
              <DropdownMenu key={`more-${index}`}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex flex-col items-center justify-center space-y-1",
                      "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    <item.icon size={20} />
                    <span className="text-xs">{item.label}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-t-none rounded-b-lg">
                  {moreMenuItems.map((dropdownItem, idx) => (
                    <DropdownMenuItem
                      key={idx}
                      className="cursor-pointer py-2"
                      onClick={dropdownItem.action}
                    >
                      <dropdownItem.icon className="mr-2 h-4 w-4" />
                      <span>{dropdownItem.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          return (
            <button
              key={item.label}
              className={cn(
                "flex flex-col items-center justify-center space-y-1",
                isActive 
                  ? "text-primary" 
                  : "text-gray-500 hover:text-gray-900"
              )}
              onClick={item.action}
            >
              <item.icon size={20} />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
