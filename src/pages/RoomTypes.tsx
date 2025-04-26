import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PageTitle } from "@/components/PageTitle";
import { Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import RoomTypeCard from "@/components/RoomTypeCard";
import type { RoomType } from "@/types/booking";
import { Switch } from "@/components/ui/switch";

const RoomTypes = () => {
  const { user, authenticated, ready } = usePrivy();
  const navigate = useNavigate();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<RoomType>>({});
  const [newRoomType, setNewRoomType] = useState<Partial<RoomType>>({
    display_name: "",
    code: "",
    description: "",
    price_range_min: 0,
    price_range_max: 0,
    min_stay_days: 1,
    quantity: 0
  });
  const [showNewForm, setShowNewForm] = useState(false);
  const { toast } = useToast();
  const { isAdmin, isLoading: isAdminLoading } = useAdminStatus(user?.id);

  useEffect(() => {
    if (ready && !authenticated && !isLoading) {
      console.log("Room Types - Not authenticated");
      toast({
        title: "Authentication Required",
        description: "Please sign in to access room types management.",
      });
      navigate("/signin");
    }
  }, [ready, authenticated, isLoading, navigate, toast]);

  useEffect(() => {
    if (!isAdminLoading && !isAdmin && authenticated) {
      console.log("Room Types - Not admin");
      toast({
        title: "Access Restricted",
        description: "Only administrators can access this page.",
      });
      navigate("/book");
    }

    if (isAdmin && authenticated && !isAdminLoading) {
      fetchRoomTypes();
    }
  }, [isAdmin, authenticated, isAdminLoading]);

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

  const handleEdit = (id: string | null) => {
    setIsEditing(id);
    if (id) {
      const roomType = roomTypes.find(r => r.id === id);
      if (roomType) {
        setEditValues({...roomType});
      }
    } else {
      setEditValues({});
    }
  };

  const handleSaveEdit = async (id: string, updatedValues: Partial<RoomType>) => {
    try {
      console.log("Saving edited room type:", id, updatedValues);
      
      if (!updatedValues.display_name) {
        toast({
          title: "Error",
          description: "Room type name is required",
          variant: "destructive",
        });
        return;
      }

      if (!updatedValues.code) {
        toast({
          title: "Error",
          description: "Room type code is required",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('room_types')
        .update({
          display_name: updatedValues.display_name,
          code: updatedValues.code,
          description: updatedValues.description,
          price_range_min: updatedValues.price_range_min,
          price_range_max: updatedValues.price_range_max,
          min_stay_days: updatedValues.min_stay_days,
          quantity: updatedValues.quantity,
          active: updatedValues.active
        })
        .eq('id', id)
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room type updated successfully",
      });
      
      fetchRoomTypes();
      setIsEditing(null);
      setEditValues({});
    } catch (error) {
      console.error('Error updating room type:', error);
      toast({
        title: "Error",
        description: "Failed to update room type",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRoomType = async (id: string) => {
    try {
      const { error } = await supabase
        .from('room_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room type deleted successfully",
      });
      
      fetchRoomTypes();
    } catch (error) {
      console.error('Error deleting room type:', error);
      toast({
        title: "Error",
        description: "Failed to delete room type",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean | null) => {
    try {
      const { data, error } = await supabase
        .from('room_types')
        .update({ active: !currentActive })
        .eq('id', id)
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room type status updated successfully",
      });
      
      fetchRoomTypes();
    } catch (error) {
      console.error('Error updating room type status:', error);
      toast({
        title: "Error",
        description: "Failed to update room type status",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !ready || isAdminLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageTitle title="Room Types" icon={<Layers className="h-5 w-5" />} />
        <div className="py-8 px-4 flex-grow">
          <div className="container mx-auto">
            <div className="animate-pulse">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!authenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      <PageTitle title="Room Type Management" icon={<Layers className="h-5 w-5" />} />
      <div className="py-8 px-4 flex-grow">
        <div className="container mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-8">
            <div className="flex justify-end items-center mb-6">
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
                <CardContent className="p-6">
                  <RoomTypeCard
                    roomType={{
                      id: 'new',
                      ...newRoomType as RoomType
                    }}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onUpdateQuantity={async () => {
                      try {
                        const { data, error } = await supabase
                          .from('room_types')
                          .insert({
                            display_name: newRoomType.display_name,
                            code: newRoomType.code,
                            description: newRoomType.description,
                            price_range_min: newRoomType.price_range_min,
                            price_range_max: newRoomType.price_range_max,
                            min_stay_days: newRoomType.min_stay_days,
                            quantity: newRoomType.quantity
                          })
                          .select();

                        if (error) throw error;

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
                          min_stay_days: 1,
                          quantity: 0
                        });
                      } catch (error) {
                        console.error('Error creating room type:', error);
                        toast({
                          title: "Error",
                          description: "Failed to create room type",
                          variant: "destructive",
                        });
                      }
                    }}
                    onToggleActive={() => {}}
                    isEditing={true}
                    editValues={newRoomType}
                    setEditValues={setNewRoomType}
                  />
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roomTypes.map((roomType) => (
                <RoomTypeCard
                  key={roomType.id}
                  roomType={roomType}
                  onEdit={handleEdit}
                  onDelete={handleDeleteRoomType}
                  onUpdateQuantity={(id, quantity) => handleSaveEdit(id, { ...editValues, quantity })}
                  onToggleActive={handleToggleActive}
                  isEditing={isEditing === roomType.id}
                  editValues={editValues}
                  setEditValues={setEditValues}
                />
              ))}
            </div>

            {roomTypes.length === 0 && !showNewForm && (
              <div className="text-center py-12">
                <p className="text-gray-500">No room types found. Create your first room type using the button above.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomTypes;
