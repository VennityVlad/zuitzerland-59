
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building, Home, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import RoomSkeleton from "@/components/rooms/RoomSkeleton";
import RoomDetailView from "@/components/rooms/RoomDetailView";
import { CreateLocationSheet } from "@/components/rooms/CreateApartmentSheet";
import { Badge } from "@/components/ui/badge";

type Location = {
  id: string;
  name: string;
  building: string | null;
  floor: string | null;
  description: string | null;
  max_occupancy: number | null;
  type: string;
  bedrooms?: Bedroom[];
};

type Bedroom = {
  id: string;
  location_id: string;
  name: string;
  description: string | null;
  beds?: Bed[];
};

type Bed = {
  id: string;
  bedroom_id: string;
  name: string;
  bed_type: string;
  description: string | null;
};

const LocationsPage = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [addLocationSheetOpen, setAddLocationSheetOpen] = useState(false);
  const [editLocationSheetOpen, setEditLocationSheetOpen] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchLocations();
  }, []);
  
  const fetchLocations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setLocations(data as unknown as Location[]);
      setLoading(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching locations",
        description: error.message,
      });
      setLoading(false);
    }
  };
  
  const handleDeleteLocation = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will also delete all bedrooms and beds within this location.`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Location deleted",
        description: `${name} has been deleted.`,
      });
      
      fetchLocations();
      
      if (selectedLocation && selectedLocation.id === id) {
        setSelectedLocation(null);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting location",
        description: error.message,
      });
    }
  };
  
  const handleSelectLocation = async (location: Location) => {
    setSelectedLocation(null);
    
    try {
      // Fetch bedrooms
      const { data: bedroomsData, error: bedroomsError } = await supabase
        .from('bedrooms')
        .select('*')
        .eq('location_id', location.id)
        .order('name');
      
      if (bedroomsError) throw bedroomsError;
      
      const bedrooms = bedroomsData as unknown as Bedroom[];
      
      // Fetch beds for each bedroom
      const bedroomsWithBeds = [...bedrooms];
      
      for (const bedroom of bedroomsWithBeds) {
        const { data: bedsData, error: bedsError } = await supabase
          .from('beds')
          .select('*')
          .eq('bedroom_id', bedroom.id)
          .order('name');
        
        if (bedsError) throw bedsError;
        
        bedroom.beds = bedsData as unknown as Bed[];
      }
      
      // Update selected location with bedrooms and beds
      setSelectedLocation({
        ...location,
        bedrooms: bedroomsWithBeds,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching location details",
        description: error.message,
      });
    }
  };

  const getLocationTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'apartment':
        return <Home className="h-4 w-4 text-primary" />;
      case 'meeting room':
        return <MapPin className="h-4 w-4 text-indigo-500" />;
      default:
        return <Building className="h-4 w-4 text-primary" />;
    }
  };
  
  const getLocationTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'apartment':
        return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">Apartment</Badge>;
      case 'meeting room':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-200">Meeting Room</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Locations</h2>
          <Skeleton className="h-9 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <RoomSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {!selectedLocation ? (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Locations</h2>
            <Button onClick={() => setAddLocationSheetOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </div>
          
          {locations.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">No locations found. Click "Add Location" to create your first location.</p>
                <Button onClick={() => setAddLocationSheetOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Location
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map((location) => (
                <Card 
                  key={location.id} 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleSelectLocation(location)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getLocationTypeIcon(location.type)}
                          <h3 className="font-medium">{location.name}</h3>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Building: {location.building || "N/A"}</p>
                          <p>Floor: {location.floor || "N/A"}</p>
                          <div className="mt-2">
                            {getLocationTypeBadge(location.type)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLocation(location);
                            setEditLocationSheetOpen(true);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLocation(location.id, location.name);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-destructive">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              className="mr-2"
              onClick={() => setSelectedLocation(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back
            </Button>
            <h2 className="text-2xl font-bold">Location Details</h2>
          </div>
          
          <RoomDetailView 
            apartment={selectedLocation} 
            onUpdate={() => handleSelectLocation(selectedLocation)}
          />
        </div>
      )}
      
      {/* Create Location Sheet */}
      <CreateLocationSheet 
        open={addLocationSheetOpen}
        onOpenChange={setAddLocationSheetOpen}
        onSubmit={fetchLocations}
      />
      
      {/* Edit Location Sheet */}
      {selectedLocation && (
        <CreateLocationSheet 
          open={editLocationSheetOpen}
          onOpenChange={setEditLocationSheetOpen}
          onSubmit={fetchLocations}
          apartment={selectedLocation}
          isEditing={true}
        />
      )}
    </div>
  );
};

export default LocationsPage;
