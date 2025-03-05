
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DateRangeSelector from "./DateRangeSelector";
import type { BookingFormData } from "@/types/booking";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parse, format } from "date-fns";
import { useEffect } from "react";

interface DateSelectionFieldsProps {
  formData: BookingFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  minDate: string;
  maxDate: string;
}

const PROGRAM_BLOCKS = [
  {
    name: "Intro Days",
    startDate: new Date(2025, 4, 1),
    endDate: new Date(2025, 4, 3),
    color: "#E5DEFF",
    underlineColor: "#9b87f5",
  },
  {
    name: "Swiss Governance & New Societies Days",
    startDate: new Date(2025, 4, 4),
    endDate: new Date(2025, 4, 9),
    color: "#D3E4FD",
    underlineColor: "#0EA5E9",
  },
  {
    name: "Cypherpunk & Solarpunk Days",
    startDate: new Date(2025, 4, 10),
    endDate: new Date(2025, 4, 17),
    color: "#F2FCE2",
    underlineColor: "#8B5CF6",
  },
  {
    name: "Build Week",
    startDate: new Date(2025, 4, 19),
    endDate: new Date(2025, 4, 23),
    color: "#FEC6A1",
    underlineColor: "#F97316",
  },
  {
    name: "Zuitzerland Summit 2025",
    startDate: new Date(2025, 4, 24),
    endDate: new Date(2025, 4, 26),
    color: "#FFDEE2",
    underlineColor: "#D946EF",
  },
];

const DateSelectionFields = ({
  formData,
  handleInputChange,
  minDate,
  maxDate,
}: DateSelectionFieldsProps) => {
  const handleDateRangeChange = (startDate: string, endDate: string) => {
    console.log('DateSelectionFields: handleDateRangeChange:', { startDate, endDate });
    
    // Update check-in date
    handleInputChange({
      target: { name: "checkin", value: startDate }
    } as React.ChangeEvent<HTMLInputElement>);
    
    // Update check-out date
    handleInputChange({
      target: { name: "checkout", value: endDate }
    } as React.ChangeEvent<HTMLInputElement>);
    
    // Reset price if dates are cleared
    if (!startDate || !endDate) {
      console.log('Dates cleared, explicitly resetting price to 0');
      handleInputChange({
        target: { name: "price", value: "0" }
      } as React.ChangeEvent<HTMLInputElement>);
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
                            
  // Add an effect to ensure price is recalculated when dates change
  useEffect(() => {
    console.log("DateSelectionFields: Dates changed effect triggered", {
      checkin: formData.checkin,
      checkout: formData.checkout
    });
  }, [formData.checkin, formData.checkout]);

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Program Calendar</h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {PROGRAM_BLOCKS.map((block) => (
            <div key={block.name} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: block.color }}
              ></div>
              <span className="text-sm text-gray-600">{block.name}</span>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <h3 className="text-center text-base font-light text-gray-900">May 2025</h3>
          <img 
            src="/lovable-uploads/0badf122-3f2e-4396-a3fb-0c353bec112f.png" 
            alt="May 2025 Program Calendar"
            className="w-full max-w-2xl mx-auto rounded-lg"
          />
        </div>
      </div>

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
