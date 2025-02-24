import DateSelectionFields from "./DateSelectionFields";
import RoomSelectionFields from "./RoomSelectionFields";
import type { BookingFormData } from "@/types/booking";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { HelpCircle, X } from "lucide-react";
import { format, differenceInDays, parse } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";

interface BookingDetailsPanelProps {
  formData: BookingFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  minDate: string;
  maxDate: string;
  discountAmount: number;
  isRoleBasedDiscount: boolean;
}

const VAT_RATE = 0.038; // 3.8% VAT rate for all customers
const STRIPE_FEE_RATE = 0.03; // 3% Stripe fee for credit card payments

const PriceBreakdown = ({ checkin, checkout, roomType }: { checkin: string; checkout: string; roomType: string }) => {
  const { data: priceInfo } = useQuery({
    queryKey: ['priceInfo', checkin, checkout, roomType],
    queryFn: async () => {
      if (!checkin || !checkout || !roomType) return null;
      
      const startDate = parse(checkin, 'yyyy-MM-dd', new Date());
      const endDate = parse(checkout, 'yyyy-MM-dd', new Date());
      const days = differenceInDays(endDate, startDate);
      
      const { data, error } = await supabase
        .from('prices')
        .select('*')
        .eq('room_type', roomType)
        .lte('duration', days)
        .order('duration', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      return {
        durationRate: data[0],
        totalDays: days
      };
    },
    enabled: Boolean(checkin && checkout && roomType)
  });

  if (!priceInfo) return <div>No pricing information available</div>;

  const { durationRate, totalDays } = priceInfo;
  const totalPrice = durationRate.price * totalDays;

  const roomTypeDisplayNames: { [key: string]: string } = {
    'hotel_room_queen': 'Hotel Room - Queen Bed',
    'apartment_3br_couples': '3 Bedroom Apartment - Couples Room',
    'apartment_3_4br_queen': '3-4 Bedroom Apartment - Queen Bed Room',
    'apartment_3_4br_twin': '3-4 Bedroom Apartment - Twin Bed Room',
    'apartment_2br_twin': '2 Bedroom Apartment - Twin Bed Room',
    'apartment_2br_triple': '2 Bedroom Apartment - Triple Bed Room'
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-semibold">Price Calculation</h4>
        <div className="text-sm space-y-1">
          <p>Room Type: {roomTypeDisplayNames[roomType]}</p>
          <p>Length of Stay: {totalDays} days</p>
          <p>Applicable Rate: CHF {durationRate.price} per day</p>
          <p>Rate Duration Tier: {durationRate.duration} days or more</p>
          <div className="mt-4 pt-2 border-t">
            <p className="font-medium">Calculation:</p>
            <p>CHF {durationRate.price} × {totalDays} days = CHF {totalPrice}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const BookingDetailsPanel = ({
  formData,
  handleInputChange,
  minDate,
  maxDate,
  discountAmount,
  isRoleBasedDiscount,
}: BookingDetailsPanelProps) => {
  const [usdPrice, setUsdPrice] = useState<number | null>(null);
  const [usdChfRate, setUsdChfRate] = useState<number | null>(null);

  // Query price info only when we have valid dates and room type
  const { data: priceInfo } = useQuery({
    queryKey: ['priceInfo', formData.checkin, formData.checkout, formData.roomType],
    queryFn: async () => {
      if (!formData.checkin || !formData.checkout || !formData.roomType) {
        console.log('Missing required data for price calculation');
        return null;
      }
      
      const startDate = parse(formData.checkin, 'yyyy-MM-dd', new Date());
      const endDate = parse(formData.checkout, 'yyyy-MM-dd', new Date());
      const days = differenceInDays(endDate, startDate);

      if (days <= 0) {
        console.log('Invalid date range - days <= 0');
        return null;
      }
      
      const { data, error } = await supabase
        .from('prices')
        .select('*')
        .eq('room_code', formData.roomType)
        .lte('duration', days)
        .order('duration', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      return {
        durationRate: data[0],
        totalDays: days
      };
    },
    enabled: Boolean(formData.checkin && formData.checkout && formData.roomType)
  });

  // Reset price in formData when price info changes or becomes null
  useEffect(() => {
    const totalPrice = priceInfo ? priceInfo.durationRate.price * priceInfo.totalDays : 0;
    handleInputChange({
      target: { name: "price", value: totalPrice.toString() }
    } as React.ChangeEvent<HTMLInputElement>);
  }, [priceInfo, handleInputChange]);

  // Calculate all the price components
  const basePrice = formData.price;
  const priceAfterDiscount = basePrice - discountAmount;
  const stripeFee = formData.paymentType === "fiat" ? priceAfterDiscount * STRIPE_FEE_RATE : 0;
  const subtotalBeforeVAT = priceAfterDiscount + stripeFee;
  const taxAmount = subtotalBeforeVAT * VAT_RATE;
  const totalAmount = subtotalBeforeVAT + taxAmount;

  // Update USD price when CHF total changes
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
    } else {
      setUsdPrice(null); // Reset USD price when total amount is 0
    }
  }, [totalAmount, usdChfRate]);

  const roomTypeDisplayNames: { [key: string]: string } = {
    'hotel_room_queen': 'Hotel Room - Queen Bed',
    'apartment_3br_couples': '3 Bedroom Apartment - Couples Room',
    'apartment_3_4br_queen': '3-4 Bedroom Apartment - Queen Bed Room',
    'apartment_3_4br_twin': '3-4 Bedroom Apartment - Twin Bed Room',
    'apartment_2br_twin': '2 Bedroom Apartment - Twin Bed Room',
    'apartment_2br_triple': '2 Bedroom Apartment - Triple Bed Room'
  };

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

        <div className="pt-4 mt-4 border-t border-gray-200 space-y-2">
          {basePrice > 0 ? (
            <>
              <div className="flex justify-between items-center text-gray-600">
                <span className="flex items-center gap-2">
                  Base Price
                  {formData.checkin && formData.checkout && formData.roomType && priceInfo && (
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-gray-500 hover:text-gray-700 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="w-[400px] p-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold">Price Calculation</h4>
                          <div className="text-sm space-y-1">
                            <p>Room Type: {roomTypeDisplayNames[formData.roomType]}</p>
                            <p>Length of Stay: {priceInfo.totalDays} days</p>
                            <p>Applicable Rate: CHF {priceInfo.durationRate.price} per day</p>
                            <p>Rate Duration Tier: {priceInfo.durationRate.duration} days or more</p>
                            <div className="mt-4 pt-2 border-t">
                              <p className="font-medium">Calculation:</p>
                              <p>CHF {priceInfo.durationRate.price} × {priceInfo.totalDays} days = CHF {basePrice}</p>
                            </div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </span>
                <span>CHF {basePrice.toFixed(2)}</span>
              </div>
              
              {discountAmount > 0 && (
                <>
                  <div className="flex justify-between items-center text-green-600">
                    <span>{isRoleBasedDiscount ? 'Co-designer Discount' : 'Discount'}</span>
                    <span>- CHF {discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Price after discount</span>
                    <span>CHF {priceAfterDiscount.toFixed(2)}</span>
                  </div>
                </>
              )}
              
              {formData.paymentType === "fiat" && (
                <>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Credit Card Processing Fee (3%)</span>
                    <span>CHF {stripeFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Subtotal before VAT</span>
                    <span>CHF {subtotalBeforeVAT.toFixed(2)}</span>
                  </div>
                </>
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
            </>
          ) : (
            <div className="text-center text-gray-500 py-4">
              Select dates and room type to see pricing
            </div>
          )}
          <p className="text-sm text-gray-500">Includes all applicable taxes and fees</p>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPanel;
