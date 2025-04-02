
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, DoorClosed, Edit, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { BedList } from "./BedList";

interface Bedroom {
  id: string;
  apartment_id: string;
  name: string;
  description: string | null;
}

interface BedroomListProps {
  apartmentId: string;
}

export const BedroomList: React.FC<BedroomListProps> = ({ apartmentId }) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newBedroom, setNewBedroom] = useState<Omit<Bedroom, 'id'>>({
    apartment_id: apartmentId,
    name: '',
    description: '',
  });
  const [editingBedroom, setEditingBedroom] = useState<Bedroom | null>(null);
  const [expandedBedroomId, setExpandedBedroomId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: bedrooms, isLoading } = useQuery({
    queryKey: ['bedrooms', apartmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bedrooms')
        .select('*')
        .eq('apartment_id', apartmentId)
        .order('name');
      
      if (error) {
        console.error('Error fetching bedrooms:', error);
        toast({
          title: "Error",
          description: "Could not load bedrooms. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
      
      return data || [];
    }
  });

  const createBedroomMutation = useMutation({
    mutationFn: async (bedroomData: Omit<Bedroom, 'id'>) => {
      const { data, error } = await supabase
        .from('bedrooms')
        .insert(bedroomData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bedrooms', apartmentId] });
      setIsCreateDialogOpen(false);
      setNewBedroom({
        apartment_id: apartmentId,
        name: '',
        description: '',
      });
      toast({
        title: "Success",
        description: "Bedroom created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating bedroom:', error);
      toast({
        title: "Error",
        description: "Failed to create bedroom",
        variant: "destructive",
      });
    }
  });

  const updateBedroomMutation = useMutation({
    mutationFn: async (bedroom: Bedroom) => {
      const { data, error } = await supabase
        .from('bedrooms')
        .update({
          name: bedroom.name,
          description: bedroom.description
        })
        .eq('id', bedroom.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bedrooms', apartmentId] });
      setIsEditDialogOpen(false);
      setEditingBedroom(null);
      toast({
        title: "Success",
        description: "Bedroom updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating bedroom:', error);
      toast({
        title: "Error",
        description: "Failed to update bedroom",
        variant: "destructive",
      });
    }
  });

  const deleteBedroomMutation = useMutation({
    mutationFn: async (bedroomId: string) => {
      const { error } = await supabase
        .from('bedrooms')
        .delete()
        .eq('id', bedroomId);
      
      if (error) throw error;
      return bedroomId;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['bedrooms', apartmentId] });
      if (expandedBedroomId === deletedId) {
        setExpandedBedroomId(null);
      }
      toast({
        title: "Success",
        description: "Bedroom deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting bedroom:', error);
      toast({
        title: "Error",
        description: "Failed to delete bedroom",
        variant: "destructive",
      });
    }
  });

  const handleCreateBedroom = () => {
    createBedroomMutation.mutate(newBedroom);
  };

  const handleUpdateBedroom = () => {
    if (editingBedroom) {
      updateBedroomMutation.mutate(editingBedroom);
    }
  };

  const handleDeleteBedroom = (bedroomId: string) => {
    if (confirm("Are you sure you want to delete this bedroom? This will also delete all beds inside it.")) {
      deleteBedroomMutation.mutate(bedroomId);
    }
  };

  const handleEditClick = (bedroom: Bedroom) => {
    setEditingBedroom(bedroom);
    setIsEditDialogOpen(true);
  };

  const toggleExpandBedroom = (bedroomId: string) => {
    if (expandedBedroomId === bedroomId) {
      setExpandedBedroomId(null);
    } else {
      setExpandedBedroomId(bedroomId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 mt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Bedrooms</h3>
        </div>
        {[1, 2].map((i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader className="py-3">
              <Skeleton className="h-5 w-1/2" />
            </CardHeader>
            <CardContent className="py-2">
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Bedrooms</h3>
        <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-3 w-3" /> Add Bedroom
        </Button>
      </div>

      {!bedrooms || bedrooms.length === 0 ? (
        <Card className="bg-gray-50 border border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-6">
            <DoorClosed className="h-8 w-8 text-gray-400 mb-3" />
            <p className="text-sm text-gray-500 mb-3">No bedrooms found</p>
            <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-3 w-3" /> Add First Bedroom
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bedrooms.map((bedroom) => (
            <Card key={bedroom.id} className="shadow-sm">
              <CardHeader className="py-3">
                <CardTitle className="text-base flex justify-between items-center">
                  <span>{bedroom.name}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(bedroom)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteBedroom(bedroom.id)}>
                      <Trash className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              {bedroom.description && (
                <CardContent className="py-2">
                  <p className="text-sm text-gray-600">{bedroom.description}</p>
                </CardContent>
              )}
              <CardFooter className="pt-0 pb-3">
                <Button variant="outline" size="sm" className="w-full" onClick={() => toggleExpandBedroom(bedroom.id)}>
                  {expandedBedroomId === bedroom.id ? "Hide Beds" : "Show Beds"}
                </Button>
              </CardFooter>
              
              {expandedBedroomId === bedroom.id && (
                <div className="px-4 pb-4">
                  <BedList bedroomId={bedroom.id} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Bedroom Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Bedroom</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bedroom-name">Bedroom Name</Label>
              <Input 
                id="bedroom-name" 
                value={newBedroom.name} 
                onChange={(e) => setNewBedroom({...newBedroom, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bedroom-description">Description</Label>
              <Textarea 
                id="bedroom-description" 
                value={newBedroom.description || ''} 
                onChange={(e) => setNewBedroom({...newBedroom, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateBedroom}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bedroom Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Bedroom</DialogTitle>
          </DialogHeader>
          {editingBedroom && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-bedroom-name">Bedroom Name</Label>
                <Input 
                  id="edit-bedroom-name" 
                  value={editingBedroom.name} 
                  onChange={(e) => setEditingBedroom({...editingBedroom, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-bedroom-description">Description</Label>
                <Textarea 
                  id="edit-bedroom-description" 
                  value={editingBedroom.description || ''} 
                  onChange={(e) => setEditingBedroom({...editingBedroom, description: e.target.value})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateBedroom}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
