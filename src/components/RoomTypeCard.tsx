
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { type RoomType } from "@/types/booking";
import { PricingDialog } from "@/components/room-types/PricingDialog"; 
import { Tag, DollarSign } from "lucide-react";

interface RoomTypeCardProps {
  roomType: RoomType;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onToggleActive: (id: string, currentActive: boolean | null) => void;
  isEditing: boolean;
  editValues: Partial<RoomType>;
  setEditValues: (values: Partial<RoomType>) => void;
}

const RoomTypeCard = ({
  roomType,
  onEdit,
  onDelete,
  onUpdateQuantity,
  onToggleActive,
  isEditing,
  editValues,
  setEditValues
}: RoomTypeCardProps) => {
  const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false);
  
  // Query to get current bookings count
  const { data: bookingsCount } = useQuery({
    queryKey: ['roomTypeBookings', roomType.code],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('room_type', roomType.code)
        .neq('status', 'cancelled');
      
      if (error) throw error;
      return count || 0;
    }
  });

  const availableRooms = Math.max(0, roomType.quantity - (bookingsCount || 0));

  const getAvailabilityDisplay = () => {
    if (availableRooms === 0) {
      return <span className="text-red-500 font-medium">Sold Out</span>;
    }
    if (availableRooms === 1) {
      return <span className="text-orange-500 font-medium">1 Room Left</span>;
    }
    return <span className="text-green-600 font-medium">{availableRooms} Available</span>;
  };

  return (
    <Card className="border-blue-300">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="truncate">{roomType.display_name}</span>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            {roomType.code}
          </span>
        </CardTitle>
        <CardDescription className="flex justify-between items-center">
          <span>{roomType.min_stay_days ? `Min stay: ${roomType.min_stay_days} days` : 'No minimum stay requirement'}</span>
          <div className="flex items-center space-x-2">
            <Label htmlFor={`active-${roomType.id}`} className="text-sm text-muted-foreground">
              {roomType.active ? 'Active' : 'Inactive'}
            </Label>
            <Switch
              id={`active-${roomType.id}`}
              checked={roomType.active ?? true}
              onCheckedChange={() => onToggleActive(roomType.id, roomType.active)}
            />
          </div>
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isEditing ? (
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
                onChange={(e) => setEditValues({...editValues, code: e.target.value as any})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor={`description-${roomType.id}`}>Description</Label>
              <Input 
                id={`description-${roomType.id}`}
                value={editValues.description || ''}
                onChange={(e) => setEditValues({...editValues, description: e.target.value})}
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
            <div className="space-y-2">
              <Label htmlFor={`quantity-${roomType.id}`}>Total Rooms</Label>
              <Input 
                id={`quantity-${roomType.id}`}
                type="number"
                min={0}
                value={editValues.quantity || 0}
                onChange={(e) => setEditValues({...editValues, quantity: Number(e.target.value)})}
              />
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

            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-medium">Total Rooms:</span>
              <span className="text-sm">{roomType.quantity}</span>
            </div>

            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-medium">Availability:</span>
              {getAvailabilityDisplay()}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={() => onEdit(null)}>Cancel</Button>
            <Button onClick={() => onUpdateQuantity(roomType.id, editValues.quantity || roomType.quantity)}>Save</Button>
          </>
        ) : (
          <div className="flex gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={() => onEdit(roomType.id)}
              className="flex-1"
            >
              <Tag className="mr-1 h-4 w-4" /> Edit
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsPricingDialogOpen(true)}
              className="flex-1"
            >
              <DollarSign className="mr-1 h-4 w-4" /> Pricing
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => onDelete(roomType.id)}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        )}
      </CardFooter>
      
      <PricingDialog
        open={isPricingDialogOpen}
        onOpenChange={setIsPricingDialogOpen}
        roomType={roomType.code}
        roomTypeDisplay={roomType.display_name}
      />
    </Card>
  );
};

export default RoomTypeCard;
