
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

// Validation interval in milliseconds (default: 5 minutes)
const VALIDATION_INTERVAL = 5 * 60 * 1000;

export const useSessionValidator = () => {
  const { user, authenticated, logout } = usePrivy();
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidated, setLastValidated] = useState<Date | null>(null);

  const validateUserAccess = async () => {
    if (!user?.email) return true;
    
    try {
      setIsValidating(true);
      const { data, error } = await supabase.functions.invoke("validate-user-access", {
        body: { email: user.email }
      });

      if (error) {
        console.error("Error validating user access:", error);
        return true; // Assume valid in case of errors to prevent accidental logouts
      }

      if (data && data.revoked) {
        toast({
          title: "Access Revoked",
          description: "Your account access has been revoked. You will be logged out.",
          variant: "destructive",
        });
        
        // Wait a moment for the toast to be visible
        setTimeout(() => {
          logout();
        }, 2000);
        
        return false;
      }
      
      setLastValidated(new Date());
      return true;
    } catch (error) {
      console.error("Failed to validate user access:", error);
      return true; // Assume valid in case of errors
    } finally {
      setIsValidating(false);
    }
  };

  // Validate on component mount and when user changes
  useEffect(() => {
    if (authenticated && user?.email) {
      validateUserAccess();
    }
  }, [authenticated, user?.email]);

  // Set up periodic validation
  useEffect(() => {
    if (!authenticated || !user?.email) return;

    const intervalId = setInterval(() => {
      validateUserAccess();
    }, VALIDATION_INTERVAL);

    return () => clearInterval(intervalId);
  }, [authenticated, user?.email]);

  return {
    isValidating,
    lastValidated,
    validateUserAccess
  };
};

const SessionValidator = () => {
  useSessionValidator();
  return null; // This component doesn't render anything
};

export default SessionValidator;
