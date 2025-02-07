import DateSelectionFields from "./DateSelectionFields";
import RoomSelectionFields from "./RoomSelectionFields";
import type { BookingFormData } from "@/types/booking";
import { useState, useEffect } from "react";

interface BookingDetailsPanelProps {
  formData: BookingFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  minDate: string;
  maxDate: string;
}

const BookingDetailsPanel = ({
  formData,
  handleInputChange,
  minDate,
  maxDate,
}: BookingDetailsPanelProps) => {
  const [usdPrice, setUsdPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch(
          `http://apilayer.net/api/live?access_key=d62c3d3b99d1601f68580196f699fdf0&currencies=USD,CHF&source=CHF&format=1`
        );
        const data = await response.json();
        if (data.success && data.quotes) {
          const rate = data.quotes.CHFUSD;
          setUsdPrice(formData.price * rate);
        }
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
      }
    };

    if (formData.price > 0) {
      fetchExchangeRate();
    }
  }, [formData.price]);

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
              } as React.ChangeEvent<HTMLSelectElement>)
            }
          />
        </div>

        <div className="pt-4 mt-4 border-t border-gray-200">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Price</span>
            <span>CHF {formData.price}</span>
          </div>
          {usdPrice && (
            <div className="flex justify-between items-center text-sm text-gray-500 mt-1">
              <span>Approx USD</span>
              <span>${usdPrice.toFixed(2)}</span>
            </div>
          )}
          <p className="text-sm text-gray-500 mt-1">Includes taxes and fees</p>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPanel;