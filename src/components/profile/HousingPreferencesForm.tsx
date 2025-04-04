
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type HousingPreference = {
  name: string;
  email: string;
  preferredRoommates: string;
  gender: string;
  sameGenderPreference: string;
  sleepingHabitsImportance: number;
  sleepingHabits: string[];
  livingHabitsImportance: number;
  livingHabits: string[];
  socialPreferencesImportance: number;
  socialPreferences: string[];
  additionalNotes: string;
};

type HousingPreferencesFormProps = {
  profileId: string;
  userEmail: string | null;
  userName: string | null;
  onSuccess?: () => void;
};

// Options for form selections
const genderOptions = [
  "Male", 
  "Female", 
  "Non-binary", 
  "Prefer not to say"
];

const yesNoOptions = [
  "Yes", 
  "No", 
  "No preference"
];

const sleepingHabitsOptions = [
  "Early riser (before 7am)",
  "Morning person (7am-9am)",
  "Night owl (sleep after midnight)",
  "Light sleeper",
  "Heavy sleeper",
  "Need silence when sleeping",
  "Can sleep with noise",
  "Prefer cool room temperature",
  "Prefer warm room temperature"
];

const livingHabitsOptions = [
  "Very tidy",
  "Somewhat tidy",
  "Somewhat messy",
  "Very messy",
  "Prefer frequent cleaning",
  "Clean occasionally",
  "Cook frequently",
  "Rarely cook",
  "Work from home often",
  "Rarely at home"
];

const socialPreferencesOptions = [
  "Very social, enjoy hosting",
  "Social but prefer quiet time too",
  "Prefer quiet, private space",
  "Early sleeper (before 10pm)",
  "Late sleeper (after midnight)",
  "Often have guests over",
  "Rarely have guests over"
];

