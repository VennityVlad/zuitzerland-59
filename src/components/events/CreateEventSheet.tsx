import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, addHours, startOfHour, addMinutes } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { Calendar as CalendarIcon, Clock, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

// UI Component imports
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TagSelector } from "@/components/events/TagSelector";

// Type definitions
interface CreateEventSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
  profileId?: string;
  event?: Event | null;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location_id: string | null;
  location_text: string | null;
  color: string;
  is_all_day: boolean;
  created_by: string;
  tags?: { id: string; name: string; color: string; }[];
  av_needs?: string | null;
  speakers?: string | null;
  link?: string | null;
}

interface Location {
  id: string;
  name: string;
  building: string | null;
  floor: string | null;
  type: string;
  description?: string | null;
  max_occupancy?: number | null;
  created_at: string;
  updated_at: string;
}

interface Availability {
  id: string;
  location_id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

// Color options for events
const colorOptions = [
  { label: "Blue", value: "#1a365d" },
  { label: "Green", value: "#1C4532" },
  { label: "Red", value: "#822727" },
  { label: "Purple", value: "#553C9A" },
  { label: "Orange", value: "#974820" },
  { label: "Pink", value: "#97266D" },
  { label: "Cyan", value: "#0D7490" },
  { label: "Gray", value: "#1A202C" }
];

const TIME_ZONE = "Europe/Zurich";

const getInitialStartDate = () => {
  const now = new Date();
  const zonedNow = toZonedTime(now, TIME_ZONE);
  const nextHour = startOfHour(addHours(zonedNow, 1));
  return format(fromZonedTime(nextHour, TIME_ZONE), "yyyy-MM-dd'T'HH:mm:ss");
};

const getInitialEndDate = (startDate: string) => {
  const start = parseISO(startDate);
  const end = addHours(start, 1);
  return format(end, "yyyy-MM-dd'T'HH:mm:ss");
};

export function CreateEventSheet({ 
  open, 
  onOpenChange, 
  onSuccess, 
  userId, 
  profileId, 
  event 
}: CreateEventSheetProps) {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const [userProfile, setUserProfile] = useState<{ id: string } | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationAvailabilities, setLocationAvailabilities] = useState<Availability[]>([]);
  const [availabilityValidationError, setAvailabilityValidationError] = useState<string | null>(null);
  const [overlapValidationError, setOverlapValidationError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<{ id: string; name: string; color: string; }[]>([]);
  const [useCustomLocation, setUseCustomLocation] = useState(false);

  const [newEvent, setNewEvent] = useState<NewEvent>({
    title: "",
    description: "",
    start_date: getInitialStartDate(),
    end_date: getInitialEndDate(getInitialStartDate()),
    location_id: null,
    location_text: "",
    color: "#1a365d",
    is_all_day: false,
    created_by: "",
    av_needs: "",
    speakers: "",
    link: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!event;

  useEffect(() => {
    if (event) {
      setNewEvent({
        title: event.title,
        description: event.description || "",
        start_date: event.start_date,
        end_date: event.end_date,
        location_id: event.location_id,
        location_text: event.location_text || "",
        color: event.color,
        is_all_day: event.is_all_day,
        created_by: event.created_by,
        av_needs: event.av_needs,
        speakers: event.speakers,
        link: event.link
      });
      
      setUseCustomLocation(!!event.location_text);
      
      if (event.id) {
        fetchEventTags(event.id);
      }
    } else {
      resetForm();
    }
  }, [event]);
  
  const fetchEventTags = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_tag_relations')
        .select(`
          tag_id,
          event_tags (id, name, color)
        `)
        .eq('event_id', eventId);
      
      if (error) throw error;
      
      if (data) {
        const tags = data.map(item => ({
          id: item.event_tags.id,
          name: item.event_tags.name,
          color: item.event_tags.color || "#1a365d"
        }));
        
        setSelectedTags(tags);
      }
    } catch (error) {
      console.error("Error fetching event tags:", error);
    }
  };

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoadingLocations(true);
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .eq('type', 'Meeting Room')
          .order('name');
          
        if (error) throw error;
        setLocations(data || []);
      } catch (error) {
        console.error("Error fetching locations:", error);
        toast({
          title: "Error",
          description: "Failed to load meeting rooms",
          variant: "destructive",
        });
      } finally {
        setIsLoadingLocations(false);
      }
    };
    
    if (open) {
      fetchLocations();
    }
  }, [open, toast]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user && !userId) return;
      
      if (profileId) {
        setUserProfile({ id: profileId });
        if (!isEditMode) {
          setNewEvent(prev => ({ ...prev, created_by: profileId }));
        }
        return;
      }
      
      try {
        setIsLoadingProfile(true);
        
        let { data, error } = { data: null, error: null };
        
        if (userId.startsWith('did:privy:')) {
          ({ data, error } = await supabase
            .from('profiles')
            .select('id')
            .filter('privy_id', 'eq', userId)
            .single());
        } 
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
          
          if (!isEditMode) {
            setNewEvent(prev => ({ ...prev, created_by: data.id }));
          }
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
  }, [user, userId, profileId, toast, isEditMode]);

  useEffect(() => {
    const fetchLocationAvailability = async () => {
      if (!newEvent.location_id) {
        setLocationAvailabilities([]);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('location_availability')
          .select('*')
          .eq('location_id', newEvent.location_id);
        
        if (error) throw error;
        
        setLocationAvailabilities(data || []);
        validateLocationAvailability(data || []);
      } catch (error) {
        console.error("Error fetching location availability:", error);
      }
    };
    
    if (newEvent.location_id) {
      fetchLocationAvailability();
    }
  }, [newEvent.location_id, newEvent.start_date, newEvent.end_date]);

  const resetForm = () => {
    setNewEvent({
      title: "",
      description: "",
      start_date: getInitialStartDate(),
      end_date: getInitialEndDate(getInitialStartDate()),
      location_id: null,
      location_text: "",
      color: "#1a365d",
      is_all_day: false,
      created_by: userProfile?.id || "",
      av_needs: "",
      speakers: "",
      link: ""
    });
    setSelectedTags([]);
    setAvailabilityValidationError(null);
    setUseCustomLocation(false);
  };

  const validateLocationAvailability = (availabilities: Availability[]) => {
    if (!newEvent.location_id || availabilities.length === 0) {
      setAvailabilityValidationError(null);
      return true;
    }
    
    const eventStart = new Date(newEvent.start_date);
    const eventEnd = new Date(newEvent.end_date);
    
    const conflicts = availabilities.filter(period => {
      if (period.is_available) return false;
      
      const periodStart = new Date(period.start_time);
      const periodEnd = new Date(period.end_time);
      
      return (
        (eventStart >= periodStart && eventStart < periodEnd) ||
        (eventEnd > periodStart && eventEnd <= periodEnd) ||
        (eventStart <= periodStart && eventEnd >= periodEnd)
      );
    });
    
    if (conflicts.length > 0) {
      setAvailabilityValidationError("Selected location is not available during this time period");
      return false;
    } else {
      setAvailabilityValidationError(null);
      return true;
    }
  };

  const checkForEventOverlap = async () => {
    if (!newEvent.location_id) {
      setOverlapValidationError(null);
      return true;
    }
    const start = new Date(newEvent.start_date);
    const end = new Date(newEvent.end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setOverlapValidationError(null);
      return true;
    }
    let query = supabase
      .from('events')
      .select('id, title, start_date, end_date')
      .eq('location_id', newEvent.location_id);

    if (isEditMode && event) {
      query = query.neq('id', event.id);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error checking overlaps:", error);
      setOverlapValidationError("Error checking overlapping events");
      return false;
    }
    
    const overlaps = (data || []).find((e) => {
      return (
        new Date(e.start_date) < end &&
        new Date(e.end_date) > start
      );
    });
    
    if (overlaps) {
      setOverlapValidationError(
        `Room already booked for this time (conflict with "${overlaps.title}")`
      );
      return false;
    }
    
    setOverlapValidationError(null);
    return true;
  };

  useEffect(() => {
    if (newEvent.location_id && newEvent.start_date && newEvent.end_date) {
      checkForEventOverlap();
    } else {
      setOverlapValidationError(null);
    }
  }, [newEvent.location_id, newEvent.start_date, newEvent.end_date, isEditMode, event]);

  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Allow empty URLs
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
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

      if (useCustomLocation && !newEvent.location_text) {
        toast({
          title: "Error",
          description: "Please enter a custom location",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (!useCustomLocation && !newEvent.location_id) {
        toast({
          title: "Error",
          description: "Please select a location",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (newEvent.link && !validateUrl(newEvent.link)) {
        toast({
          title: "Error",
          description: "Please enter a valid URL",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (!userProfile?.id && !isEditMode) {
        toast({
          title: "Error",
          description: "User profile not found. Please complete your profile setup.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

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
      
      if (!validateLocationAvailability(locationAvailabilities)) {
        toast({
          title: "Error",
          description: availabilityValidationError || "Location is not available during selected time",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (!await checkForEventOverlap()) {
        toast({
          title: "Room is already booked",
          description: overlapValidationError || "There is an overlapping event for this room.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (isEditMode) {
        console.log("Updating event:", event.id);
        const { data, error } = await supabase
          .from('events')
          .update({
            title: newEvent.title,
            description: newEvent.description || null,
            start_date: newEvent.start_date,
            end_date: newEvent.end_date,
            location_id: useCustomLocation ? null : newEvent.location_id,
            location_text: useCustomLocation ? newEvent.location_text : null,
            color: newEvent.color,
            is_all_day: newEvent.is_all_day,
            av_needs: newEvent.av_needs || null,
            speakers: newEvent.speakers || null,
            link: newEvent.link || null,
          })
          .eq('id', event.id)
          .select();

        if (error) {
          console.error("Supabase update error:", error);
          throw error;
        }

        if (data) {
          await supabase
            .from('event_tag_relations')
            .delete()
            .eq('event_id', event.id);

          if (selectedTags.length > 0) {
            await supabase
              .from('event_tag_relations')
              .insert(
                selectedTags.map(tag => ({
                  event_id: event.id,
                  tag_id: tag.id
                }))
              );
          }
        }
      } else {
        const { data, error } = await supabase
          .from('events')
          .insert({
            title: newEvent.title,
            description: newEvent.description || null,
            start_date: newEvent.start_date,
            end_date: newEvent.end_date,
            location_id: useCustomLocation ? null : newEvent.location_id,
            location_text: useCustomLocation ? newEvent.location_text : null,
            color: newEvent.color,
            is_all_day: newEvent.is_all_day,
            av_needs: newEvent.av_needs || null,
            speakers: newEvent.speakers || null,
            link: newEvent.link || null,
            created_by: userProfile?.id
          })
          .select()
          .single();

        if (error) throw error;

        if (data && selectedTags.length > 0) {
          await supabase
            .from('event_tag_relations')
            .insert(
              selectedTags.map(tag => ({
                event_id: data.id,
                tag_id: tag.id
              }))
            );
        }
      }
      
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Error",
        description: "Failed to save event: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (type: 'start' | 'end', date: Date | undefined) => {
    if (!date) return;
    
    const currentDate = type === 'start' 
      ? parseISO(newEvent.start_date)
      : parseISO(newEvent.end_date);
    
    const zonedCurrentDate = toZonedTime(currentDate, TIME_ZONE);
    const hours = zonedCurrentDate.getHours();
    const minutes = zonedCurrentDate.getMinutes();
    
    const zonedNewDate = toZonedTime(date, TIME_ZONE);
    zonedNewDate.setHours(hours);
    zonedNewDate.setMinutes(minutes);
    
    const newUtcDate = fromZonedTime(zonedNewDate, TIME_ZONE);
    
    if (type === 'start') {
      const newStartDate = format(newUtcDate, 'yyyy-MM-dd\'T\'HH:mm:ss');
      setNewEvent(prev => ({
        ...prev,
        start_date: newStartDate,
        end_date: format(addHours(newUtcDate, 1), 'yyyy-MM-dd\'T\'HH:mm:ss')
      }));
    } else {
      setNewEvent(prev => ({
        ...prev,
        end_date: format(newUtcDate, 'yyyy-MM-dd\'T\'HH:mm:ss')
      }));
    }
  };

  const handleTimeChange = (type: 'start' | 'end', timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = parseISO(type === 'start' ? newEvent.start_date : newEvent.end_date);
    const zonedDate = toZonedTime(date, TIME_ZONE);
    
    zonedDate.setHours(hours);
    zonedDate.setMinutes(minutes);
    
    const utcDate = fromZonedTime(zonedDate, TIME_ZONE);
    
    if (type === 'start') {
      const newStartDate = format(utcDate, 'yyyy-MM-dd\'T\'HH:mm:ss');
      setNewEvent(prev => ({
        ...prev,
        start_date: newStartDate,
        end_date: format(addHours(utcDate, 1), 'yyyy-MM-dd\'T\'HH:mm:ss')
      }));
    } else {
      setNewEvent(prev => ({
        ...prev,
        end_date: format(utcDate, 'yyyy-MM-dd\'T\'HH:mm:ss')
      }));
    }
  };

  const handleLocationChange = (locationId: string) => {
    setNewEvent({
      ...newEvent,
      location_id: locationId,
      location_text: null
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md md:max-w-lg h-full flex flex-col">
        <SheetHeader className="mb-6 flex-shrink-0">
          <SheetTitle>{isEditMode ? "Edit Event" : "Create New Event"}</SheetTitle>
          <SheetDescription>
            {isEditMode ? "Update the details of this event" : "Fill in the details to create a new event"}
          </SheetDescription>
        </SheetHeader>

        {isLoadingProfile ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse">Loading user profile...</div>
          </div>
        ) : !userProfile && !isEditMode ? (
          <div className="text-center py-8">
            <p className="text-red-500">
              User profile not found. Please complete your profile setup before creating events.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 pb-6">
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
                <Label>Location</Label>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={useCustomLocation}
                      onCheckedChange={setUseCustomLocation}
                    />
                    <Label>Use custom location</Label>
                  </div>

                  {useCustomLocation ? (
                    <Input
                      value={newEvent.location_text || ''}
                      onChange={(e) => setNewEvent({...newEvent, location_text: e.target.value, location_id: null})}
                      placeholder="Enter custom location..."
                    />
                  ) : (
                    <Select
                      value={newEvent.location_id || ''}
                      onValueChange={(value) => setNewEvent({...newEvent, location_id: value, location_text: null})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                            {location.building && ` (${location.building}${location.floor ? `, Floor ${location.floor}` : ""})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <TagSelector
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                />
              </div>

              <div className="space-y-2">
                <Label>A/V Needs</Label>
                <Textarea 
                  value={newEvent.av_needs}
                  onChange={(e) => setNewEvent({...newEvent, av_needs: e.target.value})}
                  placeholder="Any specific A/V requirements (e.g., projector, microphone)"
                  rows={2}
                />
              </div>

              <div className="space-y-2 mt-4">
                <Label>Speakers</Label>
                <Textarea 
                  value={newEvent.speakers}
                  onChange={(e) => setNewEvent({...newEvent, speakers: e.target.value})}
                  placeholder="List of speakers for this event"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">Event Link (Optional)</Label>
                <div className="flex items-center space-x-2">
                  <Link className="h-4 w-4 text-gray-500" />
                  <Input
                    id="link"
                    type="url"
                    value={newEvent.link || ''}
                    onChange={(e) => {
                      const url = e.target.value;
                      setNewEvent({...newEvent, link: url});
                    }}
                    onBlur={(e) => {
                      const url = e.target.value;
                      if (url && !validateUrl(url)) {
                        toast({
                          title: "Invalid URL",
                          description: "Please enter a valid URL including http:// or https://",
                          variant: "destructive",
                        });
                      }
                    }}
                    placeholder="https://example.com"
                    className="flex-1"
                  />
                </div>
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
              onClick={handleSubmit} 
              disabled={isSubmitting || (!userProfile && !isEditMode) || !!availabilityValidationError || !!overlapValidationError}
            >
              {isSubmitting ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Event" : "Create Event")}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface NewEvent {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location_id: string | null;
  location_text: string | null;
  color: string;
  is_all_day: boolean;
  created_by: string;
  av_needs?: string;
  speakers?: string;
  link?: string;
}
