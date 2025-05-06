
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { CalendarDays, Calendar, FileText, User, DollarSign, MoreHorizontal, LogOut, Users, BookOpen } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useMenuVisibility } from "@/hooks/useMenuVisibility";

const BottomNav = () => {
  const { user, logout } = usePrivy();
  const [isAdmin, setIsAdmin] = useState(false);
  const { showOnboarding } = useMenuVisibility(user?.id);

  useEffect(() => {
    const checkAdmin = async () => {
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
        console.error('Error checking admin status:', error);
      }
    };

    checkAdmin();
  }, [user?.id]);

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full border-t bg-white">
      <div className="grid h-14 grid-cols-4 items-center">
        {/* Events - Common for both admin and non-admin */}
        <NavLink
          to="/events"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center text-xs",
              isActive
                ? "text-primary"
                : "text-gray-500 hover:text-primary"
            )
          }
        >
          {({ isActive }) => (
            <>
              <Calendar
                className={cn("mb-1 h-5 w-5", isActive && "fill-primary/10")}
              />
              <span>Events</span>
            </>
          )}
        </NavLink>

        {isAdmin ? (
          <>
            {/* Invoices (admin only) */}
            <NavLink
              to="/invoices"
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center text-xs",
                  isActive
                    ? "text-primary"
                    : "text-gray-500 hover:text-primary"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <FileText
                    className={cn("mb-1 h-5 w-5", isActive && "fill-primary/10")}
                  />
                  <span>Invoices</span>
                </>
              )}
            </NavLink>

            {/* Users (admin only) */}
            <NavLink
              to="/user-management"
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center text-xs",
                  isActive
                    ? "text-primary"
                    : "text-gray-500 hover:text-primary"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Users
                    className={cn("mb-1 h-5 w-5", isActive && "fill-primary/10")}
                  />
                  <span>Users</span>
                </>
              )}
            </NavLink>
          </>
        ) : (
          <>
            {/* Book (non-admin only) */}
            <NavLink
              to="/book"
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center text-xs",
                  isActive
                    ? "text-primary"
                    : "text-gray-500 hover:text-primary"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <CalendarDays
                    className={cn("mb-1 h-5 w-5", isActive && "fill-primary/10")}
                  />
                  <span>Book</span>
                </>
              )}
            </NavLink>

            {/* Onboarding (non-admin only) */}
            {showOnboarding && (
              <NavLink
                to="/onboarding"
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center text-xs",
                    isActive
                      ? "text-primary"
                      : "text-gray-500 hover:text-primary"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <BookOpen
                      className={cn("mb-1 h-5 w-5", isActive && "fill-primary/10")}
                    />
                    <span>Onboarding</span>
                  </>
                )}
              </NavLink>
            )}
          </>
        )}

        {/* More Menu for both admin and non-admin */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center text-xs text-gray-500 hover:text-primary">
              <MoreHorizontal className="mb-1 h-5 w-5" />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0">
            <Sidebar collapsible="none" className="border-none shadow-none">
              <SidebarMenu>
                {isAdmin ? (
                  // Admin menu items
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <NavLink to="/book">
                          <CalendarDays className="h-4 w-4 mr-2" />
                          Book
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <NavLink to="/pricing">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Pricing
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <NavLink to="/reports">
                          <FileText className="h-4 w-4 mr-2" />
                          Reports
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <NavLink to="/settings">
                          <FileText className="h-4 w-4 mr-2" />
                          Settings
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                ) : (
                  // Non-admin menu items
                  <>
                    {showOnboarding ? null : (
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <NavLink to="/onboarding">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Onboarding
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <NavLink to="/invoices">
                          <FileText className="h-4 w-4 mr-2" />
                          Invoices
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
                
                {/* Common menu items for both admin and non-admin */}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/profile">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <div className="border-t my-2"></div>
                
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => logout()} className="text-red-500 hover:text-red-700">
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </Sidebar>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default BottomNav;
