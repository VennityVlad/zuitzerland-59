
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useBookingForm } from "@/hooks/useBookingForm";
import PersonalInfoFields from "./booking/PersonalInfoFields";
import DateSelectionFields from "./booking/DateSelectionFields";
import RoomSelectionFields from "./booking/RoomSelectionFields";
import { BookingFormHeader } from "./booking/BookingFormHeader";

const BookingForm = () => {
  const {
    formData,
    isLoading,
    isFormValid,
    validationWarning,
    handleInputChange,
    handleSubmit,
  } = useBookingForm();

  const minDate = "2025-05-01";
  const maxDate = "2025-05-25";

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto p-8 space-y-8 bg-white rounded-xl shadow-lg border border-secondary"
    >
      <BookingFormHeader
        title="Hotel Booking"
        description="Please fill in your details to complete your booking"
      />

      {validationWarning && (
        <Alert variant="destructive">
          <AlertDescription>{validationWarning}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PersonalInfoFields
          formData={formData}
          handleInputChange={handleInputChange}
        />
        <DateSelectionFields
          formData={formData}
          handleInputChange={handleInputChange}
          minDate={minDate}
          maxDate={maxDate}
        />
        <RoomSelectionFields
          formData={formData}
          onRoomTypeChange={(value) =>
            handleInputChange({
              target: { name: "roomType", value },
            } as React.ChangeEvent<HTMLSelectElement>)
          }
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-white"
        disabled={isLoading || !isFormValid}
      >
        {isLoading ? "Submitting..." : "Complete Booking"}
      </Button>
    </form>
  );
};

export default BookingForm;
