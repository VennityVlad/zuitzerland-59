
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useBookingForm } from "@/hooks/useBookingForm";
import PersonalInfoFields from "./booking/PersonalInfoFields";
import BookingDetailsPanel from "./booking/BookingDetailsPanel";
import { BookingFormHeader } from "./booking/BookingFormHeader";
import PaymentTypeSelector from "./booking/PaymentTypeSelector";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import TermsDialog from "./booking/TermsDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parse } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

const BookingForm = () => {
  const {
    formData,
    isLoading,
    isFormValid,
    validationWarning,
    discountAmount,
    isRoleBasedDiscount,
    handleInputChange,
    handleSubmit,
    handleCountryChange,
    handlePaymentTypeChange,
  } = useBookingForm();

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const isMobile = useIsMobile();

  const minDate = "2025-05-01";
  const maxDate = "2025-05-25";

  // Query to check pricing availability
  const { data: availablePricing } = useQuery({
    queryKey: ['price-check', formData.checkin, formData.checkout, formData.roomType],
    queryFn: async () => {
      if (!formData.checkin || !formData.checkout || !formData.roomType) return null;
      
      const startDate = parse(formData.checkin, 'yyyy-MM-dd', new Date());
      const endDate = parse(formData.checkout, 'yyyy-MM-dd', new Date());
      const days = differenceInDays(endDate, startDate);
      
      const { data, error } = await supabase
        .from('prices')
        .select('*')
        .eq('room_type', formData.roomType)
        .lte('duration', days)
        .order('duration', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data;
    },
    enabled: Boolean(formData.checkin && formData.checkout && formData.roomType)
  });

  const meetsMinimumStay = !formData.checkin || 
                          !formData.checkout || 
                          !formData.roomType || 
                          (availablePricing && availablePricing.length > 0);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!termsAccepted || !meetsMinimumStay) {
      return;
    }
    handleSubmit(e);
  };

  const renderContactInfo = () => (
    <div className="flex-1 space-y-6">
      <div className="pb-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Contact Information</h3>
        <p className="text-sm text-gray-500">We'll use these details to keep you informed about your booking</p>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <PersonalInfoFields
          formData={formData}
          handleInputChange={handleInputChange}
          onCountryChange={handleCountryChange}
        />
        <PaymentTypeSelector
          value={formData.paymentType}
          onChange={handlePaymentTypeChange}
        />
      </div>
    </div>
  );

  const renderBookingDetails = () => (
    <div className="lg:w-[400px]">
      <BookingDetailsPanel
        formData={formData}
        handleInputChange={handleInputChange}
        minDate={minDate}
        maxDate={maxDate}
        discountAmount={discountAmount}
        isRoleBasedDiscount={isRoleBasedDiscount}
      />
    </div>
  );

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-6xl mx-auto p-8 space-y-8 bg-white rounded-xl shadow-lg border border-secondary"
    >
      <BookingFormHeader
        title="Complete Your Booking"
        description="Fill in your details to reserve your stay"
      />

      {validationWarning && (
        <Alert variant="destructive">
          <AlertDescription>{validationWarning}</AlertDescription>
        </Alert>
      )}

      {isMobile ? (
        <div className="flex flex-col gap-8">
          {renderBookingDetails()}
          {renderContactInfo()}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {renderContactInfo()}
          {renderBookingDetails()}
        </div>
      )}

      <div className="flex items-start space-x-2 mt-6">
        <Checkbox
          id="terms"
          checked={termsAccepted}
          onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
          className="mt-1"
        />
        <label htmlFor="terms" className="text-sm text-gray-600">
          I accept the{" "}
          <button
            type="button"
            onClick={() => setShowTerms(true)}
            className="text-primary hover:underline font-medium"
          >
            Terms and Conditions
          </button>
        </label>
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-white text-lg py-6"
        disabled={isLoading || !isFormValid || !termsAccepted || !meetsMinimumStay}
      >
        {isLoading ? "Processing..." : "Confirm and Pay"}
      </Button>

      <TermsDialog open={showTerms} onOpenChange={setShowTerms} />
    </form>
  );
};

export default BookingForm;
