
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Home } from "lucide-react";
import HousingPreferencesPanel from "./HousingPreferencesPanel";

type HousingPreferencesButtonProps = {
  profileId: string;
  userEmail: string | null;
  userName: string | null;
};

const HousingPreferencesButton = ({ profileId, userEmail, userName }: HousingPreferencesButtonProps) => {
  const [open, setOpen] = useState(false);

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
