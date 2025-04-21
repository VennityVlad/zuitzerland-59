
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const safeLocations = Array.isArray(locations) ? locations : [];

  if (!safeLocations.length) {
    return <div className="text-muted-foreground">No locations found</div>;
  }

  const handleLocationChange = (locationId: string) => {
    const location = safeLocations.find((loc) => loc.id === locationId);
    if (location) {
      onLocationChange(location);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm font-medium">Select location:</div>
      <Select
        value={selectedLocation?.id}
        onValueChange={handleLocationChange}
      >
        <SelectTrigger className="min-w-[280px]">
          <SelectValue placeholder="Select location..." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {safeLocations.map((location) => (
              <SelectItem 
                key={location.id} 
                value={location.id}
                className="flex items-center justify-between"
              >
                <span>{location.name}</span>
                {location.building && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({location.building}{location.floor ? `, Floor ${location.floor}` : ""})
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default LocationSelector;
