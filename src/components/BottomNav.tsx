
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, CalendarDays, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrivy } from "@privy-io/react-auth";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = usePrivy();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Close user menu when navigating
  useEffect(() => {
    setShowUserMenu(false);
  }, [location.pathname]);

  const navItems = [
    {
      label: "Home",
      icon: <Home className="h-6 w-6" />,
      path: "/",
    },
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
      label: "Profile",
      icon: <User className="h-6 w-6" />,
      onClick: () => setShowUserMenu(!showUserMenu),
      path: "/profile",
    },
  ];

  return (
    <>
      {/* User menu popup */}
      {showUserMenu && (
        <div className="fixed bottom-20 right-4 bg-white rounded-lg shadow-lg p-2 z-50 w-48 border">
          <div 
            className="p-2 hover:bg-gray-100 rounded-md cursor-pointer"
            onClick={() => navigate("/profile")}
          >
            <span className="text-sm">Profile</span>
          </div>
          <div 
            className="p-2 hover:bg-gray-100 rounded-md cursor-pointer text-red-500"
            onClick={() => logout()}
          >
            <span className="text-sm">Log out</span>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 h-16">
        <div className="grid grid-cols-4 h-full">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            
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
                  } else {
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
      
      {/* Bottom padding to prevent content from being hidden behind the nav bar */}
      <div className="h-16"></div>
    </>
  );
};

export default BottomNav;
