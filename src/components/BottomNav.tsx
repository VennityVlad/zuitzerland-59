
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CalendarDays, FileText, User, ChevronUp } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/integrations/supabase/client";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [atBottom, setAtBottom] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = usePrivy();

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

  // Default menu items (always show Book and Profile)
  const menuItems = [
    {
      icon: CalendarDays,
      label: "Book",
      path: "/book",
    },
    {
      icon: User,
      label: "Profile",
      path: "/profile",
    },
  ];

  // Only add Invoices tab for admin users
  if (isAdmin) {
    // Insert Invoices between Book and Profile
    menuItems.splice(1, 0, {
      icon: FileText,
      label: "Invoices",
      path: "/invoices",
    });
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 transition-all duration-300",
        isVisible ? "translate-y-0" : "translate-y-full",
        atBottom && "hidden" // Hide when at bottom
      )}
    >
      <div className="grid grid-cols-3 h-16">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              className={cn(
                "flex flex-col items-center justify-center space-y-1",
                isActive 
                  ? "text-primary" 
                  : "text-gray-500 hover:text-gray-900"
              )}
              onClick={() => navigate(item.path)}
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
