
import { Invoice } from "@/types/invoice";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Mail, Users, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";

interface InvoiceCardProps {
  invoice: Invoice;
  onPaymentClick: (paymentLink: string) => void;
  onSendReminder?: (invoice: Invoice, reminderType: 'payment' | 'housing') => void;
  onSendGuildInvite?: (invoice: Invoice, profileId: string) => void;
  isLoading?: boolean;
  isGuildInviteLoading?: boolean;
  isGuildInvited?: boolean;
  profileId?: string;
}

export const InvoiceCard = ({ 
  invoice, 
  onPaymentClick, 
  onSendReminder,
  onSendGuildInvite,
  isLoading,
  isGuildInviteLoading,
  isGuildInvited,
  profileId
}: InvoiceCardProps) => {
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d, yyyy');
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    }
  };

  const showGuildInviteButton = onSendGuildInvite && invoice.status === 'paid' && profileId;

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex gap-2 items-center">
              <Badge className={getStatusStyle(invoice.status)}>
                {invoice.status}
              </Badge>
              {invoice.imported && (
                <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                  Imported
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-medium mt-2">
              {invoice.first_name} {invoice.last_name}
            </h3>
            <p className="text-sm text-gray-500">{invoice.email}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">CHF {invoice.price.toFixed(2)}</p>
            <p className="text-sm text-gray-500">Due: {formatDate(invoice.due_date)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          <div>
            <p className="text-gray-500">Room Type</p>
            <p>{invoice.room_type}</p>
          </div>
          <div>
            <p className="text-gray-500">Created</p>
            <p>{formatDate(invoice.created_at)}</p>
          </div>
          <div>
            <p className="text-gray-500">Stay Period</p>
            <p>{format(parseISO(invoice.checkin), 'MMM d')} - {formatDate(invoice.checkout)}</p>
          </div>
          {invoice.status === 'paid' && invoice.paid_at && (
            <div>
              <p className="text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Payment Date
              </p>
              <p>{formatDate(invoice.paid_at)}</p>
            </div>
          )}
          {onSendReminder && invoice.status !== 'paid' && (
            <div>
              <p className="text-gray-500">Last Reminder</p>
              <p className="text-xs">
                {formatDateTime(invoice.last_reminder_sent)}
                {invoice.reminder_count && invoice.reminder_count > 0 ? 
                  ` (${invoice.reminder_count} ${invoice.reminder_count === 1 ? 'time' : 'times'})` : 
                  ''}
              </p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 justify-end">
        {onSendReminder && (
          <>
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <Button
                onClick={() => onSendReminder(invoice, 'payment')}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                Send Invoice Reminder <Mail className="h-4 w-4" />
              </Button>
            )}
            
            {invoice.status === 'paid' && (
              <Button
                onClick={() => onSendReminder(invoice, 'housing')}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                Send Housing Preferences Reminder <Mail className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
        
        {showGuildInviteButton && (
          <Button
            onClick={() => onSendGuildInvite(invoice, profileId)}
            variant="outline"
            size="sm"
            disabled={isGuildInviteLoading || isGuildInvited}
            className="flex items-center gap-2"
          >
            {isGuildInviteLoading ? 'Sending...' : isGuildInvited ? 'Invited' : 'Invite to Guild'} <Users className="h-4 w-4" />
          </Button>
        )}
        
        <Button
          onClick={() => onPaymentClick(invoice.payment_link)}
          variant="outline"
          size="sm"
          disabled={invoice.status === 'paid' || invoice.status === 'cancelled'}
          className="flex items-center gap-2"
        >
          {onSendReminder ? 'Payment' : 'Pay Now'} <ExternalLink className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
