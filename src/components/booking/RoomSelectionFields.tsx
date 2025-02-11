
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROOM_TYPES, ROOM_TYPE_MAPPING } from "@/lib/constants";
import type { BookingFormData } from "@/types/booking";
import { usePrices } from "@/hooks/usePrices";

interface RoomSelectionFieldsProps {
  formData: BookingFormData;
  onRoomTypeChange: (value: string) => void;
}

const RoomSelectionFields = ({
  formData,
  onRoomTypeChange,
}: RoomSelectionFieldsProps) => {
  const { data: prices, isLoading } = usePrices(formData.checkin);

  // Update room type prices based on selected date
  const roomTypesWithPrices = ROOM_TYPES.map(room => {
    const dbRoomType = ROOM_TYPE_MAPPING[room.id];
    const priceData = prices?.find(p => p.room_type === dbRoomType);
    return {
      ...room,
      pricePerNight: priceData?.price || 0
    };
  });

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
