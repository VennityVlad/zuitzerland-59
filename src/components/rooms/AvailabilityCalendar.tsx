
import { useState, useEffect, useMemo } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";

type AvailabilitySlot = {
  id: string;
  location_id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
};

type TimeSlot = {
  hour: number;
  minute: number;
  formatted: string;
};

type DayColumn = {
  date: Date;
  dayName: string;
  dayOfMonth: string;
  isToday: boolean;
};

type CellState = {
  dateStr: string;
  hour: number;
  isAvailable: boolean;
  slotId?: string;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const TIME_SLOTS: TimeSlot[] = HOURS.map(hour => ({
  hour,
  minute: 0,
  formatted: format(new Date().setHours(hour, 0), 'h:mm a')
}));

const AvailabilityCalendar = ({ locationId }: { locationId: string }) => {
  const [startDate, setStartDate] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [availabilityData, setAvailabilityData] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cellStates, setCellStates] = useState<Record<string, CellState>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartState, setDragStartState] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Ensure dayColumns is properly memoized and has a valid initial value
  const dayColumns: DayColumn[] = useMemo(() => {
    if (!startDate) return [];
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(startDate, i);
      return {
        date,
        dayName: format(date, 'EEE'),
        dayOfMonth: format(date, 'd'),
        isToday: isSameDay(date, new Date()),
      };
    });
  }, [startDate]);

  // Fetch availability data when locationId or date range changes
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!locationId) return;

      try {
        setIsLoading(true);
        
        const startDateStr = format(startDate, 'yyyy-MM-dd');
        const endDateStr = format(addDays(startDate, 6), 'yyyy-MM-dd');
        
        const { data, error } = await supabase
          .from('location_availability')
          .select('*')
          .eq('location_id', locationId)
          .gte('start_time', `${startDateStr}T00:00:00`)
          .lte('start_time', `${endDateStr}T23:59:59`);

        if (error) throw error;

        setAvailabilityData(data || []);
        
        // Initialize cell states from the data
        const newCellStates: Record<string, CellState> = {};
        
        // First set all cells as available by default
        dayColumns.forEach(day => {
          const dateStr = format(day.date, 'yyyy-MM-dd');
          HOURS.forEach(hour => {
            const cellKey = `${dateStr}-${hour}`;
            newCellStates[cellKey] = {
              dateStr,
              hour,
              isAvailable: true,
            };
          });
        });
        
        // Then update with actual availability data
        (data || []).forEach(slot => {
          const startDate = new Date(slot.start_time);
          const dateStr = format(startDate, 'yyyy-MM-dd');
          const hour = startDate.getHours();
          const cellKey = `${dateStr}-${hour}`;
          
          newCellStates[cellKey] = {
            dateStr,
            hour,
            isAvailable: slot.is_available,
            slotId: slot.id,
          };
        });
        
        setCellStates(newCellStates);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error fetching availability",
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [locationId, startDate, dayColumns, toast]);

  // Handle toggling a single cell
  const toggleCell = async (dateStr: string, hour: number) => {
    const cellKey = `${dateStr}-${hour}`;
    const currentCell = cellStates[cellKey];
    
    if (!currentCell) return;
    
    const newIsAvailable = !currentCell.isAvailable;
    
    // Update local state first for immediate feedback
    setCellStates(prev => ({
      ...prev,
      [cellKey]: {
        ...prev[cellKey],
        isAvailable: newIsAvailable
      }
    }));
    
    try {
      if (currentCell.slotId) {
        // Update existing availability record
        const { error } = await supabase
          .from('location_availability')
          .update({ is_available: newIsAvailable })
          .eq('id', currentCell.slotId);
          
        if (error) throw error;
      } else {
        // Create new availability record
        const startTime = new Date(`${dateStr}T${hour}:00:00`);
        const endTime = new Date(`${dateStr}T${hour + 1}:00:00`);
        
        const { data, error } = await supabase
          .from('location_availability')
          .insert({
            location_id: locationId,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            is_available: newIsAvailable
          })
          .select('*')
          .single();
          
        if (error) throw error;
        
        // Update cell state with the new slot ID
        setCellStates(prev => ({
          ...prev,
          [cellKey]: {
            ...prev[cellKey],
            slotId: data.id
          }
        }));
      }
    } catch (error: any) {
      // Revert state on error
      setCellStates(prev => ({
        ...prev,
        [cellKey]: {
          ...prev[cellKey],
          isAvailable: currentCell.isAvailable
        }
      }));
      
      toast({
        variant: "destructive",
        title: "Error updating availability",
        description: error.message,
      });
    }
  };

  // Handle mouse drag operations
  const handleMouseDown = (dateStr: string, hour: number) => {
    const cellKey = `${dateStr}-${hour}`;
    const currentState = cellStates[cellKey]?.isAvailable;
    
    setIsDragging(true);
    setDragStartState(currentState);
    
    // Toggle the initial cell
    toggleCell(dateStr, hour);
  };

  const handleMouseEnter = (dateStr: string, hour: number) => {
    if (!isDragging || dragStartState === null) return;
    
    const cellKey = `${dateStr}-${hour}`;
    const currentCell = cellStates[cellKey];
    
    // Only change cells that don't match the drag start state
    if (currentCell && currentCell.isAvailable === dragStartState) {
      toggleCell(dateStr, hour);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartState(null);
  };

  // Navigation functions
  const goToPreviousWeek = () => {
    setStartDate(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setStartDate(prev => addDays(prev, 7));
  };

  const goToCurrentWeek = () => {
    setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>Weekly Availability</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              Next
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {format(startDate, 'MMMM d, yyyy')} - {format(addDays(startDate, 6), 'MMMM d, yyyy')}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <div 
            className="w-full overflow-auto"
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div className="min-w-[800px]">
              {/* Header row with days */}
              <div className="grid grid-cols-8 border-b">
                <div className="p-2 font-medium text-center text-sm text-muted-foreground">
                  Time
                </div>
                {dayColumns.map((day) => (
                  <div 
                    key={day.dayName} 
                    className={`p-2 font-medium text-center ${
                      day.isToday ? "bg-primary/10 text-primary" : ""
                    }`}
                  >
                    <div className="text-sm">{day.dayName}</div>
                    <div className="text-lg">{day.dayOfMonth}</div>
                  </div>
                ))}
              </div>

              {/* Time slots grid */}
              <div className="grid grid-cols-8">
                {/* Time column */}
                <div className="border-r">
                  {TIME_SLOTS.map((slot) => (
                    <div 
                      key={slot.hour} 
                      className="h-12 border-b flex items-center justify-center text-xs text-muted-foreground"
                    >
                      {slot.formatted}
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {dayColumns.map((day) => (
                  <div key={day.dayName} className={day.isToday ? "bg-primary/5" : ""}>
                    {TIME_SLOTS.map((slot) => {
                      const dateStr = format(day.date, 'yyyy-MM-dd');
                      const cellKey = `${dateStr}-${slot.hour}`;
                      const isAvailable = cellStates[cellKey]?.isAvailable ?? true;
                      
                      return (
                        <div 
                          key={`${dateStr}-${slot.hour}`} 
                          className={`h-12 border-b border-r cursor-pointer transition-colors ${
                            isAvailable 
                              ? "bg-green-50 hover:bg-green-100" 
                              : "bg-gray-100 hover:bg-gray-200"
                          }`}
                          onMouseDown={() => handleMouseDown(dateStr, slot.hour)}
                          onMouseEnter={() => handleMouseEnter(dateStr, slot.hour)}
                        >
                          {isAvailable ? (
                            <div className="h-full flex items-center justify-center text-green-700 text-xs">
                              Available
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-gray-500 text-xs">
                              Unavailable
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AvailabilityCalendar;
