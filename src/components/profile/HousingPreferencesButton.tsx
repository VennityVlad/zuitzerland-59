
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

type HousingPreferencesButtonProps = {
  profileId: string;
  userEmail: string | null;
  userName: string | null;
};

const HousingPreferencesButton = ({ profileId, userEmail, userName }: HousingPreferencesButtonProps) => {
  const navigate = useNavigate();

  const handleButtonClick = () => {
    // Navigate to the dedicated page
    navigate('/housing-preferences');
  };

  return (
    <Button 
      onClick={handleButtonClick}
      variant="outline"
      className="flex items-center gap-2"
    >
      <Home className="h-4 w-4" />
      Housing Preferences
    </Button>
  );
};

export default HousingPreferencesButton;
