import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Plus, BedDouble, Home, User, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AddBedroomDialog from "./AddBedroomDialog";
import AddBedDialog from "./AddBedDialog";
import BedroomList from "./BedroomList";
import RoomAssignments from "./RoomAssignments";

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

type RoomDetailViewProps = {
  apartment: Apartment;
  onUpdate: () => void;
};

const RoomDetailView = ({ apartment, onUpdate }: RoomDetailViewProps) => {
  const [addBedroomDialogOpen, setAddBedroomDialogOpen] = useState(false);
  const [addBedDialogOpen, setAddBedDialogOpen] = useState(false);
  const [selectedBedroom, setSelectedBedroom] = useState<Bedroom | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const { toast } = useToast();

  const handleAddBedroom = async (data: { name: string; description: string }) => {
    try {
      const { error } = await supabase
        .from('bedrooms')
        .insert({
          apartment_id: apartment.id,
          name: data.name,
          description: data.description || null,
        });
      
      if (error) throw error;
      
      toast({
        title: "Bedroom added",
        description: `${data.name} has been added to ${apartment.name}.`,
      });
      
      onUpdate();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding bedroom",
        description: error.message,
      });
    }
  };

  const handleAddBed = async (data: { name: string; bed_type: string; description: string }) => {
    if (!selectedBedroom) return;
    
    try {
      const { error } = await supabase
        .from('beds')
        .insert({
          bedroom_id: selectedBedroom.id,
          name: data.name,
          bed_type: data.bed_type,
          description: data.description || null,
        });
      
      if (error) throw error;
      
      toast({
        title: "Bed added",
        description: `${data.name} has been added to ${selectedBedroom.name}.`,
      });
      
      onUpdate();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding bed",
        description: error.message,
      });
    }
  };

  const handleDeleteBedroom = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will also delete all beds in this bedroom.`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('bedrooms')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Bedroom deleted",
        description: `${name} has been deleted.`,
      });
      
      onUpdate();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting bedroom",
        description: error.message,
      });
    }
  };

  const handleDeleteBed = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('beds')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Bed deleted",
        description: `${name} has been deleted.`,
      });
      
      onUpdate();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting bed",
        description: error.message,
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">{apartment.name}</CardTitle>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <TabsContent value="details" className="space-y-6 mt-0">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Building</p>
              <p>{apartment.building || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Floor</p>
              <p>{apartment.floor || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Max Occupancy</p>
              <p>{apartment.max_occupancy || "Not specified"}</p>
            </div>
          </div>
          
          {apartment.description && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-sm">{apartment.description}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                Bedrooms
              </h3>
              <Button size="sm" onClick={() => setAddBedroomDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Bedroom
              </Button>
            </div>
            
            <BedroomList 
              bedrooms={apartment.bedrooms || []} 
              onAddBed={(bedroom) => {
                setSelectedBedroom(bedroom);
                setAddBedDialogOpen(true);
              }}
              onDeleteBedroom={handleDeleteBedroom}
              onDeleteBed={handleDeleteBed}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="assignments" className="mt-0">
          <RoomAssignments apartmentId={apartment.id} />
        </TabsContent>
      </CardContent>
      
      <AddBedroomDialog 
        open={addBedroomDialogOpen}
        onOpenChange={setAddBedroomDialogOpen}
        onSubmit={handleAddBedroom}
      />
      
      <AddBedDialog 
        open={addBedDialogOpen}
        onOpenChange={setAddBedDialogOpen}
        bedroom={selectedBedroom}
        onSubmit={handleAddBed}
      />
    </Card>
  );
};

export default RoomDetailView;
