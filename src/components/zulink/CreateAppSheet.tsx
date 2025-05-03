
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSupabaseJwt } from "@/components/SupabaseJwtProvider";
import { v4 as uuidv4 } from "uuid";
import { ImageUpload } from "@/components/ui/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

interface CreateAppSheetProps {
  onAppCreated?: () => void;
  hasPaidInvoice: boolean;
}

const appFormSchema = z.object({
  name: z.string().min(1, { message: "App name is required" }),
  url: z.string().url({ message: "Please enter a valid URL" }),
  description: z.string().optional(),
  image_url: z.string().optional(),
});

type AppFormValues = z.infer<typeof appFormSchema>;

export function CreateAppSheet({ onAppCreated, hasPaidInvoice }: CreateAppSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { authenticatedSupabase } = useSupabaseJwt();

  const form = useForm<AppFormValues>({
    resolver: zodResolver(appFormSchema),
    defaultValues: {
      name: "",
      url: "",
      description: "",
      image_url: "",
    },
  });

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      if (!authenticatedSupabase) {
        throw new Error("Not authenticated");
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `app-images/${fileName}`;

      const { error: uploadError } = await authenticatedSupabase.storage
        .from('public')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = authenticatedSupabase.storage
        .from('public')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error uploading image",
        description: "Please try again later",
        variant: "destructive",
      });
      return null;
    }
  };

  const onSubmit = async (data: AppFormValues) => {
    if (!hasPaidInvoice) {
      toast({
        title: "Not eligible",
        description: "You need to have a paid invoice to submit apps",
        variant: "destructive",
      });
      return;
    }

    if (!authenticatedSupabase) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to submit an app",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await authenticatedSupabase
        .from('zulink_apps')
        .insert({
          name: data.name,
          url: data.url,
          description: data.description || null,
          image_url: data.image_url || null,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "App submitted",
        description: "Your app has been submitted for review",
      });
      form.reset();
      setIsOpen(false);
      if (onAppCreated) {
        onAppCreated();
      }
    } catch (error) {
      console.error('Error submitting app:', error);
      toast({
        title: "Error submitting app",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="default" disabled={!hasPaidInvoice}>
          <Plus className="h-4 w-4 mr-2" />
          Submit App
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Submit a ZuLink App</SheetTitle>
          <SheetDescription>
            Submit your app for review. Once approved, it will be available in the ZuLink App Store.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex justify-center">
                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <ImageUpload
                      value={field.value || ""}
                      onChange={field.onChange}
                      onUpload={handleImageUpload}
                    />
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>App Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter app name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>App URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
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
                        placeholder="Brief description of your app"
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit App"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
