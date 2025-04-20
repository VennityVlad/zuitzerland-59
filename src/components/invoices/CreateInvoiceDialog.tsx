
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  profiles: Array<{ id: string; email: string; full_name?: string; username?: string; }>;
}

export function CreateInvoiceDialog({ open, onOpenChange, onSuccess, profiles }: CreateInvoiceDialogProps) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [checkinDate, setCheckinDate] = useState<Date | undefined>(undefined);
  const [checkoutDate, setCheckoutDate] = useState<Date | undefined>(undefined);
  const [roomType, setRoomType] = useState<string>("");

  const handleCreate = async () => {
    if (!selectedProfileId) {
      toast({
        title: "Error",
        description: "Please select a user to associate with this invoice",
        variant: "destructive",
      });
      return;
    }

    if (!checkinDate || !checkoutDate) {
      toast({
        title: "Error",
        description: "Please select all required dates",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const invoiceData = {
        profile_id: selectedProfileId,
        room_type: roomType,
        price: Number(price),
        first_name: firstName,
        last_name: lastName,
        email: email,
        checkin: format(checkinDate, 'yyyy-MM-dd'),
        checkout: format(checkoutDate, 'yyyy-MM-dd'),
        status: 'pending',
        imported: false
      };

      const { error } = await supabase
        .from('invoices')
        .insert(invoiceData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      
      onOpenChange(false);
      if (onSuccess) onSuccess();
      resetForm();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setSelectedProfileId("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPrice(0);
    setCheckinDate(undefined);
    setCheckoutDate(undefined);
    setRoomType("");
  };

  return (
    <Sheet open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    }}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create New Invoice</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="profile">Associate with User</Label>
            <Select
              value={selectedProfileId}
              onValueChange={(value) => {
                setSelectedProfileId(value);
                const profile = profiles.find(p => p.id === value);
                if (profile) {
                  setEmail(profile.email || "");
                  
                  // Handle full_name safely with null checks
                  if (profile.full_name) {
                    const nameParts = profile.full_name.split(" ");
                    setFirstName(nameParts[0] || "");
                    setLastName(nameParts.slice(1).join(" ") || "");
                  } else {
                    setFirstName(profile.username || "");
                    setLastName("");
                  }
                }
              }}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roomType">Room Type</Label>
            <Input
              id="roomType"
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              placeholder="Enter room type"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (CHF)</Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              placeholder="Price"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
        </div>
        
        <SheetFooter className="pt-4">
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={isCreating || !selectedProfileId}
            >
              {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create Invoice
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
