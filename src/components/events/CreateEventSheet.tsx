import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarDays, Check, ChevronsUpDown } from "lucide-react";
import { Listbox, Transition } from '@headlessui/react'
import { Editor } from "@/components/editor";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { supabase } from "@/integrations/supabase/client";

const eventFormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  start_date: z.date(),
  end_date: z.date(),
  location_id: z.string().optional(),
  location_text: z.string().optional(),
  color: z.string().optional(),
  is_all_day: z.boolean().default(false),
  av_needs: z.string().optional(),
  speakers: z.string().optional(),
  link: z.string().optional(),
  timezone: z.string().optional(),
  image_url: z.string().optional(),
});

interface CreateEventSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
  event?: any;
  profileId?: string;
}

export function CreateEventSheet({
  open,
  onOpenChange,
  onSuccess,
  userId,
  event,
  profileId,
}: CreateEventSheetProps) {
  const [date, setDate] = useState<Date | undefined>(event ? new Date(event.start_date) : undefined);
  const [isAllDay, setIsAllDay] = useState(event ? event.is_all_day : false);

  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: event?.title || "",
      description: event?.description || "",
      start_date: event ? new Date(event.start_date) : new Date(),
      end_date: event ? new Date(event.end_date) : new Date(),
      location_id: event?.location_id || "",
      location_text: event?.location_text || "",
      color: event?.color || "#000000",
      is_all_day: event?.is_all_day || false,
      av_needs: event?.av_needs || "",
      speakers: event?.speakers || "",
      link: event?.link || "",
      timezone: event?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      image_url: event?.image_url || "",
    },
  });

  function onSubmit(values: z.infer<typeof eventFormSchema>) {
    return new Promise<void>((resolve) => {
      const upsertEvent = async () => {
        try {
          const { data, error } = await supabase
            .from("events")
            .upsert([
              {
                id: event?.id,
                title: values.title,
                description: values.description,
                start_date: values.start_date.toISOString(),
                end_date: values.end_date.toISOString(),
                location_id: values.location_id,
                location_text: values.location_text,
                color: values.color,
                is_all_day: values.is_all_day,
                created_by: profileId,
                av_needs: values.av_needs,
                speakers: values.speakers,
                link: values.link,
                timezone: values.timezone,
                image_url: values.image_url,
              },
            ])
            .select();

          if (error) {
            console.error("Error creating event:", error);
            return;
          }

          form.reset();
          onSuccess();
          onOpenChange(false);
        } catch (error) {
          console.error("Error creating event:", error);
        } finally {
          resolve();
        }
      };

      upsertEvent();
    });
  }

  const handleImageUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${Date.now()}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('event-covers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-covers')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{event ? "Edit Event" : "Create Event"}</SheetTitle>
        </SheetHeader>
        
        <div className="py-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <ImageUpload
                value={form.watch("image_url") || ""}
                onChange={(url) => form.setValue("image_url", url)}
                onUpload={handleImageUpload}
                className="mb-6"
              />
              
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
                        placeholder="Write a description about the event"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Event Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date()
                          }
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
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Event End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date()
                          }
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
                name="location_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Text</FormLabel>
                    <FormControl>
                      <Input placeholder="Location" {...field} />
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
                      <Input placeholder="Speakers" {...field} />
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
                    <FormLabel>Link</FormLabel>
                    <FormControl>
                      <Input placeholder="Link" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit">
              {event ? "Update Event" : "Create Event"}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
