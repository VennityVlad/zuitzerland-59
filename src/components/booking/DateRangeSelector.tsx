
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
    
    if (newSelectedRanges.length === 0) {
      onDateRangeChange("", "");
      return;
    }
    
    const selectedDateRanges = DATE_RANGES.filter(range => newSelectedRanges.includes(range.id));
    const startDates = selectedDateRanges.map(range => range.startDate);
    const endDates = selectedDateRanges.map(range => range.endDate);
    
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
                          {range.startDate.split('-').slice(1).join('/')} - {range.endDate.split('-').slice(1).join('/')}
                        </span>
                      </label>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
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
