
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DateRangeSelector from "./DateRangeSelector";
import type { BookingFormData } from "@/types/booking";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parse, format } from "date-fns";
import { useBookingSettings } from "@/hooks/useBookingSettings";
import { DatePicker } from "@/components/ui/date-picker";
import { useEffect } from "react";

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
  const { settings, isLoading: settingsLoading } = useBookingSettings();

  useEffect(() => {
    console.log('DateSelectionFields current form data:', { 
      checkin: formData.checkin, 
      checkout: formData.checkout 
    });
  }, [formData.checkin, formData.checkout]);

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    console.log('Date range changed to:', { startDate, endDate });
    
    // Ensure we properly format and validate the dates
    if (!startDate || !endDate) {
      console.log('Empty date range received');
      return;
    }

    try {
      // Validate that they are proper dates
      const parsedStartDate = parse(startDate, 'yyyy-MM-dd', new Date());
      const parsedEndDate = parse(endDate, 'yyyy-MM-dd', new Date());
      
      const formattedStartDate = format(parsedStartDate, 'yyyy-MM-dd');
      const formattedEndDate = format(parsedEndDate, 'yyyy-MM-dd');
      
      console.log('Formatted dates:', { formattedStartDate, formattedEndDate });
      
      handleInputChange({
        target: { name: "checkin", value: formattedStartDate }
      } as React.ChangeEvent<HTMLInputElement>);
      
      handleInputChange({
        target: { name: "checkout", value: formattedEndDate }
      } as React.ChangeEvent<HTMLInputElement>);
    } catch (error) {
      console.error('Error processing dates:', error);
    }
  };

  const handleDatePickerChange = (field: 'checkin' | 'checkout', date?: Date) => {
    if (!date) return;
    
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      console.log(`Setting ${field} date:`, formattedDate);
      
      handleInputChange({
        target: { name: field, value: formattedDate }
      } as React.ChangeEvent<HTMLInputElement>);
    } catch (error) {
      console.error('Error formatting date picker date:', error);
    }
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

    try {
      const startDate = parse(formData.checkin, 'yyyy-MM-dd', new Date());
      const endDate = parse(formData.checkout, 'yyyy-MM-dd', new Date());
      const days = differenceInDays(endDate, startDate);
      
      console.log('Minimum stay check:', {
        checkin: formData.checkin,
        checkout: formData.checkout,
        days,
        minRequired: roomTypeDetails.min_stay_days,
        meets: days >= (roomTypeDetails.min_stay_days || 0)
      });

      return days >= (roomTypeDetails.min_stay_days || 0);
    } catch (error) {
      console.error('Error calculating stay duration:', error);
      return true;
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = parse(dateStr, 'yyyy-MM-dd', new Date());
      return format(date, 'MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting display date:', error);
      return dateStr;
    }
  };

  const showMinStayWarning = formData.checkin && 
                            formData.checkout && 
                            formData.roomType && 
                            roomTypeDetails &&
                            !meetsMinimumStay();

  const minDateObj = new Date(minDate);
  const maxDateObj = new Date(maxDate);
  
  const checkinDate = formData.checkin ? new Date(formData.checkin) : undefined;
  const checkoutDate = formData.checkout ? new Date(formData.checkout) : undefined;

  return (
    <div className="space-y-6">
      {/* Show DateRangeSelector only if blockEnabled is true */}
      {settings.blockEnabled && (
        <DateRangeSelector onDateRangeChange={handleDateRangeChange} />
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="checkin" className="text-gray-700">Check-in</Label>
          {settings.blockEnabled ? (
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
          ) : (
            <DatePicker
              date={checkinDate}
              onDateChange={(date) => handleDatePickerChange('checkin', date)}
              fromDate={minDateObj}
              toDate={maxDateObj}
              placeholder="Select check-in date"
              className="w-full"
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkout" className="text-gray-700">Check-out</Label>
          {settings.blockEnabled ? (
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
          ) : (
            <DatePicker
              date={checkoutDate}
              onDateChange={(date) => handleDatePickerChange('checkout', date)}
              fromDate={checkinDate || minDateObj}
              toDate={maxDateObj}
              placeholder="Select check-out date"
              disabled={!formData.checkin}
              className="w-full"
            />
          )}
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
