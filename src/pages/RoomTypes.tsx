
import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DatabaseRoomType } from "@/types/booking";

interface RoomType {
  id: string;
  code: string; // Changed from DatabaseRoomType to string to match Supabase response
  display_name: string;
  description: string | null;
  price_range_min: number | null;
  price_range_max: number | null;
  min_stay_days: number | null;
  created_at: string;
  updated_at: string;
}

const RoomTypes = () => {
  const { user } = usePrivy();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<RoomType>>({});
  const [newRoomType, setNewRoomType] = useState<Partial<RoomType>>({
    display_name: "",
    code: "", // Changed from DatabaseRoomType to string
    description: "",
    price_range_min: 0,
    price_range_max: 0,
    min_stay_days: 1
  });
  const [showNewForm, setShowNewForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('privy_id', user.id)
          .maybeSingle();

        if (error) throw error;
        
        setIsAdmin(data?.role === 'admin');
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAdmin) {
      fetchRoomTypes();
    }
  }, [isAdmin]);

  const fetchRoomTypes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('room_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log("Fetched room types:", data);
      setRoomTypes(data || []);
    } catch (error) {
      console.error('Error fetching room types:', error);
      toast({
        title: "Error",
        description: "Failed to load room types",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    const roomType = roomTypes.find(r => r.id === id);
    if (roomType) {
      console.log("Editing room type:", roomType);
      setEditValues({...roomType});
      setIsEditing(id);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setEditValues({});
  };

  const handleSaveEdit = async (id: string) => {
    try {
      console.log("Saving edited room type:", id, editValues);
      
      // Make sure we have all required fields
      if (!editValues.display_name) {
        toast({
          title: "Error",
          description: "Room type name is required",
          variant: "destructive",
        });
        return;
      }

      if (!editValues.code) {
        toast({
          title: "Error",
          description: "Room type code is required",
          variant: "destructive",
        });
        return;
      }

      const updateData = {
        display_name: editValues.display_name,
        code: editValues.code,
        description: editValues.description,
        price_range_min: editValues.price_range_min,
        price_range_max: editValues.price_range_max,
        min_stay_days: editValues.min_stay_days
      };

      console.log("Sending update to Supabase:", updateData);
      
      const { data, error } = await supabase
        .from('room_types')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }

      console.log("Update response from Supabase:", data);

      toast({
        title: "Success",
        description: "Room type updated successfully",
      });
      
      // Update the room type in the local state to reflect changes immediately
      setRoomTypes(prevRoomTypes => 
        prevRoomTypes.map(r => r.id === id ? { ...r, ...updateData } : r)
      );
      
      // Refresh the room types list to ensure we have the latest data
      fetchRoomTypes();
      setIsEditing(null);
      setEditValues({});
    } catch (error) {
      console.error('Error updating room type:', error);
      toast({
        title: "Error",
        description: "Failed to update room type: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
    }
  };

  const handleCreateRoomType = async () => {
    try {
      if (!newRoomType.display_name) {
        toast({
          title: "Error",
          description: "Room type name is required",
          variant: "destructive",
        });
        return;
      }

      if (!newRoomType.code) {
        toast({
          title: "Error",
          description: "Room type code is required",
          variant: "destructive",
        });
        return;
      }

      console.log("Creating new room type:", newRoomType);

      const { data, error } = await supabase
        .from('room_types')
        .insert({
          display_name: newRoomType.display_name,
          code: newRoomType.code,
          description: newRoomType.description,
          price_range_min: newRoomType.price_range_min,
          price_range_max: newRoomType.price_range_max,
          min_stay_days: newRoomType.min_stay_days
        })
        .select();

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }

      console.log("Insert response from Supabase:", data);

      toast({
        title: "Success",
        description: "Room type created successfully",
      });
      
      fetchRoomTypes();
      setShowNewForm(false);
      setNewRoomType({
        display_name: "",
        code: "",
        description: "",
        price_range_min: 0,
        price_range_max: 0,
        min_stay_days: 1
      });
    } catch (error) {
      console.error('Error creating room type:', error);
      toast({
        title: "Error",
        description: "Failed to create room type: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteRoomType = async (id: string) => {
    try {
      console.log("Deleting room type:", id);
      
      const { error } = await supabase
        .from('room_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room type deleted successfully",
      });
      
      // Update the local state to reflect the deletion immediately
      setRoomTypes(prevRoomTypes => prevRoomTypes.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting room type:', error);
      toast({
        title: "Error",
        description: "Failed to delete room type",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary/30 py-12">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-secondary/30 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-red-600">Access Denied</h1>
            <p className="mt-2">You do not have permission to view this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-hotel-navy">Room Type Management</h1>
            <Button 
              onClick={() => setShowNewForm(!showNewForm)}
              variant="outline"
              className="flex items-center gap-2"
            >
              {showNewForm ? "Cancel" : "Add New Room Type"}
            </Button>
          </div>

          {showNewForm && (
            <Card className="mb-8 border-dashed border-2 border-blue-300">
              <CardHeader>
                <CardTitle>Create New Room Type</CardTitle>
                <CardDescription>Fill in the details to create a new room type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-name">Room Type Name</Label>
                    <Input 
                      id="new-name" 
                      value={newRoomType.display_name || ''}
                      onChange={(e) => setNewRoomType({...newRoomType, display_name: e.target.value})}
                      placeholder="Queen Room"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-code">Room Type Code</Label>
                    <Input 
                      id="new-code" 
                      value={newRoomType.code || ''}
                      onChange={(e) => setNewRoomType({...newRoomType, code: e.target.value as DatabaseRoomType})}
                      placeholder="hotel_room_queen"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-description">Description</Label>
                  <Textarea 
                    id="new-description" 
                    value={newRoomType.description || ''}
                    onChange={(e) => setNewRoomType({...newRoomType, description: e.target.value})}
                    placeholder="Comfortable room with a queen-sized bed..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-price-min">Min Price ($)</Label>
                    <Input 
                      id="new-price-min" 
                      type="number"
                      min={0}
                      value={newRoomType.price_range_min || 0}
                      onChange={(e) => setNewRoomType({...newRoomType, price_range_min: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-price-max">Max Price ($)</Label>
                    <Input 
                      id="new-price-max" 
                      type="number"
                      min={0}
                      value={newRoomType.price_range_max || 0}
                      onChange={(e) => setNewRoomType({...newRoomType, price_range_max: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-min-stay">Min Stay (days)</Label>
                    <Input 
                      id="new-min-stay" 
                      type="number"
                      min={1}
                      value={newRoomType.min_stay_days || 1}
                      onChange={(e) => setNewRoomType({...newRoomType, min_stay_days: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleCreateRoomType}>Create Room Type</Button>
              </CardFooter>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roomTypes.map((roomType) => (
              <Card key={roomType.id} className="border-blue-300">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span className="truncate">{roomType.display_name}</span>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {roomType.code}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {roomType.min_stay_days ? `Min stay: ${roomType.min_stay_days} days` : 'No minimum stay requirement'}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {isEditing === roomType.id ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`name-${roomType.id}`}>Room Type Name</Label>
                        <Input 
                          id={`name-${roomType.id}`}
                          value={editValues.display_name || ''}
                          onChange={(e) => setEditValues({...editValues, display_name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`code-${roomType.id}`}>Room Type Code</Label>
                        <Input 
                          id={`code-${roomType.id}`}
                          value={editValues.code || ''}
                          onChange={(e) => setEditValues({...editValues, code: e.target.value as DatabaseRoomType})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`description-${roomType.id}`}>Description</Label>
                        <Textarea 
                          id={`description-${roomType.id}`}
                          value={editValues.description || ''}
                          onChange={(e) => setEditValues({...editValues, description: e.target.value})}
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`min-price-${roomType.id}`}>Min Price ($)</Label>
                          <Input 
                            id={`min-price-${roomType.id}`}
                            type="number"
                            min={0}
                            value={editValues.price_range_min || 0}
                            onChange={(e) => setEditValues({...editValues, price_range_min: Number(e.target.value)})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`max-price-${roomType.id}`}>Max Price ($)</Label>
                          <Input 
                            id={`max-price-${roomType.id}`}
                            type="number"
                            min={0}
                            value={editValues.price_range_max || 0}
                            onChange={(e) => setEditValues({...editValues, price_range_max: Number(e.target.value)})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`min-stay-${roomType.id}`}>Min Stay (days)</Label>
                          <Input 
                            id={`min-stay-${roomType.id}`}
                            type="number" 
                            min={1}
                            value={editValues.min_stay_days || 1}
                            onChange={(e) => setEditValues({...editValues, min_stay_days: Number(e.target.value)})}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm">
                        {roomType.description || 'No description available'}
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-sm font-medium">Price Range:</span>
                        <span className="text-sm">
                          ${roomType.price_range_min || 0} - ${roomType.price_range_max || 0}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="flex justify-between">
                  {isEditing === roomType.id ? (
                    <>
                      <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                      <Button onClick={() => handleSaveEdit(roomType.id)}>Save</Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => handleEdit(roomType.id)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => handleDeleteRoomType(roomType.id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          {roomTypes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No room types found. Create your first room type using the button above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomTypes;
