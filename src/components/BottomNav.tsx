
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { CalendarDays, Calendar, FileText, User, DollarSign } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const BottomNav = () => {
  const { user } = usePrivy();
  const [isAdmin, setIsAdmin] = useState(false);

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
                className={cn("mb-1 h-5 w-5", isActive && "fill-primary")}
              />
              <span>Events</span>
            </>
          )}
        </NavLink>

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

        {isAdmin ? (
          <NavLink
            to="/pricing"
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
                <DollarSign
                  className={cn("mb-1 h-5 w-5", isActive && "fill-primary/10")}
                />
                <span>Pricing</span>
              </>
            )}
          </NavLink>
        ) : (
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
        )}

        <NavLink
          to="/profile"
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
              <User
                className={cn("mb-1 h-5 w-5", isActive && "fill-primary/10")}
              />
              <span>Profile</span>
            </>
          )}
        </NavLink>
      </div>
    </div>
  );
};

export default BottomNav;
