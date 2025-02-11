
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

interface RoomSelectionFieldsProps {
  formData: BookingFormData;
  onRoomTypeChange: (value: string) => void;
}

const getRoomTypes = async () => {
  const { data, error } = await supabase
    .from('prices')
    .select('room_type')
    .order('date', { ascending: true })
    .then(result => {
      // Get unique room types
      const uniqueTypes = Array.from(new Set(result.data?.map(row => row.room_type)));
      return { data: uniqueTypes.map(type => ({ room_type: type })), error: result.error };
    });

  if (error) throw error;
  return data.map(({ room_type }) => ({
    id: room_type,
    name: room_type.split('_').join(' ').replace(/\b\w/g, c => c.toUpperCase())
  }));
};

const RoomSelectionFields = ({
  formData,
  onRoomTypeChange,
}: RoomSelectionFieldsProps) => {
  const { data: prices, isLoading: isPricesLoading } = usePrices(formData.checkin);
  const { data: roomTypes, isLoading: isRoomTypesLoading } = useQuery({
    queryKey: ['roomTypes'],
    queryFn: getRoomTypes
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

  return (
    <div className="space-y-2">
      <Label htmlFor="roomType" className="text-gray-700">Room Type</Label>
      <Select
        name="roomType"
        value={formData.roomType}
        onValueChange={onRoomTypeChange}
      >
        <SelectTrigger className="w-full py-5">
          <SelectValue placeholder={isLoading ? "Loading prices..." : "Select a room type"} />
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
