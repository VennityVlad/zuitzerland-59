
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Bed, Edit, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface BedObj {
  id: string;
  bedroom_id: string;
  name: string;
  bed_type: string;
  description: string | null;
}

interface BedListProps {
  bedroomId: string;
}

export const BedList: React.FC<BedListProps> = ({ bedroomId }) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newBed, setNewBed] = useState<Omit<BedObj, 'id'>>({
    bedroom_id: bedroomId,
    name: '',
    bed_type: 'single',
    description: '',
  });
  const [editingBed, setEditingBed] = useState<BedObj | null>(null);

  const queryClient = useQueryClient();

  const { data: beds, isLoading } = useQuery({
    queryKey: ['beds', bedroomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beds')
        .select('*')
        .eq('bedroom_id', bedroomId)
        .order('name');
      
      if (error) {
        console.error('Error fetching beds:', error);
        toast({
          title: "Error",
          description: "Could not load beds. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
      
      return data || [];
    }
  });

  const createBedMutation = useMutation({
    mutationFn: async (bedData: Omit<BedObj, 'id'>) => {
      const { data, error } = await supabase
        .from('beds')
        .insert(bedData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds', bedroomId] });
      setIsCreateDialogOpen(false);
      setNewBed({
        bedroom_id: bedroomId,
        name: '',
        bed_type: 'single',
        description: '',
      });
      toast({
        title: "Success",
        description: "Bed created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating bed:', error);
      toast({
        title: "Error",
        description: "Failed to create bed",
        variant: "destructive",
      });
    }
  });

  const updateBedMutation = useMutation({
    mutationFn: async (bed: BedObj) => {
      const { data, error } = await supabase
        .from('beds')
        .update({
          name: bed.name,
          bed_type: bed.bed_type,
          description: bed.description
        })
        .eq('id', bed.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds', bedroomId] });
      setIsEditDialogOpen(false);
      setEditingBed(null);
      toast({
        title: "Success",
        description: "Bed updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating bed:', error);
      toast({
        title: "Error",
        description: "Failed to update bed",
        variant: "destructive",
      });
    }
  });

  const deleteBedMutation = useMutation({
    mutationFn: async (bedId: string) => {
      const { error } = await supabase
        .from('beds')
        .delete()
        .eq('id', bedId);
      
      if (error) throw error;
      return bedId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds', bedroomId] });
      toast({
        title: "Success",
        description: "Bed deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting bed:', error);
      toast({
        title: "Error",
        description: "Failed to delete bed",
        variant: "destructive",
      });
    }
  });

  const handleCreateBed = () => {
    createBedMutation.mutate(newBed);
  };

  const handleUpdateBed = () => {
    if (editingBed) {
      updateBedMutation.mutate(editingBed);
    }
  };

  const handleDeleteBed = (bedId: string) => {
    if (confirm("Are you sure you want to delete this bed?")) {
      deleteBedMutation.mutate(bedId);
    }
  };

  const handleEditClick = (bed: BedObj) => {
    setEditingBed(bed);
    setIsEditDialogOpen(true);
  };

  const bedTypeOptions = [
    { value: 'single', label: 'Single' },
    { value: 'twin', label: 'Twin' },
    { value: 'queen', label: 'Queen' },
    { value: 'king', label: 'King' },
    { value: 'bunk', label: 'Bunk Bed' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-3 mt-3">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium">Beds</h4>
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="py-2">
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-3">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-medium">Beds</h4>
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-1 h-3 w-3" /> Add Bed
        </Button>
      </div>

      {!beds || beds.length === 0 ? (
        <Card className="bg-gray-50 border border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-4">
            <Bed className="h-6 w-6 text-gray-400 mb-2" />
            <p className="text-xs text-gray-500 mb-2">No beds found</p>
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setIsCreateDialogOpen(true)}>
              <PlusCircle className="mr-1 h-3 w-3" /> Add First Bed
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {beds.map((bed) => (
            <div 
              key={bed.id} 
              className="bg-gray-50 rounded-md p-3 flex items-center justify-between border border-gray-100"
            >
              <div>
                <div className="flex items-center">
                  <Bed className="h-3 w-3 text-gray-500 mr-2" />
                  <span className="font-medium text-sm">{bed.name}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Type: {bed.bed_type.charAt(0).toUpperCase() + bed.bed_type.slice(1)}
                </div>
                {bed.description && (
                  <div className="text-xs text-gray-500 mt-1">{bed.description}</div>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(bed)}>
                  <Edit className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteBed(bed.id)}>
                  <Trash className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Bed Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Bed</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bed-name">Bed Name</Label>
              <Input 
                id="bed-name" 
                value={newBed.name} 
                onChange={(e) => setNewBed({...newBed, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bed-type">Bed Type</Label>
              <Select 
                value={newBed.bed_type} 
                onValueChange={(value) => setNewBed({...newBed, bed_type: value})}
              >
                <SelectTrigger id="bed-type">
                  <SelectValue placeholder="Select bed type" />
                </SelectTrigger>
                <SelectContent>
                  {bedTypeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bed-description">Description</Label>
              <Textarea 
                id="bed-description" 
                value={newBed.description || ''} 
                onChange={(e) => setNewBed({...newBed, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateBed}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bed Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Bed</DialogTitle>
          </DialogHeader>
          {editingBed && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-bed-name">Bed Name</Label>
                <Input 
                  id="edit-bed-name" 
                  value={editingBed.name} 
                  onChange={(e) => setEditingBed({...editingBed, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-bed-type">Bed Type</Label>
                <Select 
                  value={editingBed.bed_type} 
                  onValueChange={(value) => setEditingBed({...editingBed, bed_type: value})}
                >
                  <SelectTrigger id="edit-bed-type">
                    <SelectValue placeholder="Select bed type" />
                  </SelectTrigger>
                  <SelectContent>
                    {bedTypeOptions.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-bed-description">Description</Label>
                <Textarea 
                  id="edit-bed-description" 
                  value={editingBed.description || ''} 
                  onChange={(e) => setEditingBed({...editingBed, description: e.target.value})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateBed}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
