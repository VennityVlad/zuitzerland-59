import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink, Mail, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Invoice } from "@/types/invoice";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceCard } from "./InvoiceCard";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InvoiceTableProps {
  invoices: Invoice[];
  isAdmin: boolean;
  onPaymentClick: (paymentLink: string) => void;
  useCardView?: boolean;
  profileInvitationStatus?: Record<string, boolean>;
}

export const InvoiceTable = ({ 
  invoices, 
  isAdmin, 
  onPaymentClick,
  useCardView = true,
  profileInvitationStatus = {}
}: InvoiceTableProps) => {
  const { toast } = useToast();
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);
  const [guildInviteLoading, setGuildInviteLoading] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d');
  };

  const formatDateWithYear = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d, yyyy');
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleSendReminder = async (invoice: Invoice, reminderType: 'payment' | 'housing' = 'payment') => {
    try {
      setLoadingInvoiceId(invoice.id);
      
      const emailSubject = reminderType === 'payment' 
        ? "Reminder to Pay Your Zuitzerland Invoice"
        : "Complete Your Housing Preferences for Zuitzerland";
      
      const response = await supabase.functions.invoke('send-email-reminder', {
        body: {
          invoiceId: invoice.id,
          email: invoice.email,
          firstName: invoice.first_name,
          lastName: invoice.last_name,
          invoiceAmount: invoice.price,
          dueDate: formatDateWithYear(invoice.due_date),
          paymentLink: invoice.payment_link,
          reminderType: reminderType
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send reminder');
      }

      toast({
        title: "Reminder Sent",
        description: `${reminderType === 'payment' ? 'Payment' : 'Housing preferences'} reminder sent to ${invoice.email}`,
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Failed to Send Reminder",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  const handleSendGuildInvite = async (invoice: Invoice, profileId: string) => {
    if (!profileId) {
      toast({
        title: "Error",
        description: "No profile ID available for this user",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setGuildInviteLoading(invoice.id);
      
      const response = await supabase.functions.invoke('send-guild-invitation', {
        body: {
          invoiceId: invoice.id,
          profileId: profileId,
          email: invoice.email,
          firstName: invoice.first_name,
          lastName: invoice.last_name
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send guild invitation');
      }

      toast({
        title: "Invitation Sent",
        description: `Guild invitation sent to ${invoice.email}`,
      });
      
      // Update local state to reflect the invitation was sent
      profileInvitationStatus[profileId] = true;
    } catch (error) {
      console.error('Error sending guild invitation:', error);
      toast({
        title: "Failed to Send Invitation",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setGuildInviteLoading(null);
    }
  };

  // Card view (default view now)
  if (useCardView) {
    return (
      <div className="space-y-4">
        {invoices.map(invoice => (
          <InvoiceCard 
            key={invoice.id}
            invoice={invoice}
            onPaymentClick={onPaymentClick}
            onSendReminder={isAdmin ? handleSendReminder : undefined}
            onSendGuildInvite={isAdmin ? handleSendGuildInvite : undefined}
            isLoading={loadingInvoiceId === invoice.id}
            isGuildInviteLoading={guildInviteLoading === invoice.id}
            isGuildInvited={invoice.profile_id ? profileInvitationStatus[invoice.profile_id] : false}
            profileId={invoice.profile_id}
          />
        ))}
      </div>
    );
  }

  // Table view (only used if explicitly set to false)
  // Admin view includes additional user information columns
  if (isAdmin) {
    return (
      <ScrollArea className="w-full">
        <div className="min-w-max">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Room Type</TableHead>
                <TableHead>Stay Period</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Reminder</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    {formatDateWithYear(invoice.created_at)}
                  </TableCell>
                  <TableCell>{invoice.first_name}</TableCell>
                  <TableCell>{invoice.last_name}</TableCell>
                  <TableCell>{invoice.email}</TableCell>
                  <TableCell>{invoice.room_type}</TableCell>
                  <TableCell>
                    {formatDate(invoice.checkin)} - {formatDateWithYear(invoice.checkout)}
                  </TableCell>
                  <TableCell>CHF {invoice.price.toFixed(2)}</TableCell>
                  <TableCell>
                    {formatDateWithYear(invoice.due_date)}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {invoice.last_reminder_sent ? (
                      <div className="text-xs">
                        <div>{formatDateTime(invoice.last_reminder_sent)}</div>
                        <div className="text-gray-500">
                          {invoice.reminder_count && invoice.reminder_count > 0 
                            ? `Sent ${invoice.reminder_count} ${invoice.reminder_count === 1 ? 'time' : 'times'}` 
                            : ''}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">Never sent</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => onPaymentClick(invoice.payment_link)}
                        variant="outline"
                        size="sm"
                        disabled={invoice.status === 'paid' || invoice.status === 'cancelled'}
                        className="flex items-center gap-2"
                      >
                        Payment <ExternalLink className="h-4 w-4" />
                      </Button>
                      
                      {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                        <Button
                          onClick={() => handleSendReminder(invoice, 'payment')}
                          variant="outline"
                          size="sm"
                          disabled={loadingInvoiceId === invoice.id}
                          className="flex items-center gap-2"
                        >
                          Send Invoice Reminder <Mail className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {invoice.status === 'paid' && (
                        <Button
                          onClick={() => handleSendReminder(invoice, 'housing')}
                          variant="outline"
                          size="sm"
                          disabled={loadingInvoiceId === invoice.id}
                          className="flex items-center gap-2"
                        >
                          Send Housing Preferences Reminder <Mail className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {invoice.status === 'paid' && invoice.profile_id && (
                        <Button
                          onClick={() => handleSendGuildInvite(invoice, invoice.profile_id!)}
                          variant="outline"
                          size="sm"
                          disabled={guildInviteLoading === invoice.id || (invoice.profile_id ? profileInvitationStatus[invoice.profile_id] : false)}
                          className="flex items-center gap-2"
                        >
                          {guildInviteLoading === invoice.id 
                            ? 'Sending...' 
                            : (invoice.profile_id && profileInvitationStatus[invoice.profile_id]) 
                              ? 'Invited' 
                              : 'Invite to Guild'} <Users className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    );
  }

  // Regular user view with table
  return (
    <ScrollArea className="w-full">
      <div className="min-w-max">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Room Type</TableHead>
              <TableHead>Stay Period</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  {formatDateWithYear(invoice.created_at)}
                </TableCell>
                <TableCell>{invoice.room_type}</TableCell>
                <TableCell>
                  {formatDate(invoice.checkin)} - {formatDateWithYear(invoice.checkout)}
                </TableCell>
                <TableCell>CHF {invoice.price.toFixed(2)}</TableCell>
                <TableCell>
                  {formatDateWithYear(invoice.due_date)}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => onPaymentClick(invoice.payment_link)}
                    variant="outline"
                    size="sm"
                    disabled={invoice.status === 'paid' || invoice.status === 'cancelled'}
                    className="flex items-center gap-2"
                  >
                    Pay Now <ExternalLink className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
};
