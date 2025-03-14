
import { usePrivy } from "@privy-io/react-auth";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  CalendarDays, 
  FileText, 
  Users, 
  MoreHorizontal,
  Percent,
  Layers,
  BarChart,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

const BottomNav = () => {
  const { user, logout } = usePrivy();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10; // Minimum scroll amount to trigger hide/show
  const scrollTimeout = useRef<number | null>(null);
  const isScrollingUp = useRef(false);
  const reachedBottom = useRef(false);

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

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const isAtBottom = currentScrollY + windowHeight >= documentHeight - 20; // Added some buffer
      const isAtTop = currentScrollY < 10;
      
      // Handle scroll direction detection
      if (currentScrollY < lastScrollY.current) {
        isScrollingUp.current = true;
      } else if (currentScrollY > lastScrollY.current) {
        isScrollingUp.current = false;
      }
      
      // Track if we're at the bottom to handle bounce effects
      if (isAtBottom) {
        reachedBottom.current = true;
      } else if (currentScrollY < documentHeight - windowHeight - 50) {
        reachedBottom.current = false;
      }
      
      // Don't hide nav when at the very top
      if (isAtTop) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }
      
      // Handle visibility based on scroll direction and position
      if (Math.abs(currentScrollY - lastScrollY.current) > scrollThreshold) {
        // Only show on genuine upward scroll, not bounce effects
        if (isScrollingUp.current && !reachedBottom.current) {
          setIsVisible(true);
        } else if (!isScrollingUp.current) {
          // Hide when scrolling down
          setIsVisible(false);
        }
        
        lastScrollY.current = currentScrollY;
      }
      
      // Clear any existing timeouts
      if (scrollTimeout.current !== null) {
        window.clearTimeout(scrollTimeout.current);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current !== null) {
        window.clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  const mainNavItems = [
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
      label: "Users",
      icon: <Users className="h-5 w-5" />,
      path: "/user-management",
      adminOnly: true,
    },
    {
      label: "More",
      icon: <MoreHorizontal className="h-5 w-5" />,
      action: () => setMoreDrawerOpen(true),
    }
  ];

  const moreMenuItems = [
    {
      label: "Profile",
      icon: <Users className="h-5 w-5" />,
      path: "/profile",
    },
    {
      label: "Reports",
      icon: <BarChart className="h-5 w-5" />,
      path: "/reports",
      adminOnly: true,
    },
    {
      label: "Discounts",
      icon: <Percent className="h-5 w-5" />,
      path: "/discounts",
      adminOnly: true,
    },
    {
      label: "Room Types",
      icon: <Layers className="h-5 w-5" />,
      path: "/room-types",
      adminOnly: true,
    }
  ];

  // Filter out admin-only items if user is not an admin
  const filteredMainNavItems = mainNavItems.filter(item => !item.adminOnly || isAdmin);
  const filteredMoreMenuItems = moreMenuItems.filter(item => !item.adminOnly || isAdmin);

  const handleNavigation = (item: any) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
      setMoreDrawerOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setMoreDrawerOpen(false);
  };

  return (
    <>
      <div className={cn(
        "bottom-nav",
        isVisible ? "bottom-nav-visible" : "bottom-nav-hidden"
      )}>
        <div className="flex items-center justify-around h-16">
          {filteredMainNavItems.map((item, index) => {
            const isActive = item.path ? location.pathname === item.path : false;
            return (
              <button
                key={index}
                className={cn(
                  "bottom-nav-item",
                  isActive ? "bottom-nav-item-active" : "bottom-nav-item-inactive"
                )}
                onClick={() => handleNavigation(item)}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Drawer open={moreDrawerOpen} onOpenChange={setMoreDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>More Options</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-2">
            {filteredMoreMenuItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start px-4 py-6 text-left"
                onClick={() => handleNavigation(item)}
              >
                <span className="flex items-center">
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </span>
              </Button>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-6 text-left text-red-500 hover:bg-red-50 hover:text-red-700"
              onClick={handleLogout}
            >
              <span className="flex items-center">
                <LogOut className="h-5 w-5" />
                <span className="ml-2">Log out</span>
              </span>
            </Button>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default BottomNav;
