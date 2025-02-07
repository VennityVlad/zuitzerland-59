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
    <>
      <div className="space-y-2">
        <Label htmlFor="roomType">Room Type</Label>
        <Select
          name="roomType"
          value={formData.roomType}
          onValueChange={onRoomTypeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a room type" />
          </SelectTrigger>
          <SelectContent>
            {ROOM_TYPES.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.name} - ${room.pricePerNight}/night
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Total Price</Label>
        <div className="h-10 px-3 py-2 rounded-md border bg-muted text-muted-foreground">
          ${formData.price}
        </div>
      </div>
    </>
  );
};

export default RoomSelectionFields;