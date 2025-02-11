
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DateRangeSelector from "./DateRangeSelector";
import type { BookingFormData } from "@/types/booking";

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
    color: "#E5DEFF", // Solid Purple
    underlineColor: "#9b87f5",
  },
  {
    name: "Swiss Governance & New Societies Days",
    startDate: new Date(2025, 4, 4),
    endDate: new Date(2025, 4, 9),
    color: "#D3E4FD", // Solid Blue
    underlineColor: "#0EA5E9",
  },
  {
    name: "Cypherpunk & Solarpunk Days",
    startDate: new Date(2025, 4, 10),
    endDate: new Date(2025, 4, 17),
    color: "#F2FCE2", // Solid Green
    underlineColor: "#8B5CF6",
  },
  {
    name: "Build Week",
    startDate: new Date(2025, 4, 19),
    endDate: new Date(2025, 4, 23),
    color: "#FEC6A1", // Solid Orange
    underlineColor: "#F97316",
  },
  {
    name: "Zuitzerland Summit 2025",
    startDate: new Date(2025, 4, 24),
    endDate: new Date(2025, 4, 26),
    color: "#FFDEE2", // Solid Pink
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
    handleInputChange({
      target: { name: "checkin", value: startDate }
    } as React.ChangeEvent<HTMLInputElement>);
    
    handleInputChange({
      target: { name: "checkout", value: endDate }
    } as React.ChangeEvent<HTMLInputElement>);
  };

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
            src="/lovable-uploads/1042fc8f-7fd2-45d2-a91d-bd0e2c012279.png" 
            alt="May 2025 Program Calendar"
            className="w-full max-w-2xl mx-auto rounded-lg"
          />
        </div>
      </div>

      <DateRangeSelector onDateRangeChange={handleDateRangeChange} />
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="checkin" className="text-gray-700">Check-in</Label>
          <div className="relative">
            <Input
              id="checkin"
              name="checkin"
              type="date"
              required
              min="2025-05-01"
              max="2025-05-26"
              value={formData.checkin}
              onChange={handleInputChange}
              className="date-picker pl-4 pr-10 py-5 text-gray-900 bg-gray-50"
              readOnly
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
              min={formData.checkin || "2025-05-01"}
              max="2025-05-26"
              value={formData.checkout}
              onChange={handleInputChange}
              className="date-picker pl-4 pr-10 py-5 text-gray-900 bg-gray-50"
              readOnly
            />
            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateSelectionFields;
