
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Home } from "lucide-react";
import HousingPreferencesForm from "./HousingPreferencesForm";

type HousingPreferencesPanelProps = {
  profileId: string;
  userEmail: string | null;
  userName: string | null;
  onClose: () => void;
};

const HousingPreferencesPanel = ({ profileId, userEmail, userName, onClose }: HousingPreferencesPanelProps) => {
  return (
    <>
      <SheetHeader className="pb-4">
        <SheetTitle className="flex items-center gap-2">
          <Home className="h-5 w-5 text-primary" />
          Housing Preferences
        </SheetTitle>
        <SheetDescription>
          Help us match you with compatible roommates by sharing your preferences.
        </SheetDescription>
      </SheetHeader>
      
      <HousingPreferencesForm 
        profileId={profileId}
        userEmail={userEmail}
        userName={userName}
        onSuccess={onClose}
      />
    </>
  );
};

export default HousingPreferencesPanel;
