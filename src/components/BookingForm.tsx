
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useBookingForm } from "@/hooks/useBookingForm";
import PersonalInfoFields from "./booking/PersonalInfoFields";
import BookingDetailsPanel from "./booking/BookingDetailsPanel";
import { BookingFormHeader } from "./booking/BookingFormHeader";
import PaymentTypeSelector from "./booking/PaymentTypeSelector";

const BookingForm = () => {
  const {
    formData,
    isLoading,
    isFormValid,
    validationWarning,
    discountAmount,
    handleInputChange,
    handleSubmit,
    handleCountryChange,
    handlePaymentTypeChange,
  } = useBookingForm();

  const minDate = "2025-05-01";
  const maxDate = "2025-05-25";

  return (
    <form
      onSubmit={handleSubmit}
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

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Contact Information */}
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

        {/* Right Column - Booking Details */}
        <div className="lg:w-[400px]">
          <BookingDetailsPanel
            formData={formData}
            handleInputChange={handleInputChange}
            minDate={minDate}
            maxDate={maxDate}
            discountAmount={discountAmount}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-white text-lg py-6"
        disabled={isLoading || !isFormValid}
      >
        {isLoading ? "Processing..." : "Confirm and Pay"}
      </Button>
    </form>
  );
};

export default BookingForm;
