import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, Calendar, Users, FileText, Settings, LogOut } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const NavMenu: React.FC = () => {
  const location = useLocation();
  const { logout, authenticated } = usePrivy();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (authenticated) {
        const { data: user, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Error fetching user:", error);
          return;
        }

        if (user?.user?.id) {
          const { data, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.user.id)
            .single();

          if (roleError) {
            console.error("Error fetching user role:", roleError);
            return;
          }

          setIsAdmin(data?.role === 'admin');
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [authenticated]);

  const linkClass = "flex items-center gap-2 rounded-md px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800";
  const activeLinkClass = "flex items-center gap-2 rounded-md px-4 py-2 font-medium text-gray-900 bg-gray-100";

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout Failed",
        description: "There was an error logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="flex flex-col space-y-2 w-full">
      <Link
        to="/"
        className={location.pathname === '/' ? activeLinkClass : linkClass}
      >
        <HomeIcon className="h-5 w-5 mr-2" />
        Dashboard
      </Link>

      <Link
        to="/book"
        className={location.pathname === '/book' ? activeLinkClass : linkClass}
      >
        <Calendar className="h-5 w-5 mr-2" />
        Book a Stay
      </Link>

      {isAdmin && (
        <>
          <Link
            to="/invoices"
            className={location.pathname === '/invoices' ? activeLinkClass : linkClass}
          >
            <FileText className="h-5 w-5 mr-2" />
            Invoices
          </Link>

          <Link
            to="/users"
            className={location.pathname === '/users' ? activeLinkClass : linkClass}
          >
            <Users className="h-5 w-5 mr-2" />
            Users
          </Link>

          <Link
            to="/settings"
            className={location.pathname === '/settings' ? activeLinkClass : linkClass}
          >
            <Settings className="h-5 w-5 mr-2" />
            Settings
          </Link>
          <Link 
            to="/room-management" 
            className={location.pathname === '/room-management' ? activeLinkClass : linkClass}
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Room Management
          </Link>
        </>
      )}

      <button onClick={handleLogout} className={linkClass}>
        <LogOut className="h-5 w-5 mr-2" />
        Logout
      </button>
    </nav>
  );
};

export default NavMenu;
