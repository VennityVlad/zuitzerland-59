
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, FileText, Layers, Percent, User, CalendarDays, BarChart, Building, Users, LogOut, MoreHorizontal, CheckSquare, ContactRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getSettingEnabled } from "@/utils/settingsUtils";
import { usePaidInvoiceStatus } from "@/hooks/usePaidInvoiceStatus";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = usePrivy();
  const [isVisible, setIsVisible] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTimeoutRef = useRef<number | null>(null);
  
  const { hasPaidInvoice, isLoading: isPaidInvoiceLoading, isAdmin } = usePaidInvoiceStatus(user?.id);
  
  useEffect(() => {
    console.log("🧭 BottomNav - User status:", { 
      userId: user?.id, 
      hasPaidInvoice, 
      isAdmin, 
      isLoading: isPaidInvoiceLoading 
    });
    
    const checkFeatures = async () => {
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', ['show_onboarding_page', 'show_directory_page']);

        if (settingsError) throw settingsError;

        if (settingsData) {
          const onboardingSetting = settingsData.find(s => s.key === 'show_onboarding_page')?.value;
          const directorySetting = settingsData.find(s => s.key === 'show_directory_page')?.value;

          setShowOnboarding(getSettingEnabled(onboardingSetting));
          setShowDirectory(getSettingEnabled(directorySetting));
        }
      } catch (error) {
        console.error('Error checking features:', error);
      }
    };

    checkFeatures();
  }, [user?.id, hasPaidInvoice, isAdmin, isPaidInvoiceLoading]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      
      if (Math.abs(currentScrollY - lastScrollY.current) < 10) {
        return;
      }
      
      if (currentScrollY <= 0) {
        setIsVisible(true);
        lastScrollY.current = 0;
        return;
      }
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      lastScrollY.current = currentScrollY > 0 ? currentScrollY : 0;
      
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

  type NavItem = {
    name: string;
    icon: typeof Calendar;
    path: string;
    showAlways: boolean;
  };

  const nonAdminWithoutPaidInvoiceItems: NavItem[] = [
    {
      name: "Events",
      icon: Calendar,
      path: "/events",
      showAlways: true,
    },
    {
      name: "Book",
      icon: CalendarDays,
      path: "/book",
      showAlways: true,
    },
    {
      name: "Profile",
      icon: User,
      path: "/profile",
      showAlways: true,
    },
    {
      name: "Logout",
      icon: LogOut,
      path: "#logout",
      showAlways: true,
    }
  ];

  const nonAdminWithPaidInvoiceItems: NavItem[] = [
    {
      name: "Events",
      icon: Calendar,
      path: "/events",
      showAlways: true,
    },
    {
      name: "Book",
      icon: CalendarDays,
      path: "/book",
      showAlways: true,
    },
    ...(showOnboarding && hasPaidInvoice
      ? [{
          name: "Onboarding",
          icon: CheckSquare,
          path: "/onboarding",
          showAlways: true,
        }]
      : []),
    {
      name: "More",
      icon: MoreHorizontal,
      path: "#more",
      showAlways: true,
    },
  ];

  const moreMenuNavItemsNonAdmin = [
    {
      name: "Profile",
      icon: User,
      path: "/profile",
    },
    {
      name: "Logout",
      icon: LogOut,
      action: logout,
      isLogout: true,
    }
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

  const handleNavigation = (path: string) => {
    if (path === "#more") return;
    if (path === "#logout") {
      logout();
      return;
    }
    navigate(path);
  };

  return (
    <div className={cn(
      "fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 transition-transform duration-300",
      isVisible ? "translate-y-0" : "translate-y-full"
    )}>
      <div className="grid h-full grid-cols-4">
        {!isAdmin ? (
          <>
            {!hasPaidInvoice ? (
              nonAdminWithoutPaidInvoiceItems.map((item) => (
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
              ))
            ) : (
              <>
                {nonAdminWithPaidInvoiceItems.slice(0, 3).map((item) => (
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
                      {moreMenuNavItemsNonAdmin.map((item) =>
                        !item.isLogout ? (
                          <button
                            key={item.name}
                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100"
                            onClick={() => handleNavigation(item.path)}
                          >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                          </button>
                        ) : (
                          <button
                            key={item.name}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 rounded-md hover:bg-gray-100"
                            onClick={item.action}
                          >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                          </button>
                        )
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </>
            )}
          </>
        ) : (
          <>
            {[
              ...(() => {
                const mainNavItems: NavItem[] = [{
                  name: "Events",
                  icon: Calendar,
                  path: "/events",
                  showAlways: true,
                }, {
                  name: "Book",
                  icon: CalendarDays,
                  path: "/book",
                  showAlways: true,
                }];
                if (!isAdmin && showOnboarding && hasPaidInvoice) {
                  mainNavItems.push({
                    name: "Onboarding",
                    icon: CheckSquare,
                    path: "/onboarding",
                    showAlways: true,
                  });
                }
                if (showDirectory && hasPaidInvoice) {
                  mainNavItems.push({
                    name: "Directory",
                    icon: ContactRound,
                    path: "/directory",
                    showAlways: true,
                  });
                }
                mainNavItems.push(adminItems[0]);
                return mainNavItems.slice(0, 3);
              })()
            ].map((item) => (
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
                  {adminItems.slice(1).map((item) => (
                    <button
                      key={item.name}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100"
                      onClick={() => handleNavigation(item.path)}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </button>
                  ))}
                  <button
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 rounded-md hover:bg-gray-100"
                    onClick={logout}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>
    </div>
  );
};

export default BottomNav;
