
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DatePicker } from "@/components/ui/date-picker";
import { formatInTimeZone } from "date-fns-tz";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  username?: string;
}

interface ImportInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ImportPreviewData {
  room_type: string;
  price: number;
  first_name: string;
  last_name: string;
  email: string;
  checkin: string | null;
  checkout: string | null;
  due_date: string;
  payment_link: string;
  status: string;
  invoice_uid: string;
  request_invoice_id: string;
  payment_type: string;
}

export function ImportInvoiceDialog({ open, onOpenChange, onSuccess }: ImportInvoiceDialogProps) {
  const { toast } = useToast();
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
  const [checkinDate, setCheckinDate] = useState<Date | undefined>(undefined);
  const [checkoutDate, setCheckoutDate] = useState<Date | undefined>(undefined);

  // Fetch profiles for dropdown
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, username')
          .order('email');

        if (error) throw error;
        setProfiles(data || []);
      } catch (error) {
        console.error('Error fetching profiles:', error);
        toast({
          title: "Error",
          description: "Failed to load user profiles",
          variant: "destructive",
        });
      }
    };

    if (open) {
      fetchProfiles();
    }
  }, [open, toast]);

  const fetchInvoiceData = async () => {
    if (!invoiceNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invoice number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('fetch-request-finance-invoice', {
        body: { invoiceNumber: invoiceNumber.trim() }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch invoice');
      }

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setInvoiceData(response.data.invoice);
      
      // Create preview data from the fetched invoice
      const invoice = response.data.invoice;
      const buyerInfo = invoice.buyerInfo || {};
      const paymentTerms = invoice.paymentTerms || {};
      const invoiceLinks = response.data.invoiceLinks || {};
      
      // Extract room type from invoice items if available
      let roomType = "Standard";
      if (invoice.invoiceItems && invoice.invoiceItems.length > 0) {
        roomType = invoice.invoiceItems[0].name || "Standard";
      }
      
      // Calculate total price
      let totalPrice = 0;
      if (invoice.invoiceItems && invoice.invoiceItems.length > 0) {
        totalPrice = invoice.invoiceItems.reduce((sum: number, item: any) => {
          const unitPrice = parseInt(item.unitPrice || "0", 10) / 100;
          const quantity = item.quantity || 1;
          return sum + (unitPrice * quantity);
        }, 0);
      }

      // Determine payment type based on invoice payment options
      let paymentType = "crypto";
      if (invoice.paymentOptions && invoice.paymentOptions.length > 0) {
        const hasStripe = invoice.paymentOptions.some((option: any) => option.type === "stripe");
        paymentType = hasStripe ? "fiat" : "crypto";
      }

      // Prepare preview data
      const preview: ImportPreviewData = {
        room_type: roomType,
        price: totalPrice,
        first_name: buyerInfo.firstName || "",
        last_name: buyerInfo.lastName || "",
        email: buyerInfo.email || "",
        checkin: null,
        checkout: null,
        due_date: paymentTerms.dueDate || new Date().toISOString(),
        payment_link: invoiceLinks.pay || "",
        status: invoice.status || "pending",
        invoice_uid: invoice.invoiceNumber || "",
        request_invoice_id: invoice.id || "",
        payment_type: paymentType
      };

      setPreviewData(preview);
      
      toast({
        title: "Success",
        description: "Invoice found",
      });
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch invoice",
        variant: "destructive",
      });
      
      setInvoiceData(null);
      setPreviewData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!previewData) {
      toast({
        title: "Error",
        description: "No invoice data to import",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProfileId) {
      toast({
        title: "Error",
        description: "Please select a user to associate with this invoice",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      // Format dates for database storage
      let checkinStr = null;
      let checkoutStr = null;
      
      if (checkinDate) {
        checkinStr = formatInTimeZone(checkinDate, 'UTC', 'yyyy-MM-dd');
      }
      
      if (checkoutDate) {
        checkoutStr = formatInTimeZone(checkoutDate, 'UTC', 'yyyy-MM-dd');
      }

      // Create invoice record
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          profile_id: selectedProfileId,
          booking_details: invoiceData,
          room_type: previewData.room_type,
          price: previewData.price,
          first_name: previewData.first_name,
          last_name: previewData.last_name,
          email: previewData.email,
          checkin: checkinStr,
          checkout: checkoutStr,
          due_date: previewData.due_date,
          payment_link: previewData.payment_link,
          status: previewData.status,
          invoice_uid: previewData.invoice_uid,
          request_invoice_id: previewData.request_invoice_id,
          payment_type: previewData.payment_type,
          imported: true // Set the imported flag to true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice imported successfully",
      });
      
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error importing invoice:', error);
      toast({
        title: "Error",
        description: "Failed to import invoice",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetForm = () => {
    setInvoiceNumber("");
    setSelectedProfileId("");
    setInvoiceData(null);
    setPreviewData(null);
    setCheckinDate(undefined);
    setCheckoutDate(undefined);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(parseISO(dateString), "MMM d, yyyy");
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <Sheet open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    }}>
      <SheetContent className="sm:max-w-[500px] md:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Import Invoice from Request Finance</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice Number</Label>
            <div className="flex gap-2">
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Enter invoice number"
                disabled={isLoading}
              />
              <Button onClick={fetchInvoiceData} disabled={isLoading || !invoiceNumber.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </div>
          </div>
          
          {previewData && (
            <>
              <div className="space-y-2">
                <Label htmlFor="profile">Associate with User</Label>
                <Select
                  value={selectedProfileId}
                  onValueChange={setSelectedProfileId}
                  disabled={isImporting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.email} {profile.full_name ? `(${profile.full_name})` : profile.username ? `(${profile.username})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Check-in Date</Label>
                  <DatePicker 
                    date={checkinDate}
                    onDateChange={setCheckinDate}
                    placeholder="Select check-in date"
                    toDate={checkoutDate}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Check-out Date</Label>
                  <DatePicker 
                    date={checkoutDate}
                    onDateChange={setCheckoutDate}
                    placeholder="Select check-out date"
                    fromDate={checkinDate}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Invoice Preview</Label>
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm font-medium">Invoice Number:</div>
                      <div className="text-sm">{previewData.invoice_uid}</div>
                      
                      <div className="text-sm font-medium">Status:</div>
                      <div className="text-sm">{previewData.status}</div>
                      
                      <div className="text-sm font-medium">Customer:</div>
                      <div className="text-sm">{previewData.first_name} {previewData.last_name}</div>
                      
                      <div className="text-sm font-medium">Email:</div>
                      <div className="text-sm">{previewData.email}</div>
                      
                      <div className="text-sm font-medium">Room Type:</div>
                      <div className="text-sm">{previewData.room_type}</div>
                      
                      <div className="text-sm font-medium">Price:</div>
                      <div className="text-sm">CHF {previewData.price.toFixed(2)}</div>
                      
                      <div className="text-sm font-medium">Payment Type:</div>
                      <div className="text-sm">{previewData.payment_type === "fiat" ? "Credit Card" : "Crypto"}</div>
                      
                      <div className="text-sm font-medium">Due Date:</div>
                      <div className="text-sm">{formatDate(previewData.due_date)}</div>
                      
                      <div className="text-sm font-medium">Check-in:</div>
                      <div className="text-sm">{checkinDate ? format(checkinDate, "MMM d, yyyy") : "Not specified"}</div>
                      
                      <div className="text-sm font-medium">Check-out:</div>
                      <div className="text-sm">{checkoutDate ? format(checkoutDate, "MMM d, yyyy") : "Not specified"}</div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </div>
        
        <SheetFooter className="pt-4">
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={isImporting || !previewData || !selectedProfileId}
            >
              {isImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Import Invoice
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
