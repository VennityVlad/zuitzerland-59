
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

type Location = {
  id: string;
  name: string;
  type: string;
  building: string | null;
  floor: string | null;
};

type LocationSelectorProps = {
  locations: Location[];
  selectedLocation: Location | null;
  onLocationChange: (location: Location) => void;
};

const LocationSelector = ({
  locations,
  selectedLocation,
  onLocationChange,
}: LocationSelectorProps) => {
  const [open, setOpen] = useState(false);
  
  // Ensure locations is always an array
  const safeLocations = Array.isArray(locations) ? locations : [];

  if (!safeLocations.length) {
    return <div className="text-muted-foreground">No locations found</div>;
  }

  const getLocationTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case "apartment":
        return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">Apartment</Badge>;
      case "meeting room":
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-200">Meeting Room</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm font-medium">Select location:</div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="min-w-[280px] justify-between"
          >
            {selectedLocation ? selectedLocation.name : "Select location..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="min-w-[280px] p-0">
          <Command>
            <CommandInput placeholder="Search location..." />
            <CommandEmpty>No location found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {safeLocations.map((location) => (
                <CommandItem
                  key={location.id}
                  value={location.id}
                  onSelect={() => {
                    onLocationChange(location);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between"
                >
                  <div>
                    <span>{location.name}</span>
                    {location.building && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({location.building}{location.floor ? `, Floor ${location.floor}` : ""})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getLocationTypeBadge(location.type)}
                    {selectedLocation?.id === location.id && (
                      <Check className="h-4 w-4" />
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default LocationSelector;
