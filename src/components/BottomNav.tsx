
import { usePrivy } from "@privy-io/react-auth";
import { useState, useEffect } from "react";
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
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <div className="flex items-center justify-around h-16">
          {filteredMainNavItems.map((item, index) => {
            const isActive = item.path ? location.pathname === item.path : false;
            return (
              <button
                key={index}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full p-1",
                  isActive ? "text-primary" : "text-gray-500"
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
