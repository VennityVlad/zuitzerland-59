
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROOM_TYPE_MAPPING } from "@/lib/constants";
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
    .limit(1)
    .order('date', { ascending: true })
    .distinct('room_type');

  if (error) throw error;

  // Map the database room types to frontend room types using our mapping
  return data.map(({ room_type }) => {
    const frontendType = Object.entries(ROOM_TYPE_MAPPING)
      .find(([_, dbType]) => dbType === room_type)?.[0];

    if (!frontendType) {
      console.error('No frontend mapping found for room type:', room_type);
      return null;
    }

    return {
      id: frontendType,
      name: getRoomTypeName(room_type),
      description: getRoomTypeDescription(room_type)
    };
  }).filter(Boolean); // Remove any null values
};

const getRoomTypeName = (roomType: string): string => {
  switch (roomType) {
    case 'hotel_room_queen':
      return 'Hotel room / Queen bed / Daily Cleaning';
    case 'apartment_3br_couple':
      return '3 bedroom apartment - couples room';
    case 'apartment_3_4br_queen_single':
      return '3 or 4 bedroom apartment - queen bed room';
    case 'apartment_3_4br_twin_single':
      return '3 bedroom or 4 bedroom apartment - twin bed room';
    case 'apartment_2br_twin_single':
      return '2 bedroom apartment - twin bed room';
    case 'apartment_2br_triple':
      return '2 bedroom apartment - triple bed room';
    default:
      return roomType;
  }
};

const getRoomTypeDescription = (roomType: string): string => {
  switch (roomType) {
    case 'hotel_room_queen':
      return '2 people in private room incl. breakfast';
    case 'apartment_3br_couple':
      return 'Two people incl. breakfast, private entrance';
    case 'apartment_3_4br_queen_single':
      return 'Single person not sharing, two bathrooms between 6-8 people, includes breakfast';
    case 'apartment_3_4br_twin_single':
      return 'Single person, two bathrooms between 6-8 people, includes breakfast';
    case 'apartment_2br_twin_single':
      return 'Single person, one bathroom between five people, includes breakfast';
    case 'apartment_2br_triple':
      return 'Single person, one bathroom between five people, includes breakfast';
    default:
      return '';
  }
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
    const dbRoomType = ROOM_TYPE_MAPPING[room.id];
    const priceData = prices?.find(p => p.room_type === dbRoomType);
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
