
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
    id: "intro",
    name: "Intro Days",
    startDate: "2025-05-01",
    endDate: "2025-05-03",
    description: "Community, Culture, Media, Philosophy & Truth-Seeking"
  },
  {
    id: "swiss",
    name: "Swiss Governance Days",
    startDate: "2025-05-04",
    endDate: "2025-05-10",
    description: "Swiss governance and democracy"
  },
  {
    id: "societies",
    name: "New Societies Days",
    startDate: "2025-05-04",
    endDate: "2025-05-10",
    description: "Network States, Network Societies & Start-up Cities"
  },
  {
    id: "cypherpunk",
    name: "Cypherpunk Days",
    startDate: "2025-05-11",
    endDate: "2025-05-18",
    description: "Frontier Tech: Ethereum, Biotech, AI x Crypto"
  },
  {
    id: "solarpunk",
    name: "Solarpunk Days",
    startDate: "2025-05-11",
    endDate: "2025-05-18",
    description: "Living Design Week"
  },
  {
    id: "build",
    name: "Build Week",
    startDate: "2025-05-19",
    endDate: "2025-05-23",
    description: "Hackathon and Govathon"
  },
  {
    id: "summit",
    name: "Zuitzerland Summit 2025",
    startDate: "2025-05-24",
    endDate: "2025-05-26",
    description: "Summit Weekend"
  }
];

interface DateRangeSelectorProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

const DateRangeSelector = ({ onDateRangeChange }: DateRangeSelectorProps) => {
  const handleValueChange = (value: string[]) => {
    console.log('Selected values:', value); // Add logging to debug selection state
    
    if (value.length === 0) {
      onDateRangeChange("", "");
      return;
    }
    
    // Find the earliest start date and latest end date from selected ranges
    const selectedRanges = DATE_RANGES.filter(range => value.includes(range.id));
    const startDates = selectedRanges.map(range => range.startDate);
    const endDates = selectedRanges.map(range => range.endDate);
    
    const earliestStart = startDates.sort()[0];
    const latestEnd = endDates.sort().reverse()[0];
    
    onDateRangeChange(earliestStart, latestEnd);
  };

  return (
    <div className="space-y-4 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="border-b pb-4">
        <h3 className="text-xl font-semibold text-gray-900">Select Your Program Dates</h3>
        <p className="text-sm text-gray-600 mt-1">Choose one or more program periods to attend</p>
      </div>
      <TooltipProvider>
        <ToggleGroup 
          type="multiple" 
          className="flex flex-col gap-3"
          onValueChange={handleValueChange}
        >
          {DATE_RANGES.map((range) => (
            <Tooltip key={range.id}>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value={range.id}
                  className="group w-full justify-start rounded-lg border-2 border-transparent hover:border-blue-400/50 transition-colors duration-200 data-[state=on]:border-blue-500 data-[state=on]:bg-blue-50"
                  aria-label={range.name}
                >
                  <div className="flex flex-col p-4 w-full">
                    <div className="flex justify-between items-center w-full">
                      <span className="font-semibold text-gray-900 text-left">{range.name}</span>
                      <span className="text-sm text-gray-600 font-medium ml-4">
                        {range.startDate.split('-').slice(1).join('/')} - {range.endDate.split('-').slice(1).join('/')}
                      </span>
                    </div>
                  </div>
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">{range.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </ToggleGroup>
      </TooltipProvider>
    </div>
  );
};

export default DateRangeSelector;
