
import { useState, useEffect } from "react";
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
  handleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRoomTypeChange?: (value: string) => void;
}

const RoomInfo = () => {
  const { data: roomTypes } = useQuery({
    queryKey: ['roomTypesInfo'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('room_types')
          .select('*')
          .eq('active', true)  // Only select active room types
          .order('price_range_min', { ascending: true });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching room types info:', error);
        return [];
      }
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
  try {
    const { data, error } = await supabase
      .from('room_types')
      .select('code, display_name')
      .eq('active', true)  // Only select active room types
      .order('price_range_min', { ascending: true });

    if (error) {
      console.error('Error fetching room types:', error);
      throw error;
    }

    return data.map(room => ({
      id: room.code,
      name: room.display_name
    })) || [];
  } catch (error) {
    console.error('Error in getRoomTypes:', error);
    return [];
  }
};

const RoomSelectionFields = ({
  formData,
  handleInputChange,
  onRoomTypeChange,
}: RoomSelectionFieldsProps) => {
  const { data: roomTypes, isLoading: isRoomTypesLoading } = useQuery({
    queryKey: ['roomTypes'],
    queryFn: getRoomTypes,
    staleTime: Infinity,
    retry: 1
  });

  const { data: roomAvailability } = useQuery({
    queryKey: ['roomAvailability'],
    queryFn: async () => {
      try {
        const { data: roomTypesData, error: roomTypesError } = await supabase
          .from('room_types')
          .select('code, quantity');
        
        if (roomTypesError) throw roomTypesError;
        if (!roomTypesData) return {};

        const availability: Record<string, { total: number, booked: number }> = {};
        
        for (const room of roomTypesData) {
          const { count, error } = await supabase
            .from('invoices')
            .select('*', { count: 'exact', head: true })
            .eq('room_type', room.code)
            .neq('status', 'cancelled');

          if (error) {
            console.error(`Error fetching bookings for room type ${room.code}:`, error);
            continue;
          }

          availability[room.code] = {
            total: room.quantity || 0,
            booked: count || 0
          };
        }
        
        return availability;
      } catch (error) {
        console.error('Error fetching room availability:', error);
        return {};
      }
    },
    retry: 1
  });

  const isRoomSoldOut = (roomTypeCode: string) => {
    if (!roomAvailability || !roomAvailability[roomTypeCode]) return false;
    const { total, booked } = roomAvailability[roomTypeCode];
    return total - booked <= 0;
  };

  const handleRoomTypeChange = (value: string) => {
    if (isRoomSoldOut(value)) {
      return;
    }

    if (onRoomTypeChange) {
      onRoomTypeChange(value);
    } else if (handleInputChange) {
      handleInputChange({
        target: { name: "roomType", value }
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const getRoomAvailabilityDisplay = (roomTypeCode: string) => {
    if (!roomAvailability || !roomAvailability[roomTypeCode]) return '';
    
    const { total, booked } = roomAvailability[roomTypeCode];
    const available = Math.max(0, total - booked);

    if (available === 0) return ' (SOLD OUT)';
    if (available === 1) return ' (1 LEFT)';
    return '';
  };

  const getRoomItemStyles = (roomTypeCode: string) => {
    if (!roomAvailability || !roomAvailability[roomTypeCode]) return {};
    
    const { total, booked } = roomAvailability[roomTypeCode];
    const available = Math.max(0, total - booked);

    if (available === 0) return { color: 'rgb(239 68 68)' }; // text-red-500
    if (available === 1) return { color: 'rgb(249 115 22)' }; // text-orange-500
    return {};
  };

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
        value={formData.roomType || ""}
        onValueChange={handleRoomTypeChange}
      >
        <SelectTrigger className="w-full py-5">
          <SelectValue placeholder={isRoomTypesLoading ? "Loading room types..." : "Select a room type"} />
        </SelectTrigger>
        <SelectContent>
          {roomTypes?.map((room) => {
            const soldOut = isRoomSoldOut(room.id);
            return (
              <SelectItem 
                key={room.id} 
                value={room.id}
                style={getRoomItemStyles(room.id)}
                disabled={soldOut}
                className={soldOut ? "opacity-50 cursor-not-allowed" : ""}
              >
                {room.name}{getRoomAvailabilityDisplay(room.id)}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RoomSelectionFields;
