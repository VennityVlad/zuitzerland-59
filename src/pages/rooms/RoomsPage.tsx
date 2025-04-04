
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building, Home } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import RoomSkeleton from "@/components/rooms/RoomSkeleton";
import RoomDetailView from "@/components/rooms/RoomDetailView";
import { CreateApartmentSheet } from "@/components/rooms/CreateApartmentSheet";

type Apartment = {
  id: string;
  name: string;
  building: string | null;
  floor: string | null;
  description: string | null;
  max_occupancy: number | null;
  bedrooms?: Bedroom[];
};

type Bedroom = {
  id: string;
  apartment_id: string;
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

const RoomsPage = () => {
  const [rooms, setRooms] = useState<Apartment[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [addApartmentSheetOpen, setAddApartmentSheetOpen] = useState(false);
  const [editApartmentSheetOpen, setEditApartmentSheetOpen] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchRooms();
  }, []);
  
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setRooms(data as unknown as Apartment[]);
      setLoading(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching apartments",
        description: error.message,
      });
      setLoading(false);
    }
  };
  
  const handleDeleteRoom = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will also delete all bedrooms and beds within this apartment.`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('apartments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Apartment deleted",
        description: `${name} has been deleted.`,
      });
      
      fetchRooms();
      
      if (selectedRoom && selectedRoom.id === id) {
        setSelectedRoom(null);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting apartment",
        description: error.message,
      });
    }
  };
  
  const handleSelectRoom = async (room: Apartment) => {
    setSelectedRoom(null);
    
    try {
      // Fetch bedrooms
      const { data: bedroomsData, error: bedroomsError } = await supabase
        .from('bedrooms')
        .select('*')
        .eq('apartment_id', room.id)
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
      
      // Update selected room with bedrooms and beds
      setSelectedRoom({
        ...room,
        bedrooms: bedroomsWithBeds,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching apartment details",
        description: error.message,
      });
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Apartments</h2>
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
      {!selectedRoom ? (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Apartments</h2>
            <Button onClick={() => setAddApartmentSheetOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Apartment
            </Button>
          </div>
          
          {rooms.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">No apartments found. Click "Add Apartment" to create your first apartment.</p>
                <Button onClick={() => setAddApartmentSheetOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Apartment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <Card 
                  key={room.id} 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleSelectRoom(room)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-primary" />
                          <h3 className="font-medium">{room.name}</h3>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Building: {room.building || "N/A"}</p>
                          <p>Floor: {room.floor || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRoom(room);
                            setEditApartmentSheetOpen(true);
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
                            handleDeleteRoom(room.id, room.name);
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
              onClick={() => setSelectedRoom(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back
            </Button>
            <h2 className="text-2xl font-bold">Apartment Details</h2>
          </div>
          
          <RoomDetailView 
            apartment={selectedRoom} 
            onUpdate={() => handleSelectRoom(selectedRoom)}
          />
        </div>
      )}
      
      {/* Create Apartment Sheet */}
      <CreateApartmentSheet 
        open={addApartmentSheetOpen}
        onOpenChange={setAddApartmentSheetOpen}
        onSubmit={fetchRooms}
      />
      
      {/* Edit Apartment Sheet */}
      {selectedRoom && (
        <CreateApartmentSheet 
          open={editApartmentSheetOpen}
          onOpenChange={setEditApartmentSheetOpen}
          onSubmit={fetchRooms}
          apartment={selectedRoom}
          isEditing={true}
        />
      )}
    </div>
  );
};

export default RoomsPage;
