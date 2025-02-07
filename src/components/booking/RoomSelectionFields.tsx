import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROOM_TYPES } from "@/lib/constants";
import type { BookingFormData } from "@/types/booking";

interface RoomSelectionFieldsProps {
  formData: BookingFormData;
  onRoomTypeChange: (value: string) => void;
}

const RoomSelectionFields = ({
  formData,
  onRoomTypeChange,
}: RoomSelectionFieldsProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="roomType" className="text-gray-700">Room Type</Label>
      <Select
        name="roomType"
        value={formData.roomType}
        onValueChange={onRoomTypeChange}
      >
        <SelectTrigger className="w-full py-5">
          <SelectValue placeholder="Select a room type" />
        </SelectTrigger>
        <SelectContent>
          {ROOM_TYPES.map((room) => (
            <SelectItem key={room.id} value={room.id}>
              <div className="flex flex-col">
                <span className="font-medium">{room.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RoomSelectionFields;