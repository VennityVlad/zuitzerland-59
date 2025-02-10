import { useState, useEffect } from "react";
import { format, addDays, differenceInDays, parse } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ROOM_MIN_STAY, MIN_STAY_DAYS, PRICING_TABLE } from "@/lib/constants";
import type { BookingFormData } from "@/types/booking";
import { countries } from "@/lib/countries";
import { useNavigate } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";

export const useBookingForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, authenticated } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
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

  const calculatePrice = (checkin: string, checkout: string, roomType: string) => {
    if (!checkin || !checkout || !roomType) return 0;
    
    const startDate = parse(checkin, 'yyyy-MM-dd', new Date());
    const endDate = parse(checkout, 'yyyy-MM-dd', new Date());
    const days = differenceInDays(endDate, startDate);
    
    if (days <= 0) return 0;
    
    const priceArray = PRICING_TABLE[roomType];
    if (!priceArray) return 0;
    
    // Calculate the starting index in the pricing array (days since May 1st)
    const mayFirst = new Date(2025, 4, 1); // May is month 4 (0-based)
    const startIndex = differenceInDays(startDate, mayFirst);
    
    let totalPrice = 0;
    for (let i = 0; i < days; i++) {
      const dayIndex = startIndex + i;
      // Use the last price in the array if we go beyond the array length
      const dayPrice = priceArray[Math.min(dayIndex, priceArray.length - 1)];
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
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

  const handleCountryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      country: value
    }));
  };

  const notifyZapier = async (bookingData: BookingFormData) => {
    try {
      const { data: { webhook_url }, error } = await supabase
        .functions.invoke('get-secret', {
          body: { secret_name: 'ZAPIER_WEBHOOK_URL' }
        });

      if (error || !webhook_url) {
        console.error('Error fetching Zapier webhook URL:', error);
        return;
      }

      const creationDate = new Date().toISOString();
      const dueDate = addDays(new Date(), 14).toISOString();
      const invoiceNumber = `INV-${bookingData.firstName}${bookingData.lastName}`;

      const zapierData = {
        name: `${bookingData.firstName} ${bookingData.lastName}`,
        email: bookingData.email,
        address: bookingData.address,
        city: bookingData.city,
        zip: bookingData.zip,
        country: bookingData.country,
        checkin: bookingData.checkin,
        checkout: bookingData.checkout,
        roomType: bookingData.roomType,
        price: bookingData.price,
        creationDate,
        dueDate,
        invoiceNumber
      };

      console.log('Sending data to Zapier:', zapierData);

      await fetch(webhook_url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(zapierData)
      });

      console.log('Zapier webhook triggered successfully');
      return { invoiceNumber };
    } catch (error) {
      console.error('Error triggering Zapier webhook:', error);
      throw error;
    }
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

    try {
      // First ensure we have a profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user?.id)
        .maybeSingle();

      if (profileError || !profileData) {
        console.error('Error fetching profile:', profileError);
        toast({
          title: "Error",
          description: "Please sign in again to complete your profile setup",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Send data to Zapier and get invoice number
      const { invoiceNumber } = await notifyZapier(formData);
      
      // Store booking information in Supabase
      const { error: insertError } = await supabase
        .from('invoices')
        .insert({
          user_id: profileData.id,
          invoice_uid: invoiceNumber,
          booking_details: formData,
          price: formData.price,
          room_type: formData.roomType,
          checkin: formData.checkin,
          checkout: formData.checkout,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Booking Submitted",
        description: "Your booking has been successfully submitted!",
      });

      // Redirect to invoices page
      navigate('/invoices');
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

  useEffect(() => {
    validateForm();
  }, [formData]);

  return {
    formData,
    isLoading,
    isFormValid,
    validationWarning,
    handleInputChange,
    handleSubmit,
    handleCountryChange,
  };
};
