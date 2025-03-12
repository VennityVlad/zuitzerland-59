import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CalendarDays, FileText, MoreHorizontal, User, Percent, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/integrations/supabase/client";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = usePrivy();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [visible, setVisible] = useState(true);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const lastScrollY = useRef(0);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Handle scroll events to show/hide the bottom navigation
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      const isMovingUp = currentScrollPos < lastScrollY.current;
      
      // Check if we're at the bottom of the page with a buffer
      const isAtBottom = 
        window.innerHeight + currentScrollPos >= 
        document.documentElement.scrollHeight - 10;

      // Clear any existing timeout to handle frequent scroll events
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      
      // Hide nav when scrolling down
      if (currentScrollPos > lastScrollY.current && visible && currentScrollPos > 10) {
        setVisible(false);
      } 
      // Show nav when scrolling up, but not during iOS bounce effect at bottom
      else if (isMovingUp && !visible && !isAtBottom) {
        setVisible(true);
      }
      
      lastScrollY.current = currentScrollPos;
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [prevScrollPos, visible]);

  // Close more menu when navigating
  useEffect(() => {
    setShowMoreMenu(false);
  }, [location.pathname]);

  // Check if user is admin
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

  // Base navigation items for all users
  let navItems = [
    {
      label: "Book",
      icon: <CalendarDays className="h-6 w-6" />,
      path: "/book",
    },
    {
      label: "Invoices",
      icon: <FileText className="h-6 w-6" />,
      path: "/invoices",
    },
    {
      label: "More",
      icon: <MoreHorizontal className="h-6 w-6" />,
      onClick: () => setShowMoreMenu(!showMoreMenu),
    },
  ];

  // Add Discounts button for admin users
  if (isAdmin) {
    // Insert Discounts before More
    navItems = [
      ...navItems.slice(0, 2),
      {
        label: "Discounts",
        icon: <Percent className="h-6 w-6" />,
        path: "/discounts",
      },
      navItems[2] // More menu
    ];
  }

  // Items that will appear in the More menu
  const moreMenuItems = [
    {
      label: "Profile",
      icon: <User className="h-5 w-5" />,
      path: "/profile",
    }
  ];

  // Add Room Types to More menu for admin users
  if (isAdmin) {
    moreMenuItems.push(
      {
        label: "Room Types",
        icon: <Layers className="h-5 w-5" />,
        path: "/room-types",
      }
    );
  }

  return (
    <>
      {/* More menu popup */}
      {showMoreMenu && (
        <div className="fixed bottom-20 right-4 bg-white rounded-lg shadow-lg z-50 w-56 border divide-y">
          {moreMenuItems.map((item) => (
            <div 
              key={item.label}
              className="p-3 hover:bg-gray-100 rounded-md cursor-pointer flex items-center gap-3"
              onClick={() => {
                navigate(item.path);
                setShowMoreMenu(false);
              }}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
          <div 
            className="p-3 hover:bg-gray-100 rounded-md cursor-pointer text-red-500 flex items-center gap-3"
            onClick={() => logout()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span className="text-sm font-medium">Log out</span>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-white border-t z-40 h-16 transition-transform duration-300",
          !visible && "transform translate-y-full"
        )}
      >
        <div className={cn(
          "grid h-full",
          isAdmin ? "grid-cols-4" : "grid-cols-3"
        )}>
          {navItems.map((item) => {
            const isActive = item.path ? location.pathname === item.path : false;
            
            return (
              <button
                key={item.label}
                className={cn(
                  "flex flex-col items-center justify-center h-full",
                  isActive ? "text-primary" : "text-gray-500"
                )}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  } else if (item.path) {
                    navigate(item.path);
                  }
                }}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Dynamic bottom padding that adjusts based on nav visibility */}
      <div className={cn(
        "h-16 transition-all duration-300",
        !visible && "h-0"
      )}></div>
    </>
  );
};

export default BottomNav;
