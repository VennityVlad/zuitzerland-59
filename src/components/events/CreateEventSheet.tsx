
import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

interface CreateEventSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
}

interface NewEvent {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  color: string;
  is_all_day: boolean;
  created_by: string;
}

// Common color options for events
const colorOptions = [
  { label: "Navy", value: "#1a365d" },
  { label: "Blue", value: "#3182ce" },
  { label: "Green", value: "#38a169" },
  { label: "Red", value: "#e53e3e" },
  { label: "Orange", value: "#dd6b20" },
  { label: "Purple", value: "#805ad5" },
  { label: "Pink", value: "#d53f8c" },
];

export function CreateEventSheet({ open, onOpenChange, onSuccess, userId }: CreateEventSheetProps) {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const [userProfile, setUserProfile] = useState<{ id: string } | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [newEvent, setNewEvent] = useState<NewEvent>({
    title: "",
    description: "",
    start_date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    end_date: format(new Date(new Date().getTime() + 2 * 60 * 60 * 1000), 'yyyy-MM-dd\'T\'HH:mm:ss'), // Default to 2 hours from now
    location: "",
    color: "#1a365d",
    is_all_day: false,
    created_by: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch the user's profile ID when the component mounts or userId changes
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user && !userId) return;
      
      try {
        setIsLoadingProfile(true);
        
        let { data, error } = { data: null, error: null };
        
        // If using Privy, query by privy_id
        if (userId.startsWith('did:privy:')) {
          ({ data, error } = await supabase
            .from('profiles')
            .select('id')
            .filter('privy_id', 'eq', userId)
            .single());
        } 
        // If using Supabase auth, query by auth_user_id
        else if (user?.id) {
          ({ data, error } = await supabase
            .from('profiles')
            .select('id')
            .filter('auth_user_id', 'eq', user.id)
            .single());
        }
        
        if (error) {
          console.error("Error fetching user profile:", error);
          throw error;
        }
        
        if (data) {
          console.log("Found user profile:", data);
          setUserProfile(data);
          setNewEvent(prev => ({ ...prev, created_by: data.id }));
        } else {
          toast({
            title: "Error",
            description: "User profile not found. Please complete your profile setup first.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    
    fetchUserProfile();
  }, [user, userId, toast]);

  const resetForm = () => {
    setNewEvent({
      title: "",
      description: "",
      start_date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss'),
      end_date: format(new Date(new Date().getTime() + 2 * 60 * 60 * 1000), 'yyyy-MM-dd\'T\'HH:mm:ss'),
      location: "",
      color: "#1a365d",
      is_all_day: false,
      created_by: userProfile?.id || ""
    });
  };

  const handleCreateEvent = async () => {
    try {
      setIsSubmitting(true);
      
      if (!newEvent.title) {
        toast({
          title: "Error",
          description: "Event title is required",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (!userProfile?.id) {
        toast({
          title: "Error",
          description: "User profile not found. Please complete your profile setup.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Check if dates are valid
      const startDate = new Date(newEvent.start_date);
      const endDate = new Date(newEvent.end_date);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        toast({
          title: "Error",
          description: "Invalid date format",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      if (startDate > endDate) {
        toast({
          title: "Error",
          description: "End date must be after start date",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      console.log("Creating event with profile ID:", userProfile.id);
      
      const { data, error } = await supabase
        .from('events')
        .insert({
          title: newEvent.title,
          description: newEvent.description || null,
          start_date: newEvent.start_date,
          end_date: newEvent.end_date,
          location: newEvent.location || null,
          color: newEvent.color,
          is_all_day: newEvent.is_all_day,
          created_by: userProfile.id
        })
        .select();

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Event created successfully",
      });
      
      // Reset form and close sheet
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (type: 'start' | 'end', date: Date | undefined) => {
    if (!date) return;
    
    const currentDate = type === 'start' 
      ? new Date(newEvent.start_date) 
      : new Date(newEvent.end_date);
    
    // Preserve the time from the current value
    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();
    
    date.setHours(hours);
    date.setMinutes(minutes);
    
    setNewEvent({
      ...newEvent,
      [type === 'start' ? 'start_date' : 'end_date']: format(date, 'yyyy-MM-dd\'T\'HH:mm:ss')
    });
  };

  const handleTimeChange = (type: 'start' | 'end', timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date(type === 'start' ? newEvent.start_date : newEvent.end_date);
    
    date.setHours(hours);
    date.setMinutes(minutes);
    
    setNewEvent({
      ...newEvent,
      [type === 'start' ? 'start_date' : 'end_date']: format(date, 'yyyy-MM-dd\'T\'HH:mm:ss')
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md md:max-w-lg">
        <SheetHeader className="mb-6">
          <SheetTitle>Create New Event</SheetTitle>
          <SheetDescription>
            Fill in the details to create a new event
          </SheetDescription>
        </SheetHeader>

        {isLoadingProfile ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse">Loading user profile...</div>
          </div>
        ) : !userProfile ? (
          <div className="text-center py-8">
            <p className="text-red-500">
              User profile not found. Please complete your profile setup before creating events.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input 
                  id="title" 
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="Team Meeting"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea 
                  id="description" 
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  placeholder="Details about the event..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <Input 
                  id="location" 
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                  placeholder="Conference Room A"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-all-day"
                checked={newEvent.is_all_day}
                onCheckedChange={(checked) => setNewEvent({...newEvent, is_all_day: checked})}
              />
              <Label htmlFor="is-all-day">All day event</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newEvent.start_date ? format(parseISO(newEvent.start_date), 'MMM d, yyyy') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newEvent.start_date ? parseISO(newEvent.start_date) : undefined}
                      onSelect={(date) => handleDateChange('start', date)}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {!newEvent.is_all_day && (
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <Input 
                      id="start-time" 
                      type="time"
                      value={format(parseISO(newEvent.start_date), 'HH:mm')}
                      onChange={(e) => handleTimeChange('start', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newEvent.end_date ? format(parseISO(newEvent.end_date), 'MMM d, yyyy') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newEvent.end_date ? parseISO(newEvent.end_date) : undefined}
                      onSelect={(date) => handleDateChange('end', date)}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {!newEvent.is_all_day && (
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <Input 
                      id="end-time" 
                      type="time"
                      value={format(parseISO(newEvent.end_date), 'HH:mm')}
                      onChange={(e) => handleTimeChange('end', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Event Color</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <div
                    key={color.value}
                    className={`h-8 w-8 rounded-full cursor-pointer border-2 ${
                      newEvent.color === color.value ? 'border-gray-900' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setNewEvent({...newEvent, color: color.value})}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={handleCreateEvent} 
              disabled={isSubmitting || !userProfile}
            >
              {isSubmitting ? "Creating..." : "Create Event"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
