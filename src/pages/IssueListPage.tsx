
import { useMenuVisibility } from "@/hooks/useMenuVisibility";
import { usePrivy } from "@privy-io/react-auth";
import { Navigate } from "react-router-dom";
import IssueList from "@/components/issues/IssueList";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const IssueListPage = () => {
  const { ready, authenticated, user } = usePrivy();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: userRole, error: roleError } = await supabase
          .rpc('get_user_role')
          .single();

        if (roleError) throw roleError;
        
        setIsAdmin(userRole === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user?.id]);

  // Wait for Privy to initialize
  if (!ready || isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (ready && !authenticated) {
    return <Navigate to="/signin?redirect=/issues" replace />;
  }

  // Redirect to report page if not admin
  if (!isAdmin) {
    return <Navigate to="/issues/report" replace />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Issue Reports</h1>
        <Button asChild>
          <Link to="/issues/report" className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            New Report
          </Link>
        </Button>
      </div>
      <IssueList />
    </div>
  );
};

export default IssueListPage;
