
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/types/invoice";
import { format, parseISO } from "date-fns";

interface InvoiceMassActionsProps {
  invoices: Invoice[];
  onComplete?: () => void;
}

export const InvoiceMassActions = ({ invoices, onComplete }: InvoiceMassActionsProps) => {
  const { toast } = useToast();
  const [isRemindersLoading, setIsRemindersLoading] = useState(false);
  const [isGuildInvitesLoading, setIsGuildInvitesLoading] = useState(false);
  
  // Filter invoices for reminders (only pending/overdue)
  const reminderEligibleInvoices = invoices.filter(
    (invoice) => invoice.status !== 'paid' && invoice.status !== 'cancelled'
  );
  
  // Filter invoices for guild invites (only paid with profile_id)
  const guildInviteEligibleInvoices = invoices.filter(
    (invoice) => 
      invoice.status === 'paid' && 
      invoice.profile_id && 
      !invoice.profile_id.includes("00000000")
  );

  const formatDateWithYear = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d, yyyy');
  };

  const handleSendMassReminders = async () => {
    if (reminderEligibleInvoices.length === 0) {
      toast({
        title: "No Eligible Invoices",
        description: "There are no pending or overdue invoices to send reminders to.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRemindersLoading(true);
      let successCount = 0;
      let errorCount = 0;

      for (const invoice of reminderEligibleInvoices) {
        try {
          const response = await supabase.functions.invoke('send-email-reminder', {
            body: {
              invoiceId: invoice.id,
              email: invoice.email,
              firstName: invoice.first_name,
              lastName: invoice.last_name,
              invoiceAmount: invoice.price,
              dueDate: formatDateWithYear(invoice.due_date),
              paymentLink: invoice.payment_link
            }
          });

          if (response.error) {
            console.error(`Error sending reminder for invoice ${invoice.id}:`, response.error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error(`Exception sending reminder for invoice ${invoice.id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Reminders Sent",
          description: `Successfully sent ${successCount} reminders${errorCount > 0 ? ` (${errorCount} failed)` : ''}.`,
          variant: successCount > 0 ? "default" : "destructive",
        });
      } else {
        toast({
          title: "Failed to Send Reminders",
          description: "No reminders were sent successfully.",
          variant: "destructive",
        });
      }

      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error sending mass reminders:', error);
      toast({
        title: "Failed to Send Reminders",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsRemindersLoading(false);
    }
  };

  const handleSendMassGuildInvites = async () => {
    if (guildInviteEligibleInvoices.length === 0) {
      toast({
        title: "No Eligible Invoices",
        description: "There are no paid invoices with valid profiles to invite to the guild.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGuildInvitesLoading(true);
      let successCount = 0;
      let errorCount = 0;

      for (const invoice of guildInviteEligibleInvoices) {
        if (!invoice.profile_id) continue;
        
        try {
          const response = await supabase.functions.invoke('send-guild-invitation', {
            body: {
              invoiceId: invoice.id,
              profileId: invoice.profile_id,
              email: invoice.email,
              firstName: invoice.first_name,
              lastName: invoice.last_name
            }
          });

          if (response.error) {
            console.error(`Error sending guild invite for invoice ${invoice.id}:`, response.error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error(`Exception sending guild invite for invoice ${invoice.id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Guild Invitations Sent",
          description: `Successfully sent ${successCount} invitations${errorCount > 0 ? ` (${errorCount} failed)` : ''}.`,
          variant: successCount > 0 ? "default" : "destructive",
        });
      } else {
        toast({
          title: "Failed to Send Invitations",
          description: "No guild invitations were sent successfully.",
          variant: "destructive",
        });
      }

      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error sending mass guild invites:', error);
      toast({
        title: "Failed to Send Guild Invitations",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGuildInvitesLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Button
        onClick={handleSendMassReminders}
        variant="secondary"
        disabled={isRemindersLoading || reminderEligibleInvoices.length === 0}
        className="flex items-center gap-2"
      >
        {isRemindersLoading ? 'Sending...' : `Send Reminders (${reminderEligibleInvoices.length})`} <Mail className="h-4 w-4" />
      </Button>
      
      <Button
        onClick={handleSendMassGuildInvites}
        variant="secondary"
        disabled={isGuildInvitesLoading || guildInviteEligibleInvoices.length === 0}
        className="flex items-center gap-2"
      >
        {isGuildInvitesLoading ? 'Sending...' : `Invite to Guild (${guildInviteEligibleInvoices.length})`} <Users className="h-4 w-4" />
      </Button>
    </div>
  );
};
