
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BookingFormData } from "@/types/booking";
import { usePrices } from "@/hooks/usePrices";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type RoomType = Database['public']['Enums']['room_type'];

interface RoomSelectionFieldsProps {
  formData: BookingFormData;
  onRoomTypeChange: (value: string) => void;
}

const getRoomTypes = async () => {
  // Simplified query to get distinct room types
  const { data, error } = await supabase
    .from('prices')
    .select('room_type');

  if (error) {
    console.error('Error fetching room types:', error);
    throw error;
  }

  // Get unique room types
  const uniqueTypes = [...new Set(data.map(row => row.room_type))] as RoomType[];
  
  console.log('Fetched unique room types:', uniqueTypes);
  
  return uniqueTypes.map(type => ({
    id: type,
    name: type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }));
};

const RoomSelectionFields = ({
  formData,
  onRoomTypeChange,
}: RoomSelectionFieldsProps) => {
  const { data: prices, isLoading: isPricesLoading } = usePrices(formData.checkin);
  const { data: roomTypes, isLoading: isRoomTypesLoading } = useQuery({
    queryKey: ['roomTypes'],
    queryFn: getRoomTypes,
    staleTime: Infinity // Cache the room types indefinitely since they rarely change
  });

  // Update room type prices based on selected date
  const roomTypesWithPrices = roomTypes?.map(room => {
    const priceData = prices?.find(p => p.room_type === room.id);
    return {
      ...room,
      pricePerNight: priceData?.price || 0
    };
  }) || [];

  const isLoading = isPricesLoading || isRoomTypesLoading;

  console.log('Room types with prices:', roomTypesWithPrices);

  return (
    <div className="space-y-2">
      <Label htmlFor="roomType" className="text-gray-700">Room Type</Label>
      <Select
        name="roomType"
        value={formData.roomType}
        onValueChange={onRoomTypeChange}
      >
        <SelectTrigger className="w-full py-5">
          <SelectValue placeholder={isLoading ? "Loading room types..." : "Select a room type"} />
        </SelectTrigger>
        <SelectContent>
          {roomTypesWithPrices.map((room) => (
            <SelectItem key={room.id} value={room.id}>
              <div className="flex flex-col">
                <span className="font-medium">{room.name}</span>
                <span className="text-sm text-gray-500">
                  CHF {room.pricePerNight} per night
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RoomSelectionFields;
