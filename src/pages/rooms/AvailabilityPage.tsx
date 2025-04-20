
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PageTitle from "@/components/PageTitle";
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

        setLocations(data || []);
        if (data && data.length > 0) {
          setSelectedLocation(data[0]);
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error fetching locations",
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, [toast]);

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
              onLocationChange={setSelectedLocation}
            />
            
            {selectedLocation && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <AvailabilityCalendar locationId={selectedLocation.id} />
                </div>
                <div>
                  <AvailabilityControls 
                    locationId={selectedLocation.id} 
                    locationName={selectedLocation.name} 
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AvailabilityPage;
