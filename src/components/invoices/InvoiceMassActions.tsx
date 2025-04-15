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
  profileInvitationStatus?: Record<string, boolean>;
}

export const InvoiceMassActions = ({ 
  invoices, 
  onComplete,
  profileInvitationStatus = {}
}: InvoiceMassActionsProps) => {
  const { toast } = useToast();
  const [isPaymentRemindersLoading, setIsPaymentRemindersLoading] = useState(false);
  const [isHousingRemindersLoading, setIsHousingRemindersLoading] = useState(false);
  const [isGuildInvitesLoading, setIsGuildInvitesLoading] = useState(false);
  
  // Filter invoices for payment reminders (only pending/overdue)
  const paymentReminderEligibleInvoices = invoices.filter(
    (invoice) => invoice.status !== 'paid' && invoice.status !== 'cancelled'
  );
  
  // Updated: Filter invoices for housing preferences reminders (paid OR pending AND no housing preferences set)
  const housingReminderEligibleInvoices = invoices.filter(
    (invoice) => 
      (invoice.status === 'paid' || invoice.status === 'pending') &&
      (!invoice.profile?.housing_preferences || 
       Object.keys(invoice.profile.housing_preferences || {}).length === 0)
  );
  
  // Filter invoices for guild invites (only paid with profile_id and not already invited)
  const guildInviteEligibleInvoices = invoices.filter(
    (invoice) => 
      invoice.status === 'paid' && 
      invoice.profile_id && 
      !invoice.profile_id.includes("00000000") &&
      // Filter out profiles that are already invited
      !(invoice.profile_id && profileInvitationStatus[invoice.profile_id])
  );

  const formatDateWithYear = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d, yyyy');
  };

  const handleSendMassPaymentReminders = async () => {
    if (paymentReminderEligibleInvoices.length === 0) {
      toast({
        title: "No Eligible Invoices",
        description: "There are no pending or overdue invoices to send payment reminders to.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsPaymentRemindersLoading(true);
      let successCount = 0;
      let errorCount = 0;

      for (const invoice of paymentReminderEligibleInvoices) {
        try {
          const response = await supabase.functions.invoke('send-email-reminder', {
            body: {
              invoiceId: invoice.id,
              email: invoice.email,
              firstName: invoice.first_name,
              lastName: invoice.last_name,
              invoiceAmount: invoice.price,
              dueDate: formatDateWithYear(invoice.due_date),
              paymentLink: invoice.payment_link,
              reminderType: 'payment'
            }
          });

          if (response.error) {
            console.error(`Error sending payment reminder for invoice ${invoice.id}:`, response.error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error(`Exception sending payment reminder for invoice ${invoice.id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Payment Reminders Sent",
          description: `Successfully sent ${successCount} payment reminders${errorCount > 0 ? ` (${errorCount} failed)` : ''}.`,
          variant: successCount > 0 ? "default" : "destructive",
        });
      } else {
        toast({
          title: "Failed to Send Payment Reminders",
          description: "No payment reminders were sent successfully.",
          variant: "destructive",
        });
      }

      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error sending mass payment reminders:', error);
      toast({
        title: "Failed to Send Payment Reminders",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsPaymentRemindersLoading(false);
    }
  };

  const handleSendMassHousingReminders = async () => {
    if (housingReminderEligibleInvoices.length === 0) {
      toast({
        title: "No Eligible Invoices",
        description: "There are no paid invoices to send housing preference reminders to.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsHousingRemindersLoading(true);
      let successCount = 0;
      let errorCount = 0;

      for (const invoice of housingReminderEligibleInvoices) {
        try {
          const response = await supabase.functions.invoke('send-email-reminder', {
            body: {
              invoiceId: invoice.id,
              email: invoice.email,
              firstName: invoice.first_name,
              lastName: invoice.last_name,
              invoiceAmount: invoice.price,
              dueDate: formatDateWithYear(invoice.due_date),
              paymentLink: invoice.payment_link,
              reminderType: 'housing'
            }
          });

          if (response.error) {
            console.error(`Error sending housing reminder for invoice ${invoice.id}:`, response.error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error(`Exception sending housing reminder for invoice ${invoice.id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Housing Preferences Reminders Sent",
          description: `Successfully sent ${successCount} housing reminders${errorCount > 0 ? ` (${errorCount} failed)` : ''}.`,
          variant: successCount > 0 ? "default" : "destructive",
        });
      } else {
        toast({
          title: "Failed to Send Housing Reminders",
          description: "No housing preference reminders were sent successfully.",
          variant: "destructive",
        });
      }

      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error sending mass housing reminders:', error);
      toast({
        title: "Failed to Send Housing Reminders",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsHousingRemindersLoading(false);
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
        onClick={handleSendMassPaymentReminders}
        variant="secondary"
        disabled={isPaymentRemindersLoading || paymentReminderEligibleInvoices.length === 0}
        className="flex items-center gap-2"
      >
        {isPaymentRemindersLoading ? 'Sending...' : `Send Invoice Payment Reminders (${paymentReminderEligibleInvoices.length})`} <Mail className="h-4 w-4" />
      </Button>
      
      <Button
        onClick={handleSendMassHousingReminders}
        variant="secondary"
        disabled={isHousingRemindersLoading || housingReminderEligibleInvoices.length === 0}
        className="flex items-center gap-2"
      >
        {isHousingRemindersLoading ? 'Sending...' : `Send Housing Preferences Reminders (${housingReminderEligibleInvoices.length})`} <Mail className="h-4 w-4" />
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
