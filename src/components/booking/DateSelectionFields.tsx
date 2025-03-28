
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DateRangeSelector from "./DateRangeSelector";
import type { BookingFormData } from "@/types/booking";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parse, format } from "date-fns";
import { EventCalendar } from "@/components/calendar/EventCalendar";

interface DateSelectionFieldsProps {
  formData: BookingFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  minDate: string;
  maxDate: string;
}

const DateSelectionFields = ({
  formData,
  handleInputChange,
  minDate,
  maxDate,
}: DateSelectionFieldsProps) => {
  const handleDateRangeChange = (startDate: string, endDate: string) => {
    handleInputChange({
      target: { name: "checkin", value: startDate }
    } as React.ChangeEvent<HTMLInputElement>);
    
    handleInputChange({
      target: { name: "checkout", value: endDate }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const { data: roomTypeDetails } = useQuery({
    queryKey: ['roomTypeDetails', formData.roomType],
    queryFn: async () => {
      if (!formData.roomType) return null;
      
      const { data, error } = await supabase
        .from('room_types')
        .select('min_stay_days, display_name')
        .eq('code', formData.roomType)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: Boolean(formData.roomType)
  });

  const meetsMinimumStay = (): boolean => {
    if (!formData.checkin || !formData.checkout || !formData.roomType || !roomTypeDetails) {
      return true; // Don't show warning if we don't have all the data
    }

    const startDate = parse(formData.checkin, 'yyyy-MM-dd', new Date());
    const endDate = parse(formData.checkout, 'yyyy-MM-dd', new Date());
    const days = differenceInDays(endDate, startDate);

    return days >= (roomTypeDetails.min_stay_days || 0);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = parse(dateStr, 'yyyy-MM-dd', new Date());
    return format(date, 'MMMM d, yyyy');
  };

  const showMinStayWarning = formData.checkin && 
                            formData.checkout && 
                            formData.roomType && 
                            roomTypeDetails &&
                            !meetsMinimumStay();

  return (
    <div className="space-y-6">
      {/* Event Calendar */}
      <EventCalendar />

      <DateRangeSelector onDateRangeChange={handleDateRangeChange} />
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="checkin" className="text-gray-700">Check-in</Label>
          <div className="relative bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-900">
                {formData.checkin ? formatDisplayDate(formData.checkin) : 'Select date'}
              </span>
            </div>
            <Input
              id="checkin"
              name="checkin"
              type="date"
              required
              min="2025-05-01"
              max="2025-05-26"
              value={formData.checkin}
              onChange={handleInputChange}
              className="hidden"
              readOnly
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkout" className="text-gray-700">Check-out</Label>
          <div className="relative bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-900">
                {formData.checkout ? formatDisplayDate(formData.checkout) : 'Select date'}
              </span>
            </div>
            <Input
              id="checkout"
              name="checkout"
              type="date"
              required
              min={formData.checkin || "2025-05-01"}
              max="2025-05-26"
              value={formData.checkout}
              onChange={handleInputChange}
              className="hidden"
              readOnly
            />
          </div>
        </div>
      </div>

      {showMinStayWarning && (
        <Alert variant="destructive">
          <AlertDescription>
            This room type ({roomTypeDetails?.display_name}) requires a minimum stay of {roomTypeDetails?.min_stay_days} days.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DateSelectionFields;
