
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

// Define the frequency type to match our database enum
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface RecurrenceSettingsProps {
  isRecurring: boolean;
  onIsRecurringChange: (value: boolean) => void;
  frequency: RecurrenceFrequency;
  onFrequencyChange: (value: RecurrenceFrequency) => void;
  intervalCount: number;
  onIntervalCountChange: (value: number) => void;
  endDate: Date | null;
  onEndDateChange: (date: Date | null) => void;
  daysOfWeek: number[];
  onDaysOfWeekChange: (days: number[]) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" }
];

export const RecurrenceSettings: React.FC<RecurrenceSettingsProps> = ({
  isRecurring,
  onIsRecurringChange,
  frequency,
  onFrequencyChange,
  intervalCount,
  onIntervalCountChange,
  endDate,
  onEndDateChange,
  daysOfWeek,
  onDaysOfWeekChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="recurring"
          checked={isRecurring}
          onCheckedChange={onIsRecurringChange}
        />
        <Label htmlFor="recurring">Recurring event</Label>
      </div>

      {isRecurring && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={(value: RecurrenceFrequency) => onFrequencyChange(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Repeat every</Label>
              <Input
                type="number"
                min={1}
                value={intervalCount}
                onChange={(e) => onIntervalCountChange(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          {frequency === 'weekly' && (
            <div className="space-y-2">
              <Label>Repeat on</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day.value}
                    variant={daysOfWeek.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (daysOfWeek.includes(day.value)) {
                        onDaysOfWeekChange(daysOfWeek.filter(d => d !== day.value));
                      } else {
                        onDaysOfWeekChange([...daysOfWeek, day.value].sort());
                      }
                    }}
                  >
                    {day.label.substring(0, 3)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>End date (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate || undefined}
                  onSelect={(date) => onEndDateChange(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}
    </div>
  );
};
