
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BookingFormData } from "@/types/booking";

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
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="checkin" className="text-gray-700">Check-in</Label>
        <div className="relative">
          <Input
            id="checkin"
            name="checkin"
            type="date"
            required
            min={minDate}
            max={maxDate}
            value={formData.checkin}
            onChange={handleInputChange}
            className="date-picker pl-4 pr-10 py-5 text-gray-900"
          />
          <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="checkout" className="text-gray-700">Check-out</Label>
        <div className="relative">
          <Input
            id="checkout"
            name="checkout"
            type="date"
            required
            min={formData.checkin || minDate}
            max={maxDate}
            value={formData.checkout}
            onChange={handleInputChange}
            className="date-picker pl-4 pr-10 py-5 text-gray-900"
          />
          <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default DateSelectionFields;
