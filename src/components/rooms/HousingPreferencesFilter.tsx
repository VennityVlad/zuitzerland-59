
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

// Define common preference categories and options
const preferenceOptions: FilterOption[] = [
  // Sleep habits
  { category: "sleepSchedule", value: "early_riser", label: "Early Riser" },
  { category: "sleepSchedule", value: "night_owl", label: "Night Owl" },
  { category: "sleepSchedule", value: "flexible", label: "Flexible Schedule" },
  
  // Noise preferences
  { category: "noisePreference", value: "quiet", label: "Prefers Quiet" },
  { category: "noisePreference", value: "moderate", label: "Moderate Noise OK" },
  { category: "noisePreference", value: "social", label: "Social Environment" },
  
  // Cleanliness
  { category: "cleanliness", value: "very_clean", label: "Very Clean" },
  { category: "cleanliness", value: "tidy", label: "Tidy" },
  { category: "cleanliness", value: "relaxed", label: "Relaxed About Cleaning" },
  
  // Personality
  { category: "personality", value: "introvert", label: "Introvert" },
  { category: "personality", value: "extrovert", label: "Extrovert" },
  { category: "personality", value: "ambivert", label: "Ambivert" },
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
  sleepSchedule: "Sleep Schedule",
  noisePreference: "Noise Preference",
  cleanliness: "Cleanliness",
  personality: "Personality Type"
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
