
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { HelpCircle } from "lucide-react";
import type { BookingFormData } from "@/types/booking";
import { usePrices } from "@/hooks/usePrices";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RoomSelectionFieldsProps {
  formData: BookingFormData;
  onRoomTypeChange: (value: string) => void;
}

const RoomInfo = () => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[150px]">Room Type</TableHead>
          <TableHead>Price Range (CHF)</TableHead>
          <TableHead>Min Stay</TableHead>
          <TableHead className="hidden md:table-cell">Description</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Hotel Room - Queen Bed</TableCell>
          <TableCell>230 - 360</TableCell>
          <TableCell>7.0 days</TableCell>
          <TableCell className="hidden md:table-cell">A private hotel room with a queen bed, daily cleaning, and space for two people. Suitable for couples or small families with a child.</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>3 Bedroom Apartment - Couples Room</TableCell>
          <TableCell>261 - 300</TableCell>
          <TableCell>7.0 days</TableCell>
          <TableCell className="hidden md:table-cell">A private room in a three-bedroom apartment with a queen bed, private entrance, and breakfast included. Suitable for two people, with space for a small child.</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>3-4 Bedroom Apartment - Queen Bed Room</TableCell>
          <TableCell>173 - 290</TableCell>
          <TableCell>7.0 days</TableCell>
          <TableCell className="hidden md:table-cell">A private room with a queen bed in a shared 3-4 bedroom apartment. Includes two shared bathrooms. The apartment has two bathrooms.</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>3-4 Bedroom Apartment - Twin Bed Room</TableCell>
          <TableCell>121 - 157</TableCell>
          <TableCell>14.0 days</TableCell>
          <TableCell className="hidden md:table-cell">A shared twin room in a 3-4 bedroom apartment. Two people per room, sharing bathrooms with others in the apartment. The apartment has two bathrooms.</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>2 Bedroom Apartment - Twin Bed Room</TableCell>
          <TableCell>86 - 100</TableCell>
          <TableCell>14.0 days</TableCell>
          <TableCell className="hidden md:table-cell">A twin bed in a shared two-bedroom apartment. One shared bathroom between five people.</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>2 Bedroom Apartment - Triple Bed Room</TableCell>
          <TableCell>81 - 88</TableCell>
          <TableCell>25.0 days</TableCell>
          <TableCell className="hidden md:table-cell">A single bed in a shared room with two others (three single beds in total). One shared bathroom between five people.</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

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
  const uniqueTypes = [...new Set(data.map(row => row.room_type))] as string[];
  
  // Map room types to their display names
  const roomTypeDisplayNames: { [key: string]: string } = {
    'hotel_room_queen': 'Hotel Room - Queen Bed',
    'apartment_3br_couples': '3 Bedroom Apartment - Couples Room',
    'apartment_3_4br_queen': '3-4 Bedroom Apartment - Queen Bed Room',
    'apartment_3_4br_twin': '3-4 Bedroom Apartment - Twin Bed Room',
    'apartment_2br_twin': '2 Bedroom Apartment - Twin Bed Room',
    'apartment_2br_triple': '2 Bedroom Apartment - Triple Bed Room'
  };
  
  return uniqueTypes.map(type => ({
    id: type,
    name: roomTypeDisplayNames[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
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
    staleTime: Infinity
  });

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
      <div className="flex items-center gap-2">
        <Label htmlFor="roomType" className="text-gray-700">Room Type</Label>
        <Popover>
          <PopoverTrigger>
            <HelpCircle className="h-4 w-4 text-gray-500 hover:text-gray-700 cursor-help" />
          </PopoverTrigger>
          <PopoverContent className="w-[800px] p-4" align="start">
            <div className="max-h-[600px] overflow-auto">
              <h3 className="font-semibold mb-4">Room Information</h3>
              <RoomInfo />
            </div>
          </PopoverContent>
        </Popover>
      </div>
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
              {room.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RoomSelectionFields;
