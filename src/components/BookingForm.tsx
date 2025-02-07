
import { useState, useEffect } from "react";
import { format, addDays, differenceInDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ROOM_TYPES, MIN_STAY_DAYS, PRICING_TABLE, ROOM_MIN_STAY } from "@/lib/constants";
import type { BookingFormData } from "@/types/booking";
import PersonalInfoFields from "./booking/PersonalInfoFields";
import DateSelectionFields from "./booking/DateSelectionFields";
import RoomSelectionFields from "./booking/RoomSelectionFields";
import { supabase } from "@/integrations/supabase/client";

const BookingForm = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [formData, setFormData] = useState<BookingFormData>({
    firstName: "",
    lastName: "",
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

  useEffect(() => {
    const fetchWebhookUrl = async () => {
      const { data, error } = await supabase
        .from('secrets')
        .select('value')
        .eq('name', 'ZAPIER_WEBHOOK_URL')
        .single();
      
      if (error) {
        console.error('Error fetching webhook URL:', error);
        toast({
          title: "Configuration Error",
          description: "There was an error loading the booking configuration.",
          variant: "destructive",
        });
        return;
      }
      
      setWebhookUrl(data.value);
    };

    fetchWebhookUrl();
  }, []);

  const calculatePrice = (checkin: string, checkout: string, roomType: string) => {
    if (!checkin || !checkout || !roomType) return 0;
    
    const days = differenceInDays(new Date(checkout), new Date(checkin));
    if (days <= 0) return 0;
    
    const priceArray = PRICING_TABLE[roomType];
    if (!priceArray) return 0;
    
    let totalPrice = 0;
    for (let i = 0; i < days; i++) {
      const dayPrice = priceArray[Math.min(i, priceArray.length - 1)];
      totalPrice += dayPrice;
    }
    
    return totalPrice;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMinimumStay = (days: number, roomType: string): string | null => {
    if (!roomType) return null;
    const minimumStay = ROOM_MIN_STAY[roomType] || MIN_STAY_DAYS;
    
    if (days < minimumStay) {
      const weekText = minimumStay === 7 ? "1 week" : 
                      minimumStay === 14 ? "2 weeks" : 
                      "the entire period";
      return `This room type requires a minimum stay of ${weekText}`;
    }
    return null;
  };

  const validateForm = () => {
    const requiredFields = ['firstName', 'lastName', 'email', 'address', 'city', 'zip', 'country', 'checkin', 'checkout', 'roomType'] as const;
    const allFieldsFilled = requiredFields.every(field => formData[field]);
    
    const isEmailValid = validateEmail(formData.email);

    let stayValidation = null;
    if (formData.checkin && formData.checkout && formData.roomType) {
      const days = differenceInDays(new Date(formData.checkout), new Date(formData.checkin));
      stayValidation = validateMinimumStay(days, formData.roomType);
    }

    setValidationWarning(stayValidation);
    setIsFormValid(allFieldsFilled && isEmailValid && !stayValidation);
  };

  useEffect(() => {
    validateForm();
  }, [formData]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!webhookUrl) {
      toast({
        title: "Configuration Error",
        description: "Booking system is not properly configured.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

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
    const invoiceNumber = `INV-${formData.firstName}${formData.lastName}`.replace(/\s+/g, "");

    const fullData = {
      ...formData,
      creationDate,
      dueDate,
      invoiceNumber,
      price: formData.price, // Remove $ symbol, just send the number
    };

    try {
      await fetch(webhookUrl, {
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
      className="max-w-2xl mx-auto p-8 space-y-8 bg-white rounded-xl shadow-lg border border-secondary"
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold text-primary">Hotel Booking</h2>
        <p className="text-gray-500">
          Please fill in your details to complete your booking
        </p>
      </div>

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
          onRoomTypeChange={handleRoomTypeChange}
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
