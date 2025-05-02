
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, set, parseISO } from "date-fns";
import { CalendarDays, Tags, Clock, MapPin, Calendar, Mic, Info, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimeInput } from "@/components/ui/time-input";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { TagSelector } from "@/components/events/TagSelector";
import { RecurrenceSettings } from "@/components/events/RecurrenceSettings";

export type EventFormValues = {
  id?: string;
  title: string;
  description: string;
  location: string | null;
  locationId: string | null;
  date: Date;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  selectedTags: string[];
  color: string;
  speakers?: string;
  avNeeds?: string;
  link?: string;
  timezone: string;
  isRecurring: boolean;
  recurringFrequency?: string;
  recurringInterval?: number;
  recurringDaysOfWeek?: number[];
  recurringEndDate?: Date;
  meerkatEnabled?: boolean;
};

export type CreateEventSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  userId: string;
  event?: any;
  profileId?: string;
};

export const CreateEventSheet = ({
  open,
  onOpenChange,
  onSuccess,
  userId,
  event,
  profileId,
}: CreateEventSheetProps) => {
  const [locations, setLocations] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditMode = !!event;

  // Default form values
  const defaultValues: EventFormValues = {
    title: "",
    description: "",
    location: null,
    locationId: null,
    date: new Date(),
    startTime: format(new Date(), "HH:mm"),
    endTime: format(set(new Date(), { hours: new Date().getHours() + 1 }), "HH:mm"),
    isAllDay: false,
    selectedTags: [],
    color: "#1A1F2C",
    speakers: "",
    avNeeds: "",
    link: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isRecurring: false,
    recurringFrequency: "weekly",
    recurringInterval: 1,
    recurringDaysOfWeek: [],
    meerkatEnabled: false,
  };

  // Form schema using Zod
  const formSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().optional(),
    location: z.string().nullable(),
    locationId: z.string().nullable(),
    date: z.date(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: "Invalid time format",
    }),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: "Invalid time format",
    }),
    isAllDay: z.boolean(),
    selectedTags: z.array(z.string()),
    color: z.string(),
    speakers: z.string().optional(),
    avNeeds: z.string().optional(),
    link: z.string().optional(),
    timezone: z.string(),
    isRecurring: z.boolean(),
    recurringFrequency: z.string().optional(),
    recurringInterval: z.number().positive().optional(),
    recurringDaysOfWeek: z.array(z.number()).optional(),
    recurringEndDate: z.date().optional(),
    meerkatEnabled: z.boolean().optional(),
  });

  // Initialize form with react-hook-form and zod resolver
  const form = useForm<EventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Load locations for dropdown
  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase.from("locations").select("*").order("name");
      if (!error && data) {
        setLocations(data);
      }
    };
    fetchLocations();
  }, []);

  // Set form values when editing an existing event
  useEffect(() => {
    if (event) {
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);
      
      // Check if event has a recurring pattern
      const hasRecurringPattern = !!event.recurring_pattern_id;
      
      form.reset({
        title: event.title,
        description: event.description || "",
        location: event.location_text,
        locationId: event.location_id,
        date: startDate,
        startTime: format(startDate, "HH:mm"),
        endTime: format(endDate, "HH:mm"),
        isAllDay: event.is_all_day,
        selectedTags: event.event_tags ? event.event_tags.map((t: any) => t.tags.id) : [],
        color: event.color || "#1A1F2C",
        speakers: event.speakers || "",
        avNeeds: event.av_needs || "",
        link: event.link || "",
        timezone: event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        isRecurring: hasRecurringPattern,
        // We'll fetch the recurring pattern details if needed
        meerkatEnabled: event.meerkat_enabled || false,
      });
      
      // If this is a recurring event, fetch the recurring pattern details
      if (hasRecurringPattern) {
        fetchRecurringPattern(event.recurring_pattern_id);
      }
    }
  }, [event, form]);

  // Fetch recurring pattern details when editing
  const fetchRecurringPattern = async (patternId: string) => {
    try {
      const { data, error } = await supabase
        .from("recurring_event_patterns")
        .select("*")
        .eq("id", patternId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        form.setValue("recurringFrequency", data.frequency);
        form.setValue("recurringInterval", data.interval_count);
        form.setValue("recurringDaysOfWeek", data.days_of_week || []);
        if (data.end_date) {
          form.setValue("recurringEndDate", new Date(data.end_date));
        }
      }
    } catch (error) {
      console.error("Error fetching recurring pattern:", error);
    }
  };

  // Handle form submission
  const onSubmit = async (values: EventFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Construct start and end dates from the date and time inputs
      const startDate = set(values.date, {
        hours: parseInt(values.startTime.split(":")[0]),
        minutes: parseInt(values.startTime.split(":")[1]),
        seconds: 0,
        milliseconds: 0,
      });
      
      const endDate = set(values.date, {
        hours: parseInt(values.endTime.split(":")[0]),
        minutes: parseInt(values.endTime.split(":")[1]),
        seconds: 0,
        milliseconds: 0,
      });
      
      // If all-day event, set full day ranges
      const finalStartDate = values.isAllDay 
        ? set(startDate, { hours: 0, minutes: 0, seconds: 0 })
        : startDate;
        
      const finalEndDate = values.isAllDay
        ? set(endDate, { hours: 23, minutes: 59, seconds: 59 })
        : endDate;

      // 1. First step is to create or update the main event
      let eventId = event?.id;
      let recurringPatternId = event?.recurring_pattern_id;
      
      // If recurring but we're in edit mode and it wasn't recurring before or
      // if we're turning off recurring for an event that was recurring
      if (isEditMode && event.recurring_pattern_id && !values.isRecurring) {
        // We're turning off recurrence - delete the pattern
        await supabase
          .from('recurring_event_patterns')
          .delete()
          .eq('id', event.recurring_pattern_id);
          
        recurringPatternId = null;
      }
      
      // Prepare event data
      const eventData = {
        title: values.title,
        description: values.description,
        start_date: finalStartDate.toISOString(),
        end_date: finalEndDate.toISOString(),
        is_all_day: values.isAllDay,
        location_id: values.locationId,
        location_text: values.location,
        color: values.color,
        created_by: profileId || userId,
        speakers: values.speakers,
        av_needs: values.avNeeds,
        link: values.link,
        timezone: values.timezone,
        meerkat_enabled: values.meerkatEnabled || false,
        recurring_pattern_id: recurringPatternId, // Will be updated if creating a new pattern
      };

      console.log("Creating/updating event with data:", eventData);
      
      // Create or update the event
      if (isEditMode) {
        // Update existing event
        const { data, error } = await supabase
          .from("events")
          .update(eventData)
          .eq("id", eventId)
          .select("*")
          .single();
          
        if (error) throw error;
        eventId = data.id;
        console.log("Updated event:", data);
      } else {
        // Create new event
        const { data, error } = await supabase
          .from("events")
          .insert(eventData)
          .select("*")
          .single();
          
        if (error) throw error;
        eventId = data.id;
        console.log("Created event:", data);
      }

      // 2. If this is a recurring event, create or update the recurring pattern
      if (values.isRecurring) {
        let patternData = {
          frequency: values.recurringFrequency,
          interval_count: values.recurringInterval || 1,
          days_of_week: values.recurringDaysOfWeek || [],
          start_date: finalStartDate.toISOString(),
          created_by: profileId || userId,
          timezone: values.timezone,
        };
        
        if (values.recurringEndDate) {
          patternData = {
            ...patternData,
            end_date: values.recurringEndDate.toISOString(),
          };
        }
        
        console.log("Creating/updating recurring pattern with data:", patternData);

        // If editing and already has a pattern, update it
        if (isEditMode && recurringPatternId) {
          const { data, error } = await supabase
            .from("recurring_event_patterns")
            .update(patternData)
            .eq("id", recurringPatternId)
            .select("*")
            .single();
            
          if (error) throw error;
          console.log("Updated recurring pattern:", data);
        } else {
          // Create new pattern and link to the event
          const { data, error } = await supabase
            .from("recurring_event_patterns")
            .insert(patternData)
            .select("*")
            .single();
            
          if (error) throw error;
          
          recurringPatternId = data.id;
          console.log("Created recurring pattern:", data);
          
          // Update the event with the new pattern ID
          const { error: updateError } = await supabase
            .from("events")
            .update({ recurring_pattern_id: recurringPatternId })
            .eq("id", eventId);
            
          if (updateError) throw updateError;
          console.log("Updated event with recurring pattern ID:", recurringPatternId);
        }
        
        // The database trigger should handle creating instances, but let's make sure
        // by explicitly calling the database function
        const { error: instanceError } = await supabase.rpc(
          'generate_recurring_event_instances',
          {
            parent_event_id: eventId,
            pattern_id: recurringPatternId,
            pattern_frequency: values.recurringFrequency,
            pattern_interval_count: values.recurringInterval || 1,
            pattern_days_of_week: values.recurringDaysOfWeek || [],
            pattern_start_date: finalStartDate.toISOString(),
            pattern_end_date: values.recurringEndDate ? values.recurringEndDate.toISOString() : null,
            event_timezone: values.timezone
          }
        );
        
        if (instanceError) {
          console.error("Error generating recurring instances:", instanceError);
          toast({
            title: "Warning",
            description: "The event was saved but there was an issue creating recurring instances. Please try again.",
            variant: "destructive",
          });
        } else {
          console.log("Successfully generated recurring instances");
        }
      }
      
      // 3. Handle event tags - first delete existing tag relations
      if (eventId) {
        await supabase.from("event_tag_relations").delete().eq("event_id", eventId);
        
        // Then create new tag relations
        if (values.selectedTags.length > 0) {
          const tagRelations = values.selectedTags.map(tagId => ({
            event_id: eventId,
            tag_id: tagId
          }));
          
          const { error } = await supabase.from("event_tag_relations").insert(tagRelations);
          
          if (error) throw error;
        }
      }
      
      // All operations successful
      toast({
        title: isEditMode ? "Event updated" : "Event created",
        description: `${values.title} has been ${isEditMode ? "updated" : "created"} successfully${values.isRecurring ? " with recurring instances" : ""}.`,
      });
      
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving event:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? "update" : "create"} event: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full md:max-w-md lg:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditMode ? "Edit Event" : "Create Event"}</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
            {/* Basic Event Info */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title*</FormLabel>
                  <FormControl>
                    <Input placeholder="Event title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Event description"
                      className="h-24 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date and Time Fields */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date*</FormLabel>
                    <DatePicker
                      date={field.value}
                      onDateChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-4">
                <FormField
                  control={form.control}
                  name="isAllDay"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">All day</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {!form.watch("isAllDay") && (
                <div className="flex space-x-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Start Time*</FormLabel>
                        <FormControl>
                          <TimeInput {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>End Time*</FormLabel>
                        <FormControl>
                          <TimeInput {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Location */}
            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      const selectedLocation = locations.find((l) => l.id === value);
                      if (selectedLocation) {
                        const locationText = `${selectedLocation.name}${selectedLocation.building ? ` (${selectedLocation.building}${selectedLocation.floor ? `, Floor ${selectedLocation.floor}` : ""})` : ""}`;
                        form.setValue("location", locationText);
                      }
                    }}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} {location.building ? `(${location.building}${location.floor ? `, Floor ${location.floor}` : ""})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!form.watch("locationId") && (
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Text</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter location details" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Timezone */}
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Europe/Zurich">Europe/Zurich</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                      <SelectItem value="Australia/Sydney">Australia/Sydney</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name="selectedTags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Tags className="h-4 w-4" /> Tags
                  </FormLabel>
                  <FormControl>
                    <TagSelector
                      selectedTags={field.value}
                      onTagsChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Event Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      {["#1A1F2C", "#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"].map((color) => (
                        <div
                          key={color}
                          className={`w-8 h-8 rounded-full cursor-pointer border ${field.value === color ? "border-2 border-black dark:border-white" : "border-gray-300"}`}
                          style={{ backgroundColor: color }}
                          onClick={() => field.onChange(color)}
                        />
                      ))}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Recurrence Settings */}
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center space-x-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 flex items-center">
                      <RefreshCw className="h-4 w-4 mr-1" /> Recurring Event
                    </FormLabel>
                  </div>

                  {field.value && (
                    <Card className="mt-2">
                      <CardContent className="pt-4">
                        <RecurrenceSettings form={form} />
                      </CardContent>
                    </Card>
                  )}
                </FormItem>
              )}
            />

            <Separator />

            {/* Additional Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Additional Information</h3>

              <FormField
                control={form.control}
                name="speakers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Mic className="h-4 w-4" /> Speakers
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Event speakers" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avNeeds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Info className="h-4 w-4" /> AV Requirements
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="AV needs" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">External Link</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://example.com" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="meerkatEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Enable Q&A session for this event</FormLabel>
                      <FormDescription>
                        Create an interactive Q&A session for attendees
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                  ? "Update Event"
                  : "Create Event"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};
