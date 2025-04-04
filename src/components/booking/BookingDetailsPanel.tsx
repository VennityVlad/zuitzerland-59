
import React from "react";
import DateSelectionFields from "./DateSelectionFields";
import RoomSelectionFields from "./RoomSelectionFields";
import PaymentTypeSelector from "./PaymentTypeSelector";
import type { BookingFormData } from "@/types/booking";

// Need to add children prop to interface
interface BookingDetailsPanelProps {
  formData: BookingFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePaymentTypeChange: (value: string) => void;
  minDate: string;
  maxDate: string;
  discountAmount: number;
  isRoleBasedDiscount: boolean;
  discountName: string | null;
  discountPercentage: number;
  discountMonth: string | null;
  customPrice?: number;
  children?: React.ReactNode;
  bookingBlockEnabled?: boolean;
}

const BookingDetailsPanel = ({
  formData,
  handleInputChange,
  handlePaymentTypeChange,
  minDate,
  maxDate,
  discountAmount,
  isRoleBasedDiscount,
  discountName,
  discountPercentage,
  discountMonth,
  customPrice,
  children,
  bookingBlockEnabled = true
}: BookingDetailsPanelProps) => {
  const basePrice = formData.price ? formData.price.toFixed(2) : '0.00';
  const stripeFee = formData.paymentType === 'fiat' ? (formData.price * 0.03).toFixed(2) : '0.00';
  const subtotal = formData.price ? (formData.price + (formData.paymentType === 'fiat' ? formData.price * 0.03 : 0)) : 0;
  const vat = (subtotal * 0.038).toFixed(2);
  const total = customPrice ? customPrice + parseFloat(vat) : subtotal + parseFloat(vat);
  
  return (
    <div className="bg-gray-50 p-6 rounded-lg space-y-6">
      <h3 className="text-xl font-semibold mb-4">Booking Details</h3>

      <DateSelectionFields
        formData={formData}
        handleInputChange={handleInputChange}
        minDate={minDate}
        maxDate={maxDate}
      />

      <RoomSelectionFields
        formData={formData}
        handleInputChange={handleInputChange}
      />

      <PaymentTypeSelector
        value={formData.paymentType}
        onChange={handlePaymentTypeChange}
      />
      
      {/* Custom children content - for the custom price field */}
      {children}

      <div className="border-t border-gray-200 mt-4 pt-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Base Price:</span>
            <span className="font-medium">{basePrice} CHF</span>
          </div>
          
          {discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">
                {discountName || `Discount (${discountPercentage}%)`}:
              </span>
              <span className="font-medium text-red-500">-{discountAmount.toFixed(2)} CHF</span>
            </div>
          )}
          
          {formData.paymentType === 'fiat' && (
            <div className="flex justify-between">
              <span className="text-gray-600">Processing Fee (3%):</span>
              <span className="font-medium">{stripeFee} CHF</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{subtotal.toFixed(2)} CHF</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">VAT (3.8%):</span>
            <span className="font-medium">{vat} CHF</span>
          </div>
          
          <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
            <span className="text-gray-800 font-semibold">Total:</span>
            <span className="font-bold text-lg text-primary">
              {customPrice ? customPrice.toFixed(2) : total.toFixed(2)} CHF
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPanel;
