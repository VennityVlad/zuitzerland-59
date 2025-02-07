import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
    endDate: "2025-05-25",
    description: "Summit Weekend"
  }
];

interface DateRangeSelectorProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

const DateRangeSelector = ({ onDateRangeChange }: DateRangeSelectorProps) => {
  const handleValueChange = (value: string[]) => {
    if (value.length === 0) return;
    
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
        <h3 className="text-xl font-semibold text-hotel-navy">Select Your Program Dates</h3>
        <p className="text-sm text-gray-600 mt-1">Choose one or more program periods to attend</p>
      </div>
      <ToggleGroup 
        type="multiple" 
        className="flex flex-col gap-3"
        onValueChange={handleValueChange}
      >
        {DATE_RANGES.map((range) => (
          <ToggleGroupItem
            key={range.id}
            value={range.id}
            className="w-full justify-start rounded-lg border border-gray-200 hover:border-hotel-gold transition-colors duration-200 data-[state=on]:border-hotel-gold data-[state=on]:bg-hotel-gold/5"
            aria-label={range.name}
          >
            <div className="flex flex-col p-4 w-full">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-hotel-navy">{range.name}</span>
                <span className="text-sm text-gray-600 font-medium">
                  {range.startDate.split('-').slice(1).join('/')} - {range.endDate.split('-').slice(1).join('/')}
                </span>
              </div>
              <span className="text-sm text-gray-600">{range.description}</span>
            </div>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

export default DateRangeSelector;