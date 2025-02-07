import { useState } from "react";
import { format, addDays, differenceInDays } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ROOM_TYPES, MIN_STAY_DAYS, PRICING_TABLE, ROOM_MIN_STAY } from "@/lib/constants";
import type { BookingFormData } from "@/types/booking";
import PersonalInfoFields from "./booking/PersonalInfoFields";
import DateSelectionFields from "./booking/DateSelectionFields";
import RoomSelectionFields from "./booking/RoomSelectionFields";

const BookingForm = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>({
    name: "",
    email: "",
    address: "",
    city: "",
    zip: "",
    country: "",
    checkin: "",
    checkout: "",
    roomType: "",
    price: 0,
  });

  const minDate = "2025-05-01";
  const maxDate = "2025-05-25";

  const calculatePrice = (checkin: string, checkout: string, roomType: string) => {
    if (!checkin || !checkout || !roomType) return 0;
    
    const days = differenceInDays(new Date(checkout), new Date(checkin));
    if (days <= 0) return 0;
    
    // Get the pricing array for the selected room type
    const priceArray = PRICING_TABLE[roomType];
    if (!priceArray) return 0;
    
    // Calculate total price by summing up the daily rates for each day of stay
    let totalPrice = 0;
    for (let i = 0; i < days; i++) {
      // Use the price for the current day (0-based index), or the last price if beyond 25 days
      const dayPrice = priceArray[Math.min(i, priceArray.length - 1)];
      totalPrice += dayPrice;
    }
    
    return totalPrice;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (
        (name === "checkin" || name === "checkout" || name === "roomType") &&
        newData.checkin &&
        newData.checkout &&
        newData.roomType
      ) {
        newData.price = calculatePrice(
          newData.checkin,
          newData.checkout,
          newData.roomType
        );
      }
      return newData;
    });
  };

  const handleRoomTypeChange = (value: string) => {
    handleInputChange({
      target: { name: "roomType", value },
    } as React.ChangeEvent<HTMLSelectElement>);
  };

  const validateMinimumStay = (days: number, roomType: string): string | null => {
    const minimumStay = ROOM_MIN_STAY[roomType] || MIN_STAY_DAYS;
    
    if (days < minimumStay) {
      const weekText = minimumStay === 7 ? "1 week" : 
                      minimumStay === 14 ? "2 weeks" : 
                      "the entire period";
      return `This room type requires a minimum stay of ${weekText}`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const days = differenceInDays(
      new Date(formData.checkout),
      new Date(formData.checkin)
    );

    const validationError = validateMinimumStay(days, formData.roomType);
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const creationDate = new Date().toISOString();
    const dueDate = addDays(new Date(), 14).toISOString();
    const invoiceNumber = `INV-${formData.name.replace(/\s+/g, "")}`;

    const fullData = {
      ...formData,
      creationDate,
      dueDate,
      invoiceNumber,
      price: `$${formData.price}`,
    };

    try {
      await fetch("https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK_ID/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify(fullData),
      });

      toast({
        title: "Booking Submitted",
        description: "Your booking has been successfully submitted!",
      });
    } catch (error) {
      console.error("Error submitting booking:", error);
      toast({
        title: "Error",
        description: "Failed to submit booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto p-6 space-y-8 bg-white rounded-lg shadow-lg"
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold text-hotel-navy">Hotel Booking</h2>
        <p className="text-gray-500">
          Please fill in your details to complete your booking
        </p>
      </div>

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
          onRoomTypeChange={handleRoomTypeChange}
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-hotel-navy hover:bg-hotel-navy/90"
        disabled={isLoading}
      >
        {isLoading ? "Submitting..." : "Complete Booking"}
      </Button>
    </form>
  );
};

export default BookingForm;