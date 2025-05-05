
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PriceData } from "@/types/booking";
import { format } from "date-fns";
import { Trash2, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";

interface PricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomType: string;
  roomTypeDisplay: string;
}

export function PricingDialog({ open, onOpenChange, roomType, roomTypeDisplay }: PricingDialogProps) {
  const { toast } = useToast();
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPrice, setNewPrice] = useState({
    duration: 1,
    price: 0,
    date: format(new Date(), "yyyy-MM-dd"),
  });

  // Fetch prices when the dialog opens
  useEffect(() => {
    if (open && roomType) {
      fetchPrices();
    }
  }, [open, roomType]);

  const fetchPrices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("prices")
        .select("*")
        .eq("room_type", roomType)
        .order("duration", { ascending: true });
      
      if (error) throw error;
      
      setPrices(data as PriceData[]);
    } catch (error) {
      console.error("Error fetching prices:", error);
      toast({
        title: "Error",
        description: "Failed to fetch pricing data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPrice = async () => {
    try {
      const { error } = await supabase
        .from("prices")
        .insert({
          room_type: roomType,
          duration: newPrice.duration,
          price: newPrice.price,
          date: newPrice.date,
        });
      
      if (error) throw error;
      
      toast({
        title: "Price Added",
        description: "The new price has been added successfully",
      });
      
      // Reset form
      setNewPrice({
        duration: 1,
        price: 0,
        date: format(new Date(), "yyyy-MM-dd"),
      });
      
      // Refresh prices
      fetchPrices();
    } catch (error) {
      console.error("Error adding price:", error);
      toast({
        title: "Error",
        description: "Failed to add price",
        variant: "destructive",
      });
    }
  };

  const handleDeletePrice = async (id: string) => {
    try {
      const { error } = await supabase
        .from("prices")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      toast({
        title: "Price Deleted",
        description: "The price has been removed successfully",
      });
      
      // Refresh prices
      fetchPrices();
    } catch (error) {
      console.error("Error deleting price:", error);
      toast({
        title: "Error",
        description: "Failed to delete price",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePrice = async (id: string, newPrice: number) => {
    try {
      const { error } = await supabase
        .from("prices")
        .update({ price: newPrice })
        .eq("id", id);
      
      if (error) throw error;
      
      toast({
        title: "Price Updated",
        description: "The price has been updated successfully",
      });
      
      // Refresh prices
      fetchPrices();
    } catch (error) {
      console.error("Error updating price:", error);
      toast({
        title: "Error",
        description: "Failed to update price",
        variant: "destructive",
      });
    }
  };

  const handlePriceChange = (id: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setPrices(prices.map(price => 
      price.id === id ? { ...price, price: numValue } : price
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pricing for {roomTypeDisplay}</DialogTitle>
          <DialogDescription>
            Manage prices for different stay durations.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-6">
            {prices.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Duration (days)</TableHead>
                      <TableHead className="text-right">Price (CHF)</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prices.map((price) => (
                      <TableRow key={price.id}>
                        <TableCell>{price.duration}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={price.price}
                            onChange={(e) => handlePriceChange(price.id, e.target.value)}
                            onBlur={() => handleUpdatePrice(price.id, price.price)}
                            className="w-24 ml-auto text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePrice(price.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No pricing data found for this room type.
              </div>
            )}

            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-3">Add New Price</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Duration (days)</label>
                  <Input 
                    type="number" 
                    min={1}
                    value={newPrice.duration}
                    onChange={(e) => setNewPrice({
                      ...newPrice,
                      duration: parseInt(e.target.value)
                    })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Price (CHF)</label>
                  <Input 
                    type="number" 
                    min={0} 
                    step="0.01"
                    value={newPrice.price}
                    onChange={(e) => setNewPrice({
                      ...newPrice,
                      price: parseFloat(e.target.value)
                    })}
                  />
                </div>
              </div>
              <Button 
                onClick={handleAddPrice} 
                className="mt-3 w-full"
                disabled={newPrice.price <= 0 || newPrice.duration < 1}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Price
              </Button>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
