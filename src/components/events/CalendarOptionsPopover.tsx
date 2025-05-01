
import { Calendar, Apple, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatInTimeZone } from "date-fns-tz";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Event {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location_id: string | null;
  location_text: string | null;
  timezone: string;
}

interface CalendarOptionsPopoverProps {
  event: Event;
  isMobile: boolean;
}

export function CalendarOptionsPopover({ event, isMobile }: CalendarOptionsPopoverProps) {
  // Format dates for calendar links
  const formatDate = (date: string, format: string) => {
    return formatInTimeZone(
      new Date(date),
      event.timezone || "Europe/Zurich",
      format
    );
  };

  const generateGoogleCalendarLink = () => {
    const startDate = formatDate(event.start_date, "yyyyMMdd'T'HHmmss");
    const endDate = formatDate(event.end_date, "yyyyMMdd'T'HHmmss");
    const location = event.location_text || "";

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      event.title
    )}&dates=${startDate}/${endDate}&details=${encodeURIComponent(
      event.description || ""
    )}&location=${encodeURIComponent(location)}&ctz=${encodeURIComponent(
      event.timezone || "Europe/Zurich"
    )}`;
  };

  const generateAppleCalendarLink = () => {
    // Create an iCal file for Apple Calendar
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    
    const formatICalDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '').substring(0, 15) + 'Z';
    };
    
    const icalStart = formatICalDate(startDate);
    const icalEnd = formatICalDate(endDate);
    
    const icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Zuitzerland//Calendar App//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@zuitzerland.app`,
      `DTSTAMP:${formatICalDate(new Date())}`,
      `DTSTART:${icalStart}`,
      `DTEND:${icalEnd}`,
      `SUMMARY:${event.title}`,
      event.description ? `DESCRIPTION:${event.description}` : '',
      event.location_text ? `LOCATION:${event.location_text}` : '',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');
    
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    return url;
  };

  const handleAppleCalendar = () => {
    const url = generateAppleCalendarLink();
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/\s+/g, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-blue-500 border-blue-500 hover:bg-blue-50"
        >
          <Calendar className="h-4 w-4 mr-2" />
          {!isMobile && "Add to Calendar"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2">
        <div className="grid gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => window.open(generateGoogleCalendarLink(), '_blank')}
                >
                  <Globe className="h-4 w-4 mr-2 text-blue-500" />
                  Google Calendar
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add to Google Calendar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleAppleCalendar}
                >
                  <Apple className="h-4 w-4 mr-2 text-gray-700" />
                  Apple Calendar
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download .ics file</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </PopoverContent>
    </Popover>
  );
}
