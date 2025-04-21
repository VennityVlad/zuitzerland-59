
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle } from "@/components/PageTitle";
import AvailabilityCalendar from "@/components/rooms/AvailabilityCalendar";
import LocationSelector from "@/components/rooms/LocationSelector";
import AvailabilityControls from "@/components/rooms/AvailabilityControls";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Location = {
  id: string;
  name: string;
  type: string;
  building: string | null;
  floor: string | null;
};

const AvailabilityPage = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("locations")
          .select("id, name, type, building, floor")
          .order("name", { ascending: true });

        if (error) throw error;
        const locationData = Array.isArray(data) ? data : [];
        setLocations(locationData);

        if (locationData.length > 0) {
          setSelectedLocation(locationData[0]);
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error fetching locations",
          description: error.message,
        });
        setLocations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, [toast]);

  const handleLocationChange = (location: Location) => {
    setSelectedLocation(location);
    setCalendarRefreshKey((k) => k + 1);
  };

  const handleAvailabilityChange = useCallback(() => {
    setCalendarRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <PageTitle title="Availability Management" />

      <div className="grid gap-6">
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-full" />
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Skeleton className="h-[400px] w-full" />
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <LocationSelector
              locations={locations}
              selectedLocation={selectedLocation}
              onLocationChange={handleLocationChange}
            />

            {selectedLocation && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <AvailabilityCalendar 
                    locationId={selectedLocation.id} 
                    refreshKey={calendarRefreshKey}
                  />
                </div>
                <div>
                  <AvailabilityControls
                    locationId={selectedLocation.id}
                    locationName={selectedLocation.name}
                    onAvailabilityChange={handleAvailabilityChange}
                  />
                </div>
              </div>
            )}

            {!selectedLocation && locations.length > 0 && (
              <div className="text-center p-8">
                <p>Please select a location to manage availability.</p>
              </div>
            )}

            {locations.length === 0 && !isLoading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center p-8">
                    <p className="text-muted-foreground">No locations found. Please add locations first.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AvailabilityPage;
