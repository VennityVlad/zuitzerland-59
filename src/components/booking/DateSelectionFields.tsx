
import { CalendarIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { BookingFormData } from "@/types/booking";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parse, format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DateSelectionFieldsProps {
  formData: BookingFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  minDate: string;
  maxDate: string;
}

const DATE_RANGES = [
  {
    id: "block1",
    name: "Block 1",
    startDate: "2025-05-01",
    endDate: "2025-05-09",
    description: "Intro Days (May 1-3): Community, Culture, Media, Philosophy & Truth-Seeking\nSwiss Governance & New Societies Days (May 4-9): Democracy, Network States & Start-up Cities"
  },
  {
    id: "block2",
    name: "Block 2",
    startDate: "2025-05-10",
    endDate: "2025-05-17",
    description: "Cypherpunk Days: Frontier Tech - Ethereum, Biotech, AI x Crypto\nSolarpunk Days: Living Design Week"
  },
  {
    id: "block3",
    name: "Block 3",
    startDate: "2025-05-18",
    endDate: "2025-05-26",
    description: "Build Week (May 19-23): Hackathon and Govathon\nZuitzerland Summit 2025 (May 24-26)"
  }
];

const DateSelectionFields = ({
  formData,
  handleInputChange,
  minDate,
  maxDate,
}: DateSelectionFieldsProps) => {
  // Query to check pricing availability
  const { data: availablePricing } = useQuery({
    queryKey: ['price-check', formData.checkin, formData.checkout, formData.roomType],
    queryFn: async () => {
      if (!formData.checkin || !formData.checkout || !formData.roomType) return null;
      
      const startDate = parse(formData.checkin, 'yyyy-MM-dd', new Date());
      const endDate = parse(formData.checkout, 'yyyy-MM-dd', new Date());
      const days = differenceInDays(endDate, startDate);
      
      const { data, error } = await supabase
        .from('prices')
        .select('*')
        .eq('room_type', formData.roomType)
        .lte('duration', days)
        .order('duration', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data;
    },
    enabled: Boolean(formData.checkin && formData.checkout && formData.roomType)
  });

  const showPricingWarning = formData.checkin && 
                            formData.checkout && 
                            formData.roomType && 
                            (!availablePricing || availablePricing.length === 0);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = parse(dateStr, 'yyyy-MM-dd', new Date());
    return format(date, 'MMMM d, yyyy');
  };

  const handleDateRangeCheckboxChange = (rangeId: string, checked: boolean) => {
    const selectedRange = DATE_RANGES.find(range => range.id === rangeId);
    if (!selectedRange) return;

    if (checked) {
      handleInputChange({
        target: { name: "checkin", value: selectedRange.startDate }
      } as React.ChangeEvent<HTMLInputElement>);
      
      handleInputChange({
        target: { name: "checkout", value: selectedRange.endDate }
      } as React.ChangeEvent<HTMLInputElement>);
    } else if (formData.checkin === selectedRange.startDate && formData.checkout === selectedRange.endDate) {
      handleInputChange({
        target: { name: "checkin", value: "" }
      } as React.ChangeEvent<HTMLInputElement>);
      
      handleInputChange({
        target: { name: "checkout", value: "" }
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="border-b pb-4">
          <h3 className="text-xl font-semibold text-gray-900">Select Your Program Dates</h3>
          <p className="text-sm text-gray-600 mt-1">Choose one or more program blocks to attend</p>
        </div>
        
        <TooltipProvider>
          <div className="space-y-3">
            {DATE_RANGES.map((range) => (
              <Tooltip key={range.id}>
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:border-purple-500 transition-colors">
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-3 flex-1">
                      <Checkbox
                        id={range.id}
                        checked={formData.checkin === range.startDate && formData.checkout === range.endDate}
                        onCheckedChange={(checked) => handleDateRangeCheckboxChange(range.id, checked as boolean)}
                        className="h-5 w-5 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      />
                      <div className="flex justify-between items-center w-full">
                        <label
                          htmlFor={range.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          <span className="font-semibold text-gray-900">{range.name}</span>
                          <span className="text-sm text-gray-600 font-medium ml-4">
                            {range.startDate.split('-').slice(1).join('/')} - {range.endDate.split('-').slice(1).join('/')}
                          </span>
                        </label>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm whitespace-pre-line">
                    <p className="text-sm">{range.description}</p>
                  </TooltipContent>
                </div>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="checkin" className="text-gray-700">Check-in Date</Label>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-900 font-medium">
                {formData.checkin ? formatDisplayDate(formData.checkin) : 'Not selected'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkout" className="text-gray-700">Check-out Date</Label>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-900 font-medium">
                {formData.checkout ? formatDisplayDate(formData.checkout) : 'Not selected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showPricingWarning && (
        <Alert variant="destructive">
          <AlertDescription>
            The selected stay duration does not meet the minimum stay requirement for this room type. Please adjust your dates or select a different room type.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DateSelectionFields;
