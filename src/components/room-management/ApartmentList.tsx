
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Building, HomeIcon, Bed, Edit, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { BedroomList } from "./BedroomList";

interface Apartment {
  id: string;
  name: string;
  building: string | null;
  floor: string | null;
  description: string | null;
  max_occupancy: number | null;
}

interface ApartmentListProps {
  apartments: Apartment[];
  isLoading: boolean;
}

const ApartmentList: React.FC<ApartmentListProps> = ({ apartments, isLoading }) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newApartment, setNewApartment] = useState<Omit<Apartment, 'id'>>({
    name: '',
    building: '',
    floor: '',
    description: '',
    max_occupancy: 0
  });
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);
  const [expandedApartmentId, setExpandedApartmentId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const createApartmentMutation = useMutation({
    mutationFn: async (apartmentData: Omit<Apartment, 'id'>) => {
      const { data, error } = await supabase
        .from('apartments')
        .insert(apartmentData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments'] });
      setIsCreateDialogOpen(false);
      setNewApartment({
        name: '',
        building: '',
        floor: '',
        description: '',
        max_occupancy: 0
      });
      toast({
        title: "Success",
        description: "Apartment created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating apartment:', error);
      toast({
        title: "Error",
        description: "Failed to create apartment",
        variant: "destructive",
      });
    }
  });

  const updateApartmentMutation = useMutation({
    mutationFn: async (apartment: Apartment) => {
      const { data, error } = await supabase
        .from('apartments')
        .update({
          name: apartment.name,
          building: apartment.building,
          floor: apartment.floor,
          description: apartment.description,
          max_occupancy: apartment.max_occupancy
        })
        .eq('id', apartment.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments'] });
      setIsEditDialogOpen(false);
      setEditingApartment(null);
      toast({
        title: "Success",
        description: "Apartment updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating apartment:', error);
      toast({
        title: "Error",
        description: "Failed to update apartment",
        variant: "destructive",
      });
    }
  });

  const deleteApartmentMutation = useMutation({
    mutationFn: async (apartmentId: string) => {
      const { error } = await supabase
        .from('apartments')
        .delete()
        .eq('id', apartmentId);
      
      if (error) throw error;
      return apartmentId;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['apartments'] });
      if (expandedApartmentId === deletedId) {
        setExpandedApartmentId(null);
      }
      toast({
        title: "Success",
        description: "Apartment deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting apartment:', error);
      toast({
        title: "Error",
        description: "Failed to delete apartment",
        variant: "destructive",
      });
    }
  });

  const handleCreateApartment = () => {
    createApartmentMutation.mutate(newApartment);
  };

  const handleUpdateApartment = () => {
    if (editingApartment) {
      updateApartmentMutation.mutate(editingApartment);
    }
  };

  const handleDeleteApartment = (apartmentId: string) => {
    if (confirm("Are you sure you want to delete this apartment? This will also delete all bedrooms and beds inside it.")) {
      deleteApartmentMutation.mutate(apartmentId);
    }
  };

  const handleEditClick = (apartment: Apartment) => {
    setEditingApartment(apartment);
    setIsEditDialogOpen(true);
  };

  const toggleExpandApartment = (apartmentId: string) => {
    if (expandedApartmentId === apartmentId) {
      setExpandedApartmentId(null);
    } else {
      setExpandedApartmentId(apartmentId);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="shadow-md">
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Apartments</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Apartment
        </Button>
      </div>

      {apartments.length === 0 ? (
        <Card className="bg-gray-50 border border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg text-gray-500 mb-4">No apartments found</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Apartment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apartments.map((apartment) => (
            <Card key={apartment.id} className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span className="truncate">{apartment.name}</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(apartment)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteApartment(apartment.id)}>
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                {apartment.building && (
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <Building className="h-4 w-4 mr-2" />
                    <span>Building: {apartment.building}</span>
                  </div>
                )}
                {apartment.floor && (
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <HomeIcon className="h-4 w-4 mr-2" />
                    <span>Floor: {apartment.floor}</span>
                  </div>
                )}
                {apartment.max_occupancy && (
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <Bed className="h-4 w-4 mr-2" />
                    <span>Max Occupancy: {apartment.max_occupancy}</span>
                  </div>
                )}
                {apartment.description && (
                  <p className="text-sm text-gray-600 mt-2">{apartment.description}</p>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full mt-2" onClick={() => toggleExpandApartment(apartment.id)}>
                  {expandedApartmentId === apartment.id ? "Hide Bedrooms" : "Show Bedrooms"}
                </Button>
              </CardFooter>
              
              {expandedApartmentId === apartment.id && (
                <div className="px-4 pb-4">
                  <BedroomList apartmentId={apartment.id} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Apartment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Apartment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Apartment Name</Label>
              <Input 
                id="name" 
                value={newApartment.name} 
                onChange={(e) => setNewApartment({...newApartment, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="building">Building</Label>
              <Input 
                id="building" 
                value={newApartment.building || ''} 
                onChange={(e) => setNewApartment({...newApartment, building: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="floor">Floor</Label>
              <Input 
                id="floor" 
                value={newApartment.floor || ''} 
                onChange={(e) => setNewApartment({...newApartment, floor: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="max_occupancy">Max Occupancy</Label>
              <Input 
                id="max_occupancy" 
                type="number" 
                value={newApartment.max_occupancy || ''} 
                onChange={(e) => setNewApartment({...newApartment, max_occupancy: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={newApartment.description || ''} 
                onChange={(e) => setNewApartment({...newApartment, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateApartment}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Apartment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Apartment</DialogTitle>
          </DialogHeader>
          {editingApartment && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Apartment Name</Label>
                <Input 
                  id="edit-name" 
                  value={editingApartment.name} 
                  onChange={(e) => setEditingApartment({...editingApartment, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-building">Building</Label>
                <Input 
                  id="edit-building" 
                  value={editingApartment.building || ''} 
                  onChange={(e) => setEditingApartment({...editingApartment, building: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-floor">Floor</Label>
                <Input 
                  id="edit-floor" 
                  value={editingApartment.floor || ''} 
                  onChange={(e) => setEditingApartment({...editingApartment, floor: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-max_occupancy">Max Occupancy</Label>
                <Input 
                  id="edit-max_occupancy" 
                  type="number" 
                  value={editingApartment.max_occupancy || ''} 
                  onChange={(e) => setEditingApartment({...editingApartment, max_occupancy: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea 
                  id="edit-description" 
                  value={editingApartment.description || ''} 
                  onChange={(e) => setEditingApartment({...editingApartment, description: e.target.value})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateApartment}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApartmentList;
