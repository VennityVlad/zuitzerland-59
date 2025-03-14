import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const profileSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  role: z.enum(["admin", "co-curator", "co-designer"]).optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface AddProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddProfileDialog({ open, onOpenChange, onSuccess }: AddProfileDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: "",
      username: "",
      role: undefined,
      description: "",
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      setIsLoading(true);

      // Check if a profile with this email already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", values.email)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking for existing profile:", checkError);
        throw checkError;
      }

      if (existingProfile) {
        form.setError("email", {
          type: "manual",
          message: "A profile with this email already exists",
        });
        return;
      }

      // If using Edge Function to create profiles
      try {
        const response = await fetch(
          "https://cluqnvnxjexrhhgddoxu.supabase.co/functions/v1/create-profile-from-airtable",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabase.auth.getSession()}`,
            },
            body: JSON.stringify({
              email: values.email,
              role: values.role,
            }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to create profile");
        }

        // If the profile was created, update with additional fields
        if (result.profile && result.profile.id) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              username: values.username || null,
              description: values.description || null,
            })
            .eq("id", result.profile.id);

          if (updateError) {
            console.error("Error updating profile details:", updateError);
            // Don't throw here, as the profile was created successfully
          }
        }

        toast({
          title: "Success",
          description: "Profile created successfully",
        });

        form.reset();
        onOpenChange(false);
        onSuccess();
      } catch (error) {
        // Fallback to direct Supabase insertion if Edge Function fails
        console.error("Edge function error, using direct insert:", error);
        
        const { data, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: crypto.randomUUID(),
            email: values.email,
            username: values.username || null,
            role: values.role || null,
            description: values.description || null,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating profile:", insertError);
          throw insertError;
        }

        toast({
          title: "Success",
          description: "Profile created successfully",
        });

        form.reset();
        onOpenChange(false);
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      toast({
        title: "Error",
        description: "Failed to create profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New User Profile</DialogTitle>
          <DialogDescription>
            Create a new user profile. This will not create an account for the user,
            but will allow you to assign roles and permissions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="user@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="username" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role (optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="co-curator">Co-Curator</SelectItem>
                      <SelectItem value="co-designer">Co-Designer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Brief description or notes about this user"
                      className="resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Profile"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
