
import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DateRange {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
}

const DATE_RANGES: DateRange[] = [
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

interface DateRangeSelectorProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

const DateRangeSelector = ({ onDateRangeChange }: DateRangeSelectorProps) => {
  const [selectedRanges, setSelectedRanges] = React.useState<string[]>([]);

  const handleCheckboxChange = (rangeId: string, checked: boolean) => {
    console.log('Checkbox change:', rangeId, checked);
    let newSelectedRanges: string[];
    
    if (checked) {
      newSelectedRanges = [...selectedRanges, rangeId];
    } else {
      newSelectedRanges = selectedRanges.filter(id => id !== rangeId);
    }
    
    setSelectedRanges(newSelectedRanges);
    console.log('New selected ranges:', newSelectedRanges);
    
    // Clear the dates when no selections
    if (newSelectedRanges.length === 0) {
      console.log('No dates selected, clearing date range');
      onDateRangeChange("", "");
      return;
    }
    
    const selectedDateRanges = DATE_RANGES.filter(range => newSelectedRanges.includes(range.id));
    
    // Extract dates and convert to Date objects for proper comparison
    const startDatesAsObjects = selectedDateRanges.map(range => new Date(range.startDate));
    const endDatesAsObjects = selectedDateRanges.map(range => new Date(range.endDate));
    
    // Find earliest start date and latest end date by comparing Date objects
    const earliestStartDate = new Date(Math.min(...startDatesAsObjects.map(d => d.getTime())));
    const latestEndDate = new Date(Math.max(...endDatesAsObjects.map(d => d.getTime())));
    
    // Convert back to string format
    const earliestStart = earliestStartDate.toISOString().split('T')[0];
    const latestEnd = latestEndDate.toISOString().split('T')[0];
    
    console.log('Calculated date range:', {
      earliestStart,
      latestEnd,
      startDates: selectedDateRanges.map(r => r.startDate),
      endDates: selectedDateRanges.map(r => r.endDate)
    });
    
    onDateRangeChange(earliestStart, latestEnd);
  };

  const formatDateEuropean = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}`;
  };

  return (
    <div className="space-y-4 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="border-b pb-4">
        <h3 className="text-xl font-semibold text-gray-900">Select Your Program Dates</h3>
        <p className="text-sm text-gray-600 mt-1">Choose one or more program blocks to attend (format: DD/MM)</p>
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
                      checked={selectedRanges.includes(range.id)}
                      onCheckedChange={(checked) => handleCheckboxChange(range.id, checked as boolean)}
                      className="h-5 w-5 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                    />
                    <div className="flex justify-between items-center w-full">
                      <label
                        htmlFor={range.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        <span className="font-semibold text-gray-900">{range.name}</span>
                        <span className="text-sm text-gray-600 font-medium ml-4">
                          {formatDateEuropean(range.startDate)} - {formatDateEuropean(range.endDate)}
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
  );
};

export default DateRangeSelector;
