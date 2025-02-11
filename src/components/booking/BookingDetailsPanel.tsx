
import DateSelectionFields from "./DateSelectionFields";
import RoomSelectionFields from "./RoomSelectionFields";
import type { BookingFormData } from "@/types/booking";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { HelpCircle, X } from "lucide-react";
import { format, eachDayOfInterval, parse } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BookingDetailsPanelProps {
  formData: BookingFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  minDate: string;
  maxDate: string;
  discountAmount: number;
}

const VAT_RATE = 0.038; // 3.8% VAT rate for all customers

const PriceBreakdown = ({ checkin, checkout, roomType }: { checkin: string; checkout: string; roomType: string }) => {
  const { data: prices } = useQuery({
    queryKey: ['prices', checkin, checkout, roomType],
    queryFn: async () => {
      if (!checkin || !checkout || !roomType) return [];
      
      const { data, error } = await supabase
        .from('prices')
        .select('*')
        .eq('room_type', roomType)
        .gte('date', checkin)
        .lte('date', checkout)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(checkin && checkout && roomType)
  });

  const dateRange = checkin && checkout ? 
    eachDayOfInterval({
      start: parse(checkin, 'yyyy-MM-dd', new Date()),
      end: parse(checkout, 'yyyy-MM-dd', new Date())
    }) : [];

  return (
    <div className="max-h-[400px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Price (CHF)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dateRange.map((date, index) => {
            const formattedDate = format(date, 'yyyy-MM-dd');
            const priceForDay = prices?.find(p => p.date === formattedDate);
            
            return (
              <TableRow key={formattedDate}>
                <TableCell>{format(date, 'MMM dd, yyyy')}</TableCell>
                <TableCell className="text-right">
                  {priceForDay ? priceForDay.price.toFixed(2) : '-'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

const BookingDetailsPanel = ({
  formData,
  handleInputChange,
  minDate,
  maxDate,
  discountAmount,
}: BookingDetailsPanelProps) => {
  const [usdPrice, setUsdPrice] = useState<number | null>(null);
  const [usdChfRate, setUsdChfRate] = useState<number | null>(null);
  const [discountCode, setDiscountCode] = useState("");

  const taxAmount = formData.price * VAT_RATE;
  const totalAmount = formData.price + taxAmount - discountAmount;

  const handleDiscountCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDiscountCode(e.target.value);
  };

  const handleApplyDiscount = () => {
    handleInputChange({
      target: { name: "discountCode", value: discountCode },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleRemoveDiscount = () => {
    setDiscountCode("");
    handleInputChange({
      target: { name: "discountCode", value: "" },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch(
          `https://api.currencylayer.com/live?access_key=6ca43ac4cfb297bbbf5846450c3bfffc&format=1`
        );
        const data = await response.json();
        if (data.success && data.quotes) {
          const rate = data.quotes.USDCHF;
          if (rate) {
            setUsdChfRate(rate);
            const convertedPrice = totalAmount / rate;
            setUsdPrice(convertedPrice);
          }
        }
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
      }
    };

    if (totalAmount > 0 && usdChfRate === null) {
      fetchExchangeRate();
    } else if (totalAmount > 0 && usdChfRate !== null) {
      const convertedPrice = totalAmount / usdChfRate;
      setUsdPrice(convertedPrice);
    }
  }, [totalAmount, usdChfRate]);

  return (
    <div className="p-6 bg-secondary/20 rounded-xl space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Booking Details</h3>
        <p className="text-sm text-gray-500">Select your stay dates and room preference</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4">
          <DateSelectionFields
            formData={formData}
            handleInputChange={handleInputChange}
            minDate={minDate}
            maxDate={maxDate}
          />
        </div>
        
        <div className="space-y-4">
          <RoomSelectionFields
            formData={formData}
            onRoomTypeChange={(value) =>
              handleInputChange({
                target: { name: "roomType", value },
              } as React.ChangeEvent<HTMLInputElement>)
            }
          />
        </div>

        <div className="space-y-4">
          <Label htmlFor="discountCode">Discount Code</Label>
          {formData.discountCode ? (
            <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-md">
              <span className="flex-1 font-medium">{formData.discountCode}</span>
              <Button 
                onClick={handleRemoveDiscount}
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                id="discountCode"
                value={discountCode}
                onChange={handleDiscountCodeChange}
                placeholder="Enter discount code if you have one"
                className="flex-1"
              />
              <Button 
                onClick={handleApplyDiscount}
                type="button"
                variant="secondary"
              >
                Apply
              </Button>
            </div>
          )}
        </div>

        <div className="pt-4 mt-4 border-t border-gray-200 space-y-2">
          <div className="flex justify-between items-center text-gray-600">
            <span className="flex items-center gap-2">
              Base Price
              {formData.checkin && formData.checkout && formData.roomType && (
                <Popover>
                  <PopoverTrigger>
                    <HelpCircle className="h-4 w-4 text-gray-500 hover:text-gray-700 cursor-help" />
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-4" align="start">
                    <div>
                      <h4 className="font-semibold mb-3">Daily Price Breakdown</h4>
                      <PriceBreakdown
                        checkin={formData.checkin}
                        checkout={formData.checkout}
                        roomType={formData.roomType}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </span>
            <span>CHF {formData.price.toFixed(2)}</span>
          </div>
          
          {discountAmount > 0 && (
            <div className="flex justify-between items-center text-green-600">
              <span>
                Discount {formData.discountCode && `(${formData.discountCode})`}
              </span>
              <span>- CHF {discountAmount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center text-gray-600">
            <span>VAT (3.8%)</span>
            <span>CHF {taxAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-lg font-semibold mt-2 pt-2 border-t border-gray-200">
            <span>Total Price</span>
            <span>CHF {totalAmount.toFixed(2)}</span>
          </div>
          
          {usdPrice && (
            <div className="flex justify-between items-center text-sm text-gray-500 mt-1">
              <span>Approx USD</span>
              <span>${usdPrice.toFixed(2)}</span>
            </div>
          )}
          <p className="text-sm text-gray-500">Includes all applicable taxes and fees</p>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPanel;
