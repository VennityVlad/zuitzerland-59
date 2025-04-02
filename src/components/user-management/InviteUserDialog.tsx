
import { useState } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type InviteUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserInvited: () => void;
};

type FormValues = {
  name: string;
  email: string;
  role: "admin" | "co-designer" | "co-curator" | "";
};

const InviteUserDialog = ({ open, onOpenChange, onUserInvited }: InviteUserDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      email: "",
      role: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // First, check if user already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', data.email)
        .maybeSingle();

      if (existingProfile) {
        toast({
          title: "User already exists",
          description: "This email is already associated with an account",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Create a new profile
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: uuidv4(),
          email: data.email,
          role: data.role || null,
          full_name: data.name,
          username: `user_${Math.floor(Math.random() * 10000)}`
        });

      if (error) throw error;

      // Add user to Privy allowlist
      const { error: privyError } = await supabase.functions.invoke("add-to-privy-allowlist", {
        body: {
          email: data.email
        }
      });

      if (privyError) {
        console.error("Error adding user to Privy allowlist:", privyError);
        toast({
          title: "Warning",
          description: "User was created but could not be added to the login allowlist. They may have trouble signing in.",
          variant: "destructive",
        });
      }

      // Send invitation email using our edge function
      const { error: emailError } = await supabase.functions.invoke("send-invitation-email", {
        body: {
          name: data.name,
          email: data.email,
          role: data.role || "unassigned"
        }
      });

      if (emailError) {
        console.error("Error sending invitation email:", emailError);
        throw new Error("Failed to send invitation email");
      }

      toast({
        title: "User invited",
        description: `Invitation has been sent to ${data.email}`,
      });
      
      form.reset();
      onOpenChange(false);
      onUserInvited();
    } catch (error) {
      console.error('Error inviting user:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Send an invitation email to add a new user to the system.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="John Doe" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="user@example.com" required />
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
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="co-designer">Co-Designer</SelectItem>
                      <SelectItem value="co-curator">Co-Curator</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending Invitation..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUserDialog;
