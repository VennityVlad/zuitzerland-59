
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Invoice {
  id: string;
  created_at: string;
  invoice_uid: string;
  payment_link: string;
  status: string;
  price: number;
  room_type: string;
  checkin: string;
  checkout: string;
  first_name: string;
  last_name: string;
  due_date: string;
}

const Invoices = () => {
  const { user } = usePrivy();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);

        if (!user?.id) {
          console.error('No user ID available');
          setInvoices([]);
          return;
        }

        // First, fetch the current invoice data for the logged-in user
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('privy_id')
          .eq('privy_id', user.id.toString())
          .single();

        if (profileError || !profileData) {
          console.error('No profile found for user');
          setInvoices([]);
          return;
        }

        const query = supabase
          .from('invoices')
          .select('*')
          .eq('privy_id', user.id.toString())
          .order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;
        setInvoices(data || []);

        // Then update the statuses in the background
        const { error: statusError } = await supabase.functions.invoke('get-invoice-status');
        if (statusError) throw statusError;

        // Finally, fetch the updated data
        const { data: updatedData, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setInvoices(updatedData || []);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        toast({
          title: "Error",
          description: "Failed to load invoices. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchInvoices();
    }
  }, [user]);

  const handlePaymentClick = (paymentLink: string) => {
    window.open(paymentLink, '_blank');
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d');
  };

  const formatDateWithYear = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d, yyyy');
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

  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-hotel-navy">My Invoices</h1>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No invoices found.</p>
          ) : (
            <div className="overflow-x-auto">
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
                          onClick={() => handlePaymentClick(invoice.payment_link)}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Invoices;

