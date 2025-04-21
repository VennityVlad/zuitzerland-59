import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format, startOfWeek, addDays } from "date-fns";

type ControlsProps = {
  locationId: string;
  locationName: string;
  onAvailabilityChange?: () => void;
};

type TimeRange = {
  start: string;
  end: string;
};

const timeOptions = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  const hourString = hour.toString().padStart(2, '0');
  return `${hourString}:00`;
});

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const WEEKEND = ["Saturday", "Sunday"];

const AvailabilityControls = ({
  locationId,
  locationName,
  onAvailabilityChange,
}: ControlsProps) => {
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [weekdayRange, setWeekdayRange] = useState<TimeRange>({ start: "09:00", end: "17:00" });
  const [weekendRange, setWeekendRange] = useState<TimeRange>({ start: "10:00", end: "16:00" });
  const [includeWeekdays, setIncludeWeekdays] = useState(true);
  const [includeWeekend, setIncludeWeekend] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<"office" | "full" | "custom" | "unavailable">("office");
  
  const { toast } = useToast();

  const applyTemplate = async () => {
    if (!locationId) return;
    
    try {
      setIsApplyingTemplate(true);
      
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const batchInserts = [];
      
      if (includeWeekdays) {
        for (let i = 0; i < 5; i++) {
          const currentDate = addDays(weekStart, i);
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          
          for (let hour = 0; hour < 24; hour++) {
            const hourStr = hour.toString().padStart(2, '0');
            const timeStr = `${hourStr}:00`;
            
            const isWithinRange = timeStr >= weekdayRange.start && timeStr < weekdayRange.end;
            const isAvailable = selectedTemplate !== "unavailable" && isWithinRange;
            
            batchInserts.push({
              location_id: locationId,
              start_time: new Date(`${dateStr}T${hourStr}:00:00`),
              end_time: new Date(`${dateStr}T${(hour + 1).toString().padStart(2, '0')}:00:00`),
              is_available: isAvailable,
            });
          }
        }
      }
      
      if (includeWeekend) {
        for (let i = 5; i < 7; i++) {
          const currentDate = addDays(weekStart, i);
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          
          for (let hour = 0; hour < 24; hour++) {
            const hourStr = hour.toString().padStart(2, '0');
            const timeStr = `${hourStr}:00`;
            
            const isWithinRange = timeStr >= weekendRange.start && timeStr < weekendRange.end;
            const isAvailable = selectedTemplate !== "unavailable" && isWithinRange;
            
            batchInserts.push({
              location_id: locationId,
              start_time: new Date(`${dateStr}T${hourStr}:00:00`),
              end_time: new Date(`${dateStr}T${(hour + 1).toString().padStart(2, '0')}:00:00`),
              is_available: isAvailable,
            });
          }
        }
      }
      
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(addDays(weekStart, 6), 'yyyy-MM-dd');
      
      const { error: deleteError } = await supabase
        .from('location_availability')
        .delete()
        .eq('location_id', locationId)
        .gte('start_time', `${weekStartStr}T00:00:00`)
        .lte('start_time', `${weekEndStr}T23:59:59`);
        
      if (deleteError) throw deleteError;
      
      const { error: insertError } = await supabase
        .from('location_availability')
        .insert(batchInserts);
        
      if (insertError) throw insertError;
      
      toast({
        title: "Availability updated",
        description: `Template applied successfully to ${locationName}`,
      });
      
      setConfirmDialogOpen(false);

      if (typeof onAvailabilityChange === "function") onAvailabilityChange();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error applying template",
        description: error.message,
      });
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  const onTemplateChange = (value: string) => {
    setSelectedTemplate(value as "office" | "full" | "custom" | "unavailable");
    
    switch (value) {
      case "office":
        setWeekdayRange({ start: "09:00", end: "17:00" });
        setWeekendRange({ start: "10:00", end: "16:00" });
        setIncludeWeekdays(true);
        setIncludeWeekend(false);
        break;
      case "full":
        setWeekdayRange({ start: "00:00", end: "23:59" });
        setWeekendRange({ start: "00:00", end: "23:59" });
        setIncludeWeekdays(true);
        setIncludeWeekend(true);
        break;
      case "unavailable":
        setIncludeWeekdays(true);
        setIncludeWeekend(true);
        break;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Availability Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="template">Availability Template</Label>
            <Select value={selectedTemplate} onValueChange={onTemplateChange}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="office">Office Hours</SelectItem>
                <SelectItem value="full">Full Day</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedTemplate === "office" && "Monday-Friday, 9 AM - 5 PM"}
              {selectedTemplate === "full" && "All hours, all days"}
              {selectedTemplate === "unavailable" && "Mark all slots as unavailable"}
              {selectedTemplate === "custom" && "Custom schedule"}
            </p>
          </div>

          {selectedTemplate !== "unavailable" && (
            <>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="weekdays" 
                    checked={includeWeekdays} 
                    onCheckedChange={setIncludeWeekdays}
                  />
                  <Label htmlFor="weekdays">Weekdays (Mon-Fri)</Label>
                </div>
                
                {includeWeekdays && (
                  <div className="grid grid-cols-2 gap-2 pl-6">
                    <div>
                      <Label htmlFor="weekday-start" className="text-xs">Start Time</Label>
                      <Select 
                        value={weekdayRange.start} 
                        onValueChange={(value) => setWeekdayRange(prev => ({ ...prev, start: value }))}
                      >
                        <SelectTrigger id="weekday-start">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="weekday-end" className="text-xs">End Time</Label>
                      <Select 
                        value={weekdayRange.end} 
                        onValueChange={(value) => setWeekdayRange(prev => ({ ...prev, end: value }))}
                      >
                        <SelectTrigger id="weekday-end">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="weekend" 
                    checked={includeWeekend} 
                    onCheckedChange={setIncludeWeekend}
                  />
                  <Label htmlFor="weekend">Weekend (Sat-Sun)</Label>
                </div>
                
                {includeWeekend && (
                  <div className="grid grid-cols-2 gap-2 pl-6">
                    <div>
                      <Label htmlFor="weekend-start" className="text-xs">Start Time</Label>
                      <Select 
                        value={weekendRange.start} 
                        onValueChange={(value) => setWeekendRange(prev => ({ ...prev, start: value }))}
                      >
                        <SelectTrigger id="weekend-start">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="weekend-end" className="text-xs">End Time</Label>
                      <Select 
                        value={weekendRange.end} 
                        onValueChange={(value) => setWeekendRange(prev => ({ ...prev, end: value }))}
                      >
                        <SelectTrigger id="weekend-end">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Apply Template</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Availability Change</DialogTitle>
              <DialogDescription>
                This will overwrite any existing availability settings for this location.
                Are you sure you want to continue?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <h4 className="font-medium">Summary of changes:</h4>
              <ul className="mt-2 text-sm space-y-1">
                {includeWeekdays && (
                  <li>
                    Weekdays ({WEEKDAYS.join(", ")}): {" "}
                    {selectedTemplate === "unavailable" 
                      ? "All unavailable" 
                      : `${weekdayRange.start} - ${weekdayRange.end}`
                    }
                  </li>
                )}
                {includeWeekend && (
                  <li>
                    Weekend ({WEEKEND.join(", ")}): {" "}
                    {selectedTemplate === "unavailable" 
                      ? "All unavailable" 
                      : `${weekendRange.start} - ${weekendRange.end}`
                    }
                  </li>
                )}
                {!includeWeekdays && !includeWeekend && (
                  <li className="text-red-500">No days selected</li>
                )}
              </ul>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setConfirmDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={applyTemplate} 
                disabled={isApplyingTemplate || (!includeWeekdays && !includeWeekend)}
              >
                {isApplyingTemplate ? "Applying..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <div>
          <h3 className="font-medium mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => {
                setSelectedTemplate("office");
                setIncludeWeekdays(true);
                setIncludeWeekend(false);
                setWeekdayRange({ start: "09:00", end: "17:00" });
                setConfirmDialogOpen(true);
              }}
            >
              Set Office Hours
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                setSelectedTemplate("unavailable");
                setIncludeWeekdays(true);
                setIncludeWeekend(true);
                setConfirmDialogOpen(true);
              }}
            >
              Mark All Unavailable
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                setSelectedTemplate("full");
                setIncludeWeekdays(true);
                setIncludeWeekend(true);
                setWeekdayRange({ start: "00:00", end: "23:59" });
                setWeekendRange({ start: "00:00", end: "23:59" });
                setConfirmDialogOpen(true);
              }}
            >
              Available 24/7
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailabilityControls;
