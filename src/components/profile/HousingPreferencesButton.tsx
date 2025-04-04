
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Home } from "lucide-react";
import HousingPreferencesPanel from "./HousingPreferencesPanel";
import { useLocation } from "react-router-dom";

type HousingPreferencesButtonProps = {
  profileId: string;
  userEmail: string | null;
  userName: string | null;
};

const HousingPreferencesButton = ({ profileId, userEmail, userName }: HousingPreferencesButtonProps) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Auto-open the panel if directed via URL parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('openHousingPreferences') === 'true') {
      setOpen(true);
    }
  }, [location.search]);

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Home className="h-4 w-4" />
        Housing Preferences
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-lg w-full overflow-y-auto">
          <HousingPreferencesPanel 
            profileId={profileId} 
            userEmail={userEmail}
            userName={userName}
            onClose={() => setOpen(false)} 
          />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default HousingPreferencesButton;