const HousingPreferencesForm = ({ profileId, userEmail, userName, onSuccess }: HousingPreferencesFormProps) => {
  const [preferences, setPreferences] = useState<HousingPreference>({
    name: userName || "",
    email: userEmail || "",
    preferredRoommates: "",
    gender: "",
    sameGenderPreference: "",
    sleepingHabitsImportance: 3,
    sleepingHabits: [],
    livingHabitsImportance: 3,
    livingHabits: [],
    socialPreferencesImportance: 3,
    socialPreferences: [],
    additionalNotes: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    const fetchExistingPreferences = async () => {
      if (!profileId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('housing_preferences')
          .eq('id', profileId)
          .single();
        
        if (error) throw error;
        
        if (data && data.housing_preferences) {
          setPreferences({
            ...preferences,
            // Fixed: Instead of spreading data.housing_preferences which might not be an object type,
            // we use type assertion and handle each property individually
            ...(data.housing_preferences as HousingPreference)
          });
        }
      } catch (error: any) {
        console.error("Error fetching preferences:", error);
        toast({
          variant: "destructive",
          title: "Error loading preferences",
          description: error.message
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchExistingPreferences();
  }, [profileId]);

  const handleInputChange = (field: keyof HousingPreference, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field: keyof HousingPreference, value: string) => {
    setPreferences(prev => {
      const currentValues = prev[field] as string[];
      const maxSelections = field === 'livingHabits' ? 6 : field === 'socialPreferences' ? 5 : undefined;
      
      if (currentValues.includes(value)) {
        return {
          ...prev,
          [field]: currentValues.filter(item => item !== value)
        };
      } else if (maxSelections && currentValues.length >= maxSelections) {
        toast({
          variant: "destructive",
          title: "Maximum selections reached",
          description: `You can only select up to ${maxSelections} options for this question.`
        });
        return prev;
      } else {
        return {
          ...prev,
          [field]: [...currentValues, value]
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!preferences.name || !preferences.email || !preferences.gender) {
      toast({
        variant: "destructive",
        title: "Required fields missing",
        description: "Please fill in all required fields: Name, Email, and Gender."
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          housing_preferences: preferences
        })
        .eq('id', profileId);
      
      if (error) throw error;
      
      toast({
        title: "Preferences saved",
        description: "Your housing preferences have been saved successfully."
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast({
        variant: "destructive",
        title: "Error saving preferences",
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-8">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-base font-medium after:content-['*'] after:text-red-500 after:ml-1">
            Name
          </Label>
          <Input 
            id="name" 
            value={preferences.name} 
            onChange={(e) => handleInputChange('name', e.target.value)}
            disabled={loading}
            required
          />
        </div>
        
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-base font-medium after:content-['*'] after:text-red-500 after:ml-1">
            Email (must be the same email you've used for application and acceptance)
          </Label>
          <Input 
            id="email" 
            type="email" 
            value={preferences.email} 
            onChange={(e) => handleInputChange('email', e.target.value)}
            disabled={loading}
            required
          />
        </div>
        
        {/* Preferred roommates */}
        <div className="space-y-2">
          <Label htmlFor="preferredRoommates" className="text-base font-medium">
            Preferred roommate(s) - make sure they also request you!
          </Label>
          <Input 
            id="preferredRoommates" 
            value={preferences.preferredRoommates} 
            onChange={(e) => handleInputChange('preferredRoommates', e.target.value)}
            disabled={loading}
            placeholder="Enter names separated by commas"
          />
        </div>
        
        {/* Gender */}
        <div className="space-y-2">
          <Label className="text-base font-medium after:content-['*'] after:text-red-500 after:ml-1">
            Gender
          </Label>
          <RadioGroup 
            value={preferences.gender} 
            onValueChange={(value) => handleInputChange('gender', value)}
            className="grid grid-cols-2 gap-2"
            required
          >
            {genderOptions.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`gender-${option}`} />
                <Label htmlFor={`gender-${option}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        {/* Same gender preference */}
        <div className="space-y-2">
          <Label className="text-base font-medium">
            Do you prefer roommate(s) of the same gender?
          </Label>
          <RadioGroup 
            value={preferences.sameGenderPreference} 
            onValueChange={(value) => handleInputChange('sameGenderPreference', value)}
            className="grid grid-cols-3 gap-2"
          >
            {yesNoOptions.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`gender-pref-${option}`} />
                <Label htmlFor={`gender-pref-${option}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        {/* Sleeping habits importance */}
        <div className="space-y-4">
          <Label className="text-base font-medium">
            How important are sleeping habits for your roommate matching?
          </Label>
          <div className="space-y-4">
            <Slider 
              value={[preferences.sleepingHabitsImportance]} 
              onValueChange={(value) => handleInputChange('sleepingHabitsImportance', value[0])}
              min={1} 
              max={5} 
              step={1}
              disabled={loading}
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Not important</span>
              <span>Very important</span>
            </div>
          </div>
        </div>
        
        {/* Sleeping Habits */}
        <div className="space-y-4">
          <Label className="text-base font-medium">
            Sleeping Habits
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sleepingHabitsOptions.map((option) => (
              <div key={option} className="flex items-start space-x-2">
                <Checkbox 
                  id={`sleeping-habit-${option}`} 
                  checked={preferences.sleepingHabits.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleCheckboxChange('sleepingHabits', option);
                    } else {
                      handleCheckboxChange('sleepingHabits', option);
                    }
                  }}
                  disabled={loading}
                />
                <Label htmlFor={`sleeping-habit-${option}`} className="text-sm leading-tight">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Living habits importance */}
        <div className="space-y-4">
          <Label className="text-base font-medium">
            How important are living habits for your roommate matching?
          </Label>
          <div className="space-y-4">
            <Slider 
              value={[preferences.livingHabitsImportance]} 
              onValueChange={(value) => handleInputChange('livingHabitsImportance', value[0])}
              min={1} 
              max={5} 
              step={1}
              disabled={loading}
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Not important</span>
              <span>Very important</span>
            </div>
          </div>
        </div>
        
        {/* Living Habits */}
        <div className="space-y-4">
          <Label className="text-base font-medium">
            Living Habits (maximum 6)
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {livingHabitsOptions.map((option) => (
              <div key={option} className="flex items-start space-x-2">
                <Checkbox 
                  id={`living-habit-${option}`} 
                  checked={preferences.livingHabits.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleCheckboxChange('livingHabits', option);
                    } else {
                      handleCheckboxChange('livingHabits', option);
                    }
                  }}
                  disabled={loading || (!preferences.livingHabits.includes(option) && preferences.livingHabits.length >= 6)}
                />
                <Label htmlFor={`living-habit-${option}`} className="text-sm leading-tight">
                  {option}
                </Label>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Selected: {preferences.livingHabits.length}/6
          </p>
        </div>
        
        {/* Social preferences importance */}
        <div className="space-y-4">
          <Label className="text-base font-medium">
            How important are social preferences for your roommate matching?
          </Label>
          <div className="space-y-4">
            <Slider 
              value={[preferences.socialPreferencesImportance]} 
              onValueChange={(value) => handleInputChange('socialPreferencesImportance', value[0])}
              min={1} 
              max={5} 
              step={1}
              disabled={loading}
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Not important</span>
              <span>Very important</span>
            </div>
          </div>
        </div>
        
        {/* Social Preferences */}
        <div className="space-y-4">
          <Label className="text-base font-medium">
            Social Preferences (maximum 5)
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {socialPreferencesOptions.map((option) => (
              <div key={option} className="flex items-start space-x-2">
                <Checkbox 
                  id={`social-pref-${option}`} 
                  checked={preferences.socialPreferences.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleCheckboxChange('socialPreferences', option);
                    } else {
                      handleCheckboxChange('socialPreferences', option);
                    }
                  }}
                  disabled={loading || (!preferences.socialPreferences.includes(option) && preferences.socialPreferences.length >= 5)}
                />
                <Label htmlFor={`social-pref-${option}`} className="text-sm leading-tight">
                  {option}
                </Label>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Selected: {preferences.socialPreferences.length}/5
          </p>
        </div>
        
        {/* Additional Notes */}
        <div className="space-y-2">
          <Label htmlFor="additionalNotes" className="text-base font-medium">
            Is there anything else we should consider?
          </Label>
          <Textarea 
            id="additionalNotes" 
            value={preferences.additionalNotes} 
            onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
            disabled={loading}
            placeholder="Additional notes about your housing preferences..."
            maxLength={1000}
            rows={5}
          />
          <p className="text-xs text-muted-foreground text-right">
            Character limit: {preferences.additionalNotes.length}/1000
          </p>
        </div>
      </div>
      
      <Button 
        type="submit"
        disabled={loading || isSubmitting || !preferences.name || !preferences.email || !preferences.gender}
        className="w-full"
      >
        <Save className="h-4 w-4 mr-2" />
        {isSubmitting ? "Saving..." : "Save Preferences"}
      </Button>
    </form>
  );
};

export default HousingPreferencesForm;
