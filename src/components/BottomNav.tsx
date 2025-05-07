
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  CalendarDays,
  BookOpen,
  MoreHorizontal,
  User,
  LogOut,
  FileText,
} from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useMenuVisibility } from "@/hooks/useMenuVisibility";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = usePrivy();
  const [openSheet, setOpenSheet] = useState(false);
  const { isAdmin, showOnboarding } = useMenuVisibility(user?.id);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpenSheet(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
      <div className="flex items-center justify-around h-16">
        <Button
          variant="ghost"
          size="icon"
          className={`flex-1 flex-col items-center justify-center h-full rounded-none ${
            isActive("/book") ? "text-primary" : "text-gray-500"
          }`}
          onClick={() => navigate("/book")}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Book</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={`flex-1 flex-col items-center justify-center h-full rounded-none ${
            isActive("/events") ? "text-primary" : "text-gray-500"
          }`}
          onClick={() => navigate("/events")}
        >
          <CalendarDays className="h-5 w-5" />
          <span className="text-xs mt-1">Events</span>
        </Button>

        {showOnboarding && (
          <Button
            variant="ghost"
            size="icon"
            className={`flex-1 flex-col items-center justify-center h-full rounded-none ${
              isActive("/onboarding") ? "text-primary" : "text-gray-500"
            }`}
            onClick={() => navigate("/onboarding")}
          >
            <BookOpen className="h-5 w-5" />
            <span className="text-xs mt-1">Onboarding</span>
          </Button>
        )}

        <Sheet open={openSheet} onOpenChange={setOpenSheet}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="flex-1 flex-col items-center justify-center h-full rounded-none text-gray-500"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-xs mt-1">More</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto rounded-t-xl">
            <div className="flex flex-col space-y-2 py-4">
              {isAdmin && (
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => handleNavigation("/invoices")}
                >
                  <FileText className="mr-2 h-5 w-5" />
                  Invoices
                </Button>
              )}
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => handleNavigation("/profile")}
              >
                <User className="mr-2 h-5 w-5" />
                Profile
              </Button>
              <div className="pt-2 border-t border-gray-100">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-500"
                  onClick={() => logout()}
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Log out
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default BottomNav;
