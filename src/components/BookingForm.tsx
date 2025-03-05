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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BookingForm = () => {
  const {
    formData,
    isLoading,
    isFormValid,
    validationWarning,
    discountAmount,
    isRoleBasedDiscount,
    discountName,
    discountPercentage,
    discountMonth,
    handleInputChange,
    handleSubmit,
    handleCountryChange,
    handlePaymentTypeChange,
  } = useBookingForm();

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("booking");

  const minDate = "2025-05-01";
  const maxDate = "2025-05-25";

  const { data: roomTypeDetails } = useQuery({
    queryKey: ['roomTypeDetails', formData.roomType],
    queryFn: async () => {
      if (!formData.roomType) return null;
      
      const { data, error } = await supabase
        .from('room_types')
        .select('min_stay_days, display_name')
        .eq('code', formData.roomType)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: Boolean(formData.roomType)
  });

  const meetsMinimumStay = (): boolean => {
    console.log('Checking minimum stay:', {
      checkin: formData.checkin,
      checkout: formData.checkout,
      roomType: formData.roomType,
      roomTypeDetails
    });

    if (!formData.checkin || !formData.checkout || !formData.roomType || !roomTypeDetails) {
      console.log('Missing required data for minimum stay check');
      return false;
    }

    const startDate = parse(formData.checkin, 'yyyy-MM-dd', new Date());
    const endDate = parse(formData.checkout, 'yyyy-MM-dd', new Date());
    const days = differenceInDays(endDate, startDate);
    
    console.log('Stay duration:', {
      days,
      minimumRequired: roomTypeDetails.min_stay_days,
      meets: days >= (roomTypeDetails.min_stay_days || 0)
    });

    return days >= (roomTypeDetails.min_stay_days || 0);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!termsAccepted || !meetsMinimumStay()) {
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
    <div className={`${isMobile ? 'w-full' : 'lg:w-[400px]'} space-y-6`}>
      <BookingDetailsPanel
        formData={formData}
        handleInputChange={handleInputChange}
        minDate={minDate}
        maxDate={maxDate}
        discountAmount={discountAmount}
        isRoleBasedDiscount={isRoleBasedDiscount}
        discountName={discountName}
        discountPercentage={discountPercentage}
        discountMonth={discountMonth}
      />
    </div>
  );

  const renderMobileView = () => (
    <Tabs defaultValue="booking" className="w-full" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="booking" className="text-sm">
          Booking Details
        </TabsTrigger>
        <TabsTrigger value="contact" className="text-sm">
          Contact Info
        </TabsTrigger>
      </TabsList>
      <div className="mt-6">
        <TabsContent value="booking" className="m-0">
          {renderBookingDetails()}
        </TabsContent>
        <TabsContent value="contact" className="m-0">
          {renderContactInfo()}
        </TabsContent>
      </div>
    </Tabs>
  );

  const renderDesktopView = () => (
    <div className="flex flex-col lg:flex-row gap-8">
      {renderContactInfo()}
      {renderBookingDetails()}
    </div>
  );

  const isSubmitEnabled = isFormValid && termsAccepted && meetsMinimumStay() && !isLoading;

  console.log('Submit button state:', {
    isFormValid,
    termsAccepted,
    meetsMinimumStay: meetsMinimumStay(),
    isLoading,
    isEnabled: isSubmitEnabled
  });

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-6xl mx-auto p-8 mt-16 sm:mt-0 space-y-8 bg-white rounded-xl shadow-lg border border-secondary"
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

      {isMobile ? renderMobileView() : renderDesktopView()}

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
        disabled={!isSubmitEnabled}
      >
        {isLoading ? "Processing..." : "Confirm and Pay"}
      </Button>

      <TermsDialog open={showTerms} onOpenChange={setShowTerms} />
    </form>
  );
};

export default BookingForm;
