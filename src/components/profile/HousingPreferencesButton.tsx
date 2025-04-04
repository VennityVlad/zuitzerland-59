
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Home } from "lucide-react";
import HousingPreferencesPanel from "./HousingPreferencesPanel";
import { useLocation, useNavigate } from "react-router-dom";

type HousingPreferencesButtonProps = {
  profileId: string;
  userEmail: string | null;
  userName: string | null;
};

const HousingPreferencesButton = ({ profileId, userEmail, userName }: HousingPreferencesButtonProps) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Auto-open the panel if directed via URL parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('openHousingPreferences') === 'true') {
      setOpen(true);
    }
  }, [location.search]);

  const handleButtonClick = () => {
    // Navigate to the dedicated page instead of opening the panel
    navigate('/housing-preferences');
  };

  return (
    <>
      <Button 
        onClick={handleButtonClick}
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
