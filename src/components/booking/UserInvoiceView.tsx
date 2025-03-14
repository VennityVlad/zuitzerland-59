
import { Invoice } from "@/types/invoice";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, Home, DollarSign, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface UserInvoiceViewProps {
  invoice: Invoice;
}

export function UserInvoiceView({ invoice }: UserInvoiceViewProps) {
  const isMobile = useIsMobile();
  
  // Fetch room type details
  const { data: roomTypeDetails } = useQuery({
    queryKey: ['roomTypeDetails', invoice.room_type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_types')
        .select('display_name, description')
        .eq('code', invoice.room_type)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: Boolean(invoice.room_type)
  });

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMMM d, yyyy');
  };

  const getDaysRemaining = () => {
    const dueDate = parseISO(invoice.due_date);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getStatusColor = (status: string) => {
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

  const handlePaymentClick = () => {
    window.open(invoice.payment_link, '_blank');
  };

  const daysRemaining = getDaysRemaining();
  const isOverdue = invoice.status === 'overdue';
  const isPaid = invoice.status === 'paid';
  const isPaymentPending = invoice.status === 'pending';

  return (
    <div className={`${isMobile ? 'p-4' : 'p-8'} bg-white ${isMobile ? 'mobile-full-width' : 'rounded-xl shadow-lg'}`}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Your Booking Details</h2>
        <p className="text-gray-600">
          {isPaid ? (
            "Your booking has been confirmed. We're looking forward to your stay!"
          ) : (
            "Complete your payment to confirm your reservation."
          )}
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle>Booking Summary</CardTitle>
            <Badge className={getStatusColor(invoice.status)}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Stay Dates</h3>
                    <p className="text-gray-700">
                      {formatDate(invoice.checkin)} - {formatDate(invoice.checkout)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Home className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Room Type</h3>
                    <p className="text-gray-700">
                      {roomTypeDetails?.display_name || invoice.room_type}
                    </p>
                    {roomTypeDetails?.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {roomTypeDetails.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Payment Details</h3>
                    <p className="text-gray-700 font-semibold">
                      CHF {invoice.price.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Invoice #{invoice.invoice_uid}
                    </p>
                  </div>
                </div>

                {!isPaid && (
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-medium">Due Date</h3>
                      <p className="text-gray-700">
                        {formatDate(invoice.due_date)}
                      </p>
                      {isPaymentPending && daysRemaining > 0 && (
                        <p className="text-sm text-amber-600 mt-1">
                          {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                        </p>
                      )}
                      {isOverdue && (
                        <p className="text-sm text-red-600 mt-1">
                          Payment overdue
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {roomTypeDetails && (
              <div className="pt-2 mt-2 border-t border-gray-100">
                <div className="flex items-start space-x-3 mt-4">
                  <div className="w-full">
                    <h3 className="font-medium mb-2">Guest Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="text-gray-700">{invoice.first_name} {invoice.last_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-gray-700">{invoice.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="pt-2 border-t border-gray-100">
          {isPaid ? (
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center text-green-600 space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Payment completed</span>
              </div>
              <p className="text-sm text-gray-500">
                Thank you for your booking!
              </p>
            </div>
          ) : (
            <div className="w-full">
              {isOverdue && (
                <div className="mb-4 p-3 bg-red-50 rounded-md flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-700">Payment Overdue</h4>
                    <p className="text-sm text-red-600">
                      Your payment is past due. Please complete your payment as soon as possible to keep your reservation.
                    </p>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handlePaymentClick}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Complete Payment <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
