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
    <>
      <div className="space-y-2">
        <Label htmlFor="checkin">Check-in Date</Label>
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
            className="date-picker"
          />
          <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="checkout">Check-out Date</Label>
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
            className="date-picker"
          />
          <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>
    </>
  );
};

export default DateSelectionFields;