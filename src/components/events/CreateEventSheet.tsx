import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { RecurrenceSettings, RecurrenceFrequency } from "@/components/events/RecurrenceSettings";
import { useToast } from "@/hooks/use-toast";
import { useAuthenticatedSupabase } from "@/hooks/useAuthenticatedSupabase";
import { MultiSelect } from "@/components/ui/multi-select";
import { usePrivy } from "@privy-io/react-auth";

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const convertToUTC = (date: Date, time: string, timezone: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const localDate = new Date(date);
  localDate.setHours(hours, minutes, 0, 0);

  const utcDate = new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' }));
  return utcDate.toISOString();
};

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  startDate: z.date(),
  startTime: z.string().default("12:00"),
  endDate: z.date(),
  endTime: z.string().default("13:00"),
  isAllDay: z.boolean().default(false),
  locationId: z.string().optional(),
  locationText: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('weekly'),
  recurringInterval: z.number().min(1).default(1),
  recurringEndDate: z.date().optional(),
  recurringDays: z.array(z.number()).optional(),
  color: z.string().optional(),
  tags: z.array(z.string()).optional(),
  meerkatEnabled: z.boolean().default(false),
  link: z.string().optional(),
  speakers: z.string().optional(),
  avNeeds: z.string().optional()
});

interface CreateEventSheetProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  locations: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  onEventCreated?: () => void;
}

export function CreateEventSheet({ open, setOpen, locations, tags, onEventCreated }: CreateEventSheetProps) {
  const { toast } = useToast();
  const { supabase } = useAuthenticatedSupabase();
  const [userProfile, setUserProfile] = useState<{ id: string } | null>(null);
  const { user } = usePrivy();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!supabase || !user?.id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('privy_id', user.id)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to load user profile.",
          variant: "destructive",
        });
      } else if (data) {
        setUserProfile(data);
      }
    };
    
    fetchProfile();
  }, [supabase, user?.id, toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: new Date(),
      startTime: "12:00",
      endDate: new Date(),
      endTime: "13:00",
      isAllDay: false,
      locationId: locations.length > 0 ? locations[0].id : "none",
      isRecurring: false,
      recurringFrequency: 'weekly',
      recurringInterval: 1,
      recurringDays: [],
      color: null,
      tags: [],
      meerkatEnabled: false
    },
  });

  // Update the handleSubmit function to correctly handle recurring event creation
  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      console.log("Start of form submission, current form values:", data);
      
      // Clone the data to avoid mutation
      const formData = { ...data };
      
      // Convert local dates to UTC
      console.log("Before UTC conversion:", formData);
      formData.startDate = convertToUTC(formData.startDate, formData.startTime, timezone);
      formData.endDate = convertToUTC(formData.endDate, formData.endTime, timezone);
      console.log("After UTC conversion:", formData);
      
      let recurring_pattern_id = null;
      
      // Handle recurring event pattern if isRecurring is true
      if (formData.isRecurring) {
        // Make sure we have the current user's profile ID
        if (!userProfile?.id) {
          throw new Error("User profile ID is required for creating recurring events");
        }
        
        // Convert end date to UTC if provided
        let endDateUTC = null;
        if (formData.recurringEndDate) {
          // Set time to end of day for the end date
          const endOfDay = new Date(formData.recurringEndDate);
          endOfDay.setHours(23, 59, 59, 999);
          endDateUTC = convertToUTC(endOfDay, "23:59", timezone);
          console.log("Recurring end date (UTC):", endDateUTC);
        }
        
        // Create the recurring pattern
        const { data: patternData, error: patternError } = await supabase
          .from('recurring_event_patterns')
          .insert({
            created_by: userProfile.id, // Use the profile ID, not the auth user ID
            frequency: formData.recurringFrequency,
            interval_count: formData.recurringInterval,
            days_of_week: formData.recurringFrequency === 'weekly' ? formData.recurringDays : null,
            start_date: formData.startDate,
            end_date: endDateUTC,
            timezone: timezone
          })
          .select()
          .single();
        
        if (patternError) {
          console.error("Error creating recurring pattern:", patternError);
          throw patternError;
        }
        
        recurring_pattern_id = patternData.id;
        console.log("Created recurring pattern with ID:", recurring_pattern_id);
      }
      
      // Create the event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert({
          title: formData.title,
          description: formData.description,
          start_date: formData.startDate,
          end_date: formData.endDate,
          is_all_day: formData.isAllDay,
          created_by: userProfile.id, // Use the profile ID
          location_id: formData.locationId === "none" ? null : formData.locationId,
          location_text: formData.locationText,
          recurring_pattern_id: recurring_pattern_id,
          color: formData.color,
          timezone: timezone,
          meerkat_enabled: formData.meerkatEnabled,
          link: formData.link,
          speakers: formData.speakers,
          av_needs: formData.avNeeds
        })
        .select();
      
      if (eventError) {
        console.error("Error saving event:", eventError);
        throw eventError;
      }
      
      // Add event tags if selected
      if (formData.tags && formData.tags.length > 0 && eventData && eventData[0]) {
        const eventId = eventData[0].id;
        
        for (const tagId of formData.tags) {
          const { error: tagError } = await supabase
            .from('event_tag_relations')
            .insert({
              event_id: eventId,
              tag_id: tagId
            });
          
          if (tagError) {
            console.error("Error adding tag relation:", tagError);
            // Continue with other tags even if one fails
          }
        }
      }
      
      toast({
        title: "Event Created",
        description: `Successfully created "${formData.title}"`,
      });
      
      // Close the sheet and refresh events
      setOpen(false);
      
      if (onEventCreated) {
        onEventCreated();
      }
    } catch (error) {
      console.error("Error saving event:", error);
      toast({
        title: "Error",
        description: "There was a problem creating your event.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
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
                  placeholder="Write a description for your event"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={
                          "w-full pl-3 text-left font-normal" +
                          (field.value ? " text-foreground" : " text-muted-foreground")
                        }
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={
                          "w-full pl-3 text-left font-normal" +
                          (field.value ? " text-foreground" : " text-muted-foreground")
                        }
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="isAllDay"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-md border px-3 py-2">
              <div className="space-y-0.5">
                <FormLabel className="text-base">All Day</FormLabel>
                <FormDescription>
                  Is this an all day event?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="locationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
                  ))}
                  <SelectItem value="none">No Location</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.getValues("locationId") === "none" && (
          <FormField
            control={form.control}
            name="locationText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location Text</FormLabel>
                <FormControl>
                  <Input placeholder="Enter location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <Input type="color" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <MultiSelect
                options={tags.map(tag => ({ label: tag.name, value: tag.id }))}
                value={field.value}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <RecurrenceSettings
          isRecurring={form.watch("isRecurring")}
          onIsRecurringChange={(value: boolean) => form.setValue("isRecurring", value)}
          frequency={form.watch("recurringFrequency")}
          onFrequencyChange={(value: RecurrenceFrequency) => form.setValue("recurringFrequency", value)}
          intervalCount={form.watch("recurringInterval")}
          onIntervalCountChange={(value: number) => form.setValue("recurringInterval", value)}
          endDate={form.watch("recurringEndDate")}
          onEndDateChange={(date: Date | null) => form.setValue("recurringEndDate", date)}
          daysOfWeek={form.watch("recurringDays") || []}
          onDaysOfWeekChange={(days: number[]) => form.setValue("recurringDays", days)}
        />
        <FormField
          control={form.control}
          name="meerkatEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-md border px-3 py-2">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enable Meerkat</FormLabel>
                <FormDescription>
                  Enable Meerkat for this event?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link</FormLabel>
              <FormControl>
                <Input placeholder="Event link" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="speakers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Speakers</FormLabel>
              <FormControl>
                <Input placeholder="Event speakers" {...field} />
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
              <FormLabel>AV Needs</FormLabel>
              <FormControl>
                <Input placeholder="Event AV Needs" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
