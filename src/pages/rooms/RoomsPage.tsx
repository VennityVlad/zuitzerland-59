
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash, Edit, BedDouble, Door, Building } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AddRoomDialog from "@/components/rooms/AddRoomDialog";
import EditRoomDialog from "@/components/rooms/EditRoomDialog";
import RoomDetailView from "@/components/rooms/RoomDetailView";
import RoomSkeleton from "@/components/rooms/RoomSkeleton";

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
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchApartments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setApartments(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching rooms",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApartments();
  }, []);

  const handleAddRoom = async (newRoom: Omit<Apartment, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('apartments')
        .insert([newRoom])
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Room added",
        description: `${newRoom.name} has been added successfully.`,
      });
      
      fetchApartments();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding room",
        description: error.message,
      });
    }
  };

  const handleUpdateRoom = async (id: string, updatedRoom: Partial<Apartment>) => {
    try {
      const { error } = await supabase
        .from('apartments')
        .update(updatedRoom)
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Room updated",
        description: `${updatedRoom.name || 'Room'} has been updated successfully.`,
      });
      
      fetchApartments();
      if (selectedApartment?.id === id) {
        setSelectedApartment({...selectedApartment, ...updatedRoom});
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating room",
        description: error.message,
      });
    }
  };

  const handleDeleteRoom = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will also delete all associated bedrooms and beds.`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('apartments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Room deleted",
        description: `${name} has been deleted successfully.`,
      });
      
      fetchApartments();
      if (selectedApartment?.id === id) {
        setSelectedApartment(null);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting room",
        description: error.message,
      });
    }
  };

  const handleSelectRoom = async (apartment: Apartment) => {
    setSelectedApartment(apartment);
    try {
      // Fetch room details with bedrooms and beds
      const { data, error } = await supabase
        .from('bedrooms')
        .select(`
          id,
          name,
          description,
          apartment_id,
          beds (
            id,
            name,
            bed_type,
            description,
            bedroom_id
          )
        `)
        .eq('apartment_id', apartment.id);
      
      if (error) throw error;
      
      const updatedApartment = {...apartment, bedrooms: data || []};
      setSelectedApartment(updatedApartment);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching room details",
        description: error.message,
      });
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Rooms</h2>
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Room
          </Button>
        </div>
        
        <div className="space-y-3 h-[calc(100vh-250px)] overflow-y-auto pr-2">
          {loading ? (
            Array(5).fill(0).map((_, i) => <RoomSkeleton key={i} />)
          ) : apartments.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No rooms found. Click "Add Room" to create your first room.
              </CardContent>
            </Card>
          ) : (
            apartments.map((apartment) => (
              <Card 
                key={apartment.id} 
                className={`cursor-pointer hover:bg-secondary/50 transition-colors ${
                  selectedApartment?.id === apartment.id ? 'border-primary bg-secondary/50' : ''
                }`}
                onClick={() => handleSelectRoom(apartment)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-primary" />
                        <h3 className="font-medium">{apartment.name}</h3>
                      </div>
                      {apartment.building && (
                        <p className="text-sm text-muted-foreground">
                          Building: {apartment.building}
                          {apartment.floor && `, Floor: ${apartment.floor}`}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApartment(apartment);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRoom(apartment.id, apartment.name);
                        }}
                      >
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      
      <div className="md:col-span-2">
        {selectedApartment ? (
          <RoomDetailView 
            apartment={selectedApartment} 
            onUpdate={() => {
              if (selectedApartment) {
                handleSelectRoom(selectedApartment);
              }
              fetchApartments();
            }}
          />
        ) : (
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center h-80 text-center">
              <Building className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No Room Selected</h3>
              <p className="text-muted-foreground">
                Select a room from the list on the left or create a new one to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <AddRoomDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen}
        onSubmit={handleAddRoom}
      />
      
      {selectedApartment && (
        <EditRoomDialog 
          open={editDialogOpen} 
          onOpenChange={setEditDialogOpen}
          apartment={selectedApartment}
          onSubmit={(updatedRoom) => handleUpdateRoom(selectedApartment.id, updatedRoom)}
        />
      )}
    </div>
  );
};

export default RoomsPage;
