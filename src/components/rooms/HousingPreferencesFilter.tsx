
import React, { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList,
  CommandSeparator
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type FilterOption = {
  category: string;
  value: string;
  label: string;
};

export type PreferenceFilters = Record<string, string[]>;

interface HousingPreferencesFilterProps {
  onFilterChange: (filters: PreferenceFilters) => void;
}

// Define preference options based on the housing preferences form
const preferenceOptions: FilterOption[] = [
  // Gender
  { category: "gender", value: "Male", label: "Male" },
  { category: "gender", value: "Female", label: "Female" },
  { category: "gender", value: "Non-binary", label: "Non-binary" },
  
  // Same gender preference
  { category: "sameGenderPreference", value: "Yes", label: "Prefers same gender" },
  { category: "sameGenderPreference", value: "No", label: "Open to mixed gender" },
  
  // Sleep habits
  { category: "sleepingHabits", value: "Early riser (before 7am)", label: "Early Riser" },
  { category: "sleepingHabits", value: "Morning person (7am-9am)", label: "Morning Person" },
  { category: "sleepingHabits", value: "Night owl (sleep after midnight)", label: "Night Owl" },
  { category: "sleepingHabits", value: "Light sleeper", label: "Light Sleeper" },
  { category: "sleepingHabits", value: "Heavy sleeper", label: "Heavy Sleeper" },
  { category: "sleepingHabits", value: "Need silence when sleeping", label: "Needs Silence" },
  { category: "sleepingHabits", value: "Can sleep with noise", label: "Tolerates Noise" },
  
  // Noise preferences
  { category: "livingHabits", value: "Very tidy", label: "Very Tidy" },
  { category: "livingHabits", value: "Somewhat tidy", label: "Somewhat Tidy" },
  { category: "livingHabits", value: "Somewhat messy", label: "Somewhat Messy" },
  { category: "livingHabits", value: "Very messy", label: "Very Messy" },
  { category: "livingHabits", value: "Prefer frequent cleaning", label: "Frequent Cleaner" },
  { category: "livingHabits", value: "Clean occasionally", label: "Occasional Cleaner" },
  
  // Social preferences
  { category: "socialPreferences", value: "Very social, enjoy hosting", label: "Very Social" },
  { category: "socialPreferences", value: "Social but prefer quiet time too", label: "Balanced Social/Quiet" },
  { category: "socialPreferences", value: "Prefer quiet, private space", label: "Prefers Privacy" },
  { category: "socialPreferences", value: "Often have guests over", label: "Has Guests Often" },
  { category: "socialPreferences", value: "Rarely have guests over", label: "Rarely Has Guests" },
];

// Group options by category
const groupedOptions: Record<string, FilterOption[]> = preferenceOptions.reduce((acc, option) => {
  if (!acc[option.category]) {
    acc[option.category] = [];
  }
  acc[option.category].push(option);
  return acc;
}, {} as Record<string, FilterOption[]>);

// Category display names
const categoryLabels: Record<string, string> = {
  gender: "Gender",
  sameGenderPreference: "Room Sharing Preference",
  sleepingHabits: "Sleep Schedule",
  livingHabits: "Cleanliness",
  socialPreferences: "Social Preferences"
};

const HousingPreferencesFilter = ({ onFilterChange }: HousingPreferencesFilterProps) => {
  const [open, setOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<PreferenceFilters>({});
  
  const handleSelect = (option: FilterOption) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      
      if (!newFilters[option.category]) {
        newFilters[option.category] = [];
      }
      
      // Toggle selection
      if (newFilters[option.category].includes(option.value)) {
        newFilters[option.category] = newFilters[option.category].filter(
          val => val !== option.value
        );
        
        // Remove empty categories
        if (newFilters[option.category].length === 0) {
          delete newFilters[option.category];
        }
      } else {
        newFilters[option.category].push(option.value);
      }
      
      return newFilters;
    });
  };
  
  const clearFilters = () => {
    setSelectedFilters({});
    onFilterChange({});
  };
  
  const applyFilters = () => {
    onFilterChange(selectedFilters);
    setOpen(false);
  };

  // Count total selected filters
  const selectedCount = Object.values(selectedFilters).reduce(
    (count, values) => count + values.length, 
    0
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 border-dashed flex gap-1 px-3"
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Preferences</span>
          {selectedCount > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-1 rounded-sm px-1 font-normal lg:hidden"
            >
              {selectedCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search preferences..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {Object.keys(groupedOptions).map((category) => (
              <CommandGroup key={category} heading={categoryLabels[category] || category}>
                {groupedOptions[category].map((option) => {
                  const isSelected = selectedFilters[category]?.includes(option.value);
                  return (
                    <CommandItem
                      key={`${category}-${option.value}`}
                      onSelect={() => handleSelect(option)}
                      className={cn(
                        "flex items-center gap-2",
                        isSelected ? "bg-muted/50 font-medium" : ""
                      )}
                    >
                      <div
                        className={cn(
                          "h-4 w-4 border rounded-sm",
                          isSelected 
                            ? "bg-primary border-primary flex items-center justify-center" 
                            : "border-muted-foreground"
                        )}
                      >
                        {isSelected && (
                          <span className="text-[10px] text-primary-foreground">✓</span>
                        )}
                      </div>
                      <span>{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
            <CommandSeparator />
            <div className="p-2 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={clearFilters}
                disabled={selectedCount === 0}
              >
                <X className="mr-1 h-3 w-3" />
                Clear filters
              </Button>
              <Button
                size="sm"
                className="text-xs"
                onClick={applyFilters}
              >
                Apply filters
              </Button>
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default HousingPreferencesFilter;
