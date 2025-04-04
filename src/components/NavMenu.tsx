import { usePrivy } from "@privy-io/react-auth";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  FileText, 
  LogOut, 
  CalendarDays, 
  ChevronDown, 
  Percent, 
  Layers,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  BarChart,
  Users,
  UserPlus,
  Building,
  Calendar,
  BedDouble
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import BottomNav from "./BottomNav";

const NavMenu = () => {
  const { logout, user } = usePrivy();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

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

  const menuItems = [
    {
      label: "Book",
      icon: <CalendarDays className="h-5 w-5" />,
      path: "/book",
    },
    {
      label: "Events",
      icon: <Calendar className="h-5 w-5" />,
      path: "/events",
    }
  ];

  if (isAdmin) {
    menuItems.push({
      label: "Invoices",
      icon: <FileText className="h-5 w-5" />,
      path: "/invoices",
    });
    
    menuItems.push({
      label: "Users",
      icon: <Users className="h-5 w-5" />,
      path: "/user-management",
    });
    
    menuItems.push({
      label: "Teams",
      icon: <Building className="h-5 w-5" />,
      path: "/teams",
    });
    
    menuItems.push({
      label: "Room Management",
      icon: <BedDouble className="h-5 w-5" />,
      path: "/room-management",
    });
  }

  const adminItems = [
    {
      label: "Reports",
      icon: <BarChart className="h-5 w-5" />,
      path: "/reports",
    },
    {
      label: "Discounts",
      icon: <Percent className="h-5 w-5" />,
      path: "/discounts",
    },
    {
      label: "Room Types",
      icon: <Layers className="h-5 w-5" />,
      path: "/room-types",
    }
  ];

  if (isAdmin) {
    menuItems.push(...adminItems);
  }

  const NavItem = ({ item }: { item: { label: string; icon: JSX.Element; path: string } }) => {
    const isActive = location.pathname === item.path;
    
    return (
      <Button
        variant="ghost"
        size="lg"
        className={cn(
          "w-full justify-start gap-3 px-3 py-6 text-base font-medium transition-colors",
          isActive 
            ? "bg-primary/10 text-primary" 
            : "text-gray-600 hover:bg-primary/5 hover:text-primary"
        )}
        onClick={() => navigate(item.path)}
      >
        {item.icon}
        <span className={cn("flex-1 text-left", !sidebarOpen && "hidden")}>
          {item.label}
        </span>
      </Button>
    );
  };

  if (isMobile) {
    return <BottomNav />;
  }

  return (
    <>
      <div className={cn(
        "fixed top-0 left-0 z-40 h-full bg-white shadow-lg transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="flex items-center justify-between p-4 border-b">
          <img 
            src="/lovable-uploads/e2be13a0-6853-41c8-aa7c-51ab5d5dd119.png" 
            alt="Logo" 
            className="h-10 w-10"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-primary"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="flex flex-col p-3 space-y-1">
          {menuItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <NavItem 
            item={{
              label: "Profile",
              icon: <User className="h-5 w-5" />,
              path: "/profile"
            }} 
          />
          <div className="border-t my-2"></div>
          <Button 
            variant="ghost" 
            size="lg"
            className={cn(
              "w-full justify-start gap-3 px-3 py-6 text-base font-medium text-red-500 hover:bg-red-50 hover:text-red-700",
              !sidebarOpen && "justify-center"
            )}
            onClick={() => logout()}
          >
            <LogOut className="h-5 w-5" />
            <span className={cn("flex-1 text-left", !sidebarOpen && "hidden")}>
              Log out
            </span>
          </Button>
        </div>
      </div>

      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarOpen ? "ml-64" : "ml-20"
      )} />
    </>
  );
};

export default NavMenu;
