
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
  const { data: roomTypes } = useQuery({
    queryKey: ['roomTypesInfo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_types')
        .select('*')
        .order('price_range_min', { ascending: false });  // Changed to descending order

      if (error) throw error;
      return data;
    }
  });

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
        {roomTypes?.map((room) => (
          <TableRow key={room.code}>
            <TableCell>{room.display_name}</TableCell>
            <TableCell>{room.price_range_min} - {room.price_range_max}</TableCell>
            <TableCell>{room.min_stay_days} days</TableCell>
            <TableCell className="hidden md:table-cell">{room.description}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const getRoomTypes = async () => {
  const { data, error } = await supabase
    .from('room_types')
    .select('code, display_name')
    .order('price_range_min', { ascending: false });  // Changed to descending order

  if (error) {
    console.error('Error fetching room types:', error);
    throw error;
  }

  return data.map(room => ({
    id: room.code,
    name: room.display_name
  }));
};

const RoomSelectionFields = ({
  formData,
  onRoomTypeChange,
}: RoomSelectionFieldsProps) => {
  const { data: roomTypes, isLoading: isRoomTypesLoading } = useQuery({
    queryKey: ['roomTypes'],
    queryFn: getRoomTypes,
    staleTime: Infinity
  });

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
          <SelectValue placeholder={isRoomTypesLoading ? "Loading room types..." : "Select a room type"} />
        </SelectTrigger>
        <SelectContent>
          {roomTypes?.map((room) => (
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
