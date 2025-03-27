
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CreateDiscountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface NewDiscount {
  percentage: number;
  active: boolean;
  is_role_based: boolean;
  discountName: string;
  start_date: string | null;
  end_date: string | null;
}

export function CreateDiscountSheet({ open, onOpenChange, onSuccess }: CreateDiscountSheetProps) {
  const { toast } = useToast();
  const [newDiscount, setNewDiscount] = useState<NewDiscount>({
    percentage: 0,
    active: true,
    is_role_based: false,
    discountName: "",
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd')
  });

  const handleCreateDiscount = async () => {
    try {
      if (!newDiscount.discountName) {
        toast({
          title: "Error",
          description: "Discount name is required",
          variant: "destructive",
        });
        return;
      }

      if (!newDiscount.percentage || newDiscount.percentage <= 0 || newDiscount.percentage > 100) {
        toast({
          title: "Error",
          description: "Percentage must be between 1 and 100",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('discounts')
        .insert({
          percentage: newDiscount.percentage,
          active: newDiscount.active,
          is_role_based: newDiscount.is_role_based,
          start_date: newDiscount.start_date,
          end_date: newDiscount.end_date,
          discountName: newDiscount.discountName
        })
        .select();

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Discount created successfully",
      });
      
      // Reset form and close sheet
      setNewDiscount({
        percentage: 0,
        active: true,
        is_role_based: false,
        discountName: "",
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd')
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating discount:', error);
      toast({
        title: "Error",
        description: "Failed to create discount: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md md:max-w-lg">
        <SheetHeader className="mb-6">
          <SheetTitle>Create New Discount</SheetTitle>
          <SheetDescription>
            Fill in the details to create a new discount
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Discount Name</Label>
              <Input 
                id="new-name" 
                value={newDiscount.discountName}
                onChange={(e) => setNewDiscount({...newDiscount, discountName: e.target.value})}
                placeholder="Summer Sale"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-percentage">Percentage (%)</Label>
              <Input 
                id="new-percentage" 
                type="number"
                min={1}
                max={100}
                value={newDiscount.percentage}
                onChange={(e) => setNewDiscount({...newDiscount, percentage: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newDiscount.start_date ? format(parseISO(newDiscount.start_date), 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newDiscount.start_date ? parseISO(newDiscount.start_date) : undefined}
                    onSelect={(date) => date && setNewDiscount({...newDiscount, start_date: format(date, 'yyyy-MM-dd')})}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newDiscount.end_date ? format(parseISO(newDiscount.end_date), 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newDiscount.end_date ? parseISO(newDiscount.end_date) : undefined}
                    onSelect={(date) => date && setNewDiscount({...newDiscount, end_date: format(date, 'yyyy-MM-dd')})}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="new-active"
                checked={newDiscount.active}
                onCheckedChange={(checked) => setNewDiscount({...newDiscount, active: checked})}
              />
              <Label htmlFor="new-active">Active</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="new-role-based"
                checked={newDiscount.is_role_based}
                onCheckedChange={(checked) => setNewDiscount({...newDiscount, is_role_based: checked})}
              />
              <Label htmlFor="new-role-based">Role-based discount (for admins, co-designers, co-curators)</Label>
            </div>
          </div>

          <Button className="w-full" onClick={handleCreateDiscount}>
            Create Discount
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
