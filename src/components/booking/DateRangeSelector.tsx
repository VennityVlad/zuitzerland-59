
import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface DateRange {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  status?: "sold-out" | "limited" | "available";
  contactEmail?: string;
}

const DATE_RANGES: DateRange[] = [
  {
    id: "block1",
    name: "Block 1",
    startDate: "2025-05-03",
    endDate: "2025-05-09",
    description: "Intro Days (May 3-5): Community, Culture, Media, Philosophy & Truth-Seeking\nSwiss Governance & New Societies Days (May 6-9): Democracy, Network States & Start-up Cities",
    status: "sold-out"
  },
  {
    id: "block2",
    name: "Block 2",
    startDate: "2025-05-10",
    endDate: "2025-05-17",
    description: "Cypherpunk Days: Frontier Tech - Ethereum, Biotech, AI x Crypto\nSolarpunk Days: Living Design Week",
    status: "limited",
    contactEmail: "team@zuitzerland.ch"
  },
  {
    id: "block3",
    name: "Block 3",
    startDate: "2025-05-18",
    endDate: "2025-05-26",
    description: "Build Week (May 19-23): Hackathon and Govathon\nZuitzerland Summit 2025 (May 24-26)",
    status: "available"
  }
];

interface DateRangeSelectorProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

const DateRangeSelector = ({ onDateRangeChange }: DateRangeSelectorProps) => {
  const [selectedRanges, setSelectedRanges] = React.useState<string[]>([]);

  React.useEffect(() => {
    // Log all date ranges for debugging
    console.log('Available date ranges:', DATE_RANGES);
  }, []);

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
    
    if (newSelectedRanges.length === 0) {
      onDateRangeChange("", "");
      return;
    }
    
    const selectedDateRanges = DATE_RANGES.filter(range => newSelectedRanges.includes(range.id));
    console.log('Selected date range objects:', selectedDateRanges);

    if (selectedDateRanges.length === 0) {
      onDateRangeChange("", "");
      return;
    }
    
    const startDatesAsObjects = selectedDateRanges.map(range => new Date(range.startDate));
    const endDatesAsObjects = selectedDateRanges.map(range => new Date(range.endDate));
    
    const earliestStartDate = new Date(Math.min(...startDatesAsObjects.map(d => d.getTime())));
    const latestEndDate = new Date(Math.max(...endDatesAsObjects.map(d => d.getTime())));
    
    const earliestStart = format(earliestStartDate, 'yyyy-MM-dd');
    const latestEnd = format(latestEndDate, 'yyyy-MM-dd');
    
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

  const renderStatusBadge = (status?: string) => {
    if (!status || status === 'available') return null;

    if (status === 'sold-out') {
      return (
        <Badge variant="destructive" className="ml-2">
          Sold Out
        </Badge>
      );
    }

    if (status === 'limited') {
      return (
        <Badge variant="secondary" className="ml-2 bg-amber-500 hover:bg-amber-600">
          Limited Capacity
        </Badge>
      );
    }
  };

  const handleEmailClick = (e: React.MouseEvent, email: string, blockName: string) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `mailto:${email}?subject=Request to Book ${blockName}`;
  };

  const renderDateRangeItem = (range: DateRange) => {
    const isDisabled = range.status === 'sold-out' || range.status === 'limited';
    const isLimitedWithEmail = range.status === 'limited' && range.contactEmail;
    
    const containerClasses = `flex items-start space-x-3 p-3 rounded-lg border ${
      isDisabled 
        ? 'border-gray-200 bg-gray-50' 
        : 'border-gray-200 hover:border-purple-500 transition-colors'
    } ${isLimitedWithEmail ? 'cursor-pointer' : ''}`;

    const containerProps: React.HTMLAttributes<HTMLDivElement> = {
      className: containerClasses,
      ...(isLimitedWithEmail ? {
        onClick: (e) => handleEmailClick(e, range.contactEmail!, range.name)
      } : {})
    };
    
    return (
      <Tooltip key={range.id}>
        <div {...containerProps}>
          <TooltipTrigger asChild>
            <div className="flex items-center space-x-3 flex-1">
              <Checkbox
                id={range.id}
                checked={selectedRanges.includes(range.id)}
                onCheckedChange={(checked) => handleCheckboxChange(range.id, checked as boolean)}
                disabled={isDisabled}
                className="h-5 w-5 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                onClick={(e) => e.stopPropagation()} // Prevent container click when clicking checkbox
              />
              <div className="flex justify-between items-center w-full">
                <label
                  htmlFor={isDisabled ? undefined : range.id}
                  className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed flex-1 ${
                    isDisabled ? 'text-gray-500' : 'cursor-pointer text-gray-900'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="font-semibold">{range.name}</span>
                    <span className="text-sm text-gray-600 font-medium ml-4">
                      {formatDateEuropean(range.startDate)} - {formatDateEuropean(range.endDate)}
                    </span>
                    {renderStatusBadge(range.status)}
                  </div>
                </label>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm whitespace-pre-line">
            <p className="text-sm">{range.description}</p>
          </TooltipContent>
        </div>
      </Tooltip>
    );
  };

  return (
    <div className="space-y-4 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="border-b pb-4">
        <h3 className="text-xl font-semibold text-gray-900">Select Your Program Dates</h3>
        <p className="text-sm text-gray-600 mt-1">Choose one or more program blocks to attend (format: DD/MM)</p>
      </div>
      
      <TooltipProvider>
        <div className="space-y-3">
          {DATE_RANGES.map(range => renderDateRangeItem(range))}
        </div>
      </TooltipProvider>
    </div>
  );
};

export default DateRangeSelector;
