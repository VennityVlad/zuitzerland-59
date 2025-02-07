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
  const [requestFinanceApiKey, setRequestFinanceApiKey] = useState<string>("");
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

  const createRequestFinanceInvoice = async () => {
    if (!requestFinanceApiKey) {
      throw new Error('API key not configured');
    }

    const selectedCountry = countries.find(c => c.code === formData.country);
    const creationDate = new Date().toISOString();
    const dueDate = addDays(new Date(), 14).toISOString();
    const invoiceNumber = `INV-${Date.now()}`;

    const invoiceData = {
      creationDate,
      invoiceItems: [
        {
          currency: "CHF",
          name: `${formData.roomType} Room - Zuitzerland`,
          quantity: 1,
          tax: {
            type: "percentage",
            amount: 0
          },
          unitPrice: `${formData.price}00` // Adding 00 for cents as per the format
        }
      ],
      invoiceNumber,
      buyerInfo: {
        address: {
          streetAddress: formData.address,
          city: formData.city,
          postalCode: formData.zip,
          country: selectedCountry?.name || ""
        },
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName
      },
      paymentTerms: {
        dueDate
      },
      paymentOptions: [
        {
          type: "wallet",
          value: {
            currencies: ["USDC-optimism"],
            paymentInformation: {
              paymentAddress: "0x23F2583FAaab6966F3733625F3D2BA3337eA5dCA",
              chain: "optimism"
            }
          }
        },
        {
          type: "wallet",
          value: {
            currencies: ["ETH-optimism"],
            paymentInformation: {
              paymentAddress: "0x23F2583FAaab6966F3733625F3D2BA3337eA5dCA",
              chain: "optimism"
            }
          }
        }
      ],
      tags: ["zapier_invoice"],
      meta: {
        format: "rnf_invoice",
        version: "0.0.3"
      }
    };

    const response = await fetch('https://api.request.finance/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${requestFinanceApiKey}`
      },
      body: JSON.stringify(invoiceData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Request Finance API error:', errorData);
      throw new Error('Failed to create invoice');
    }

    const data = await response.json();
    return {
      invoiceUid: data.uid,
      paymentLink: data.paymentLink
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!requestFinanceApiKey) {
      toast({
        title: "Configuration Error",
        description: "Invoice system is not properly configured.",
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

    try {
      const { invoiceUid, paymentLink } = await createRequestFinanceInvoice();
      
      // Convert BookingFormData to a plain object for JSON compatibility
      const bookingDetailsJson = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        zip: formData.zip,
        country: formData.country,
        checkin: formData.checkin,
        checkout: formData.checkout,
        roomType: formData.roomType,
        price: formData.price
      };

      // Store invoice in Supabase
      const { error: insertError } = await supabase
        .from('invoices')
        .insert({
          user_id: user?.id,
          invoice_uid: invoiceUid,
          payment_link: paymentLink,
          booking_details: bookingDetailsJson,
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

  useEffect(() => {
    const fetchApiKey = async () => {
      if (!authenticated) return;
      
      try {
        const { data, error } = await supabase
          .from('secrets')
          .select('value')
          .eq('name', 'REQUEST_FINANCE_API_KEY')
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching API key:', error);
          toast({
            title: "Configuration Error",
            description: "There was an error loading the invoice configuration.",
            variant: "destructive",
          });
          return;
        }
        
        if (data) {
          setRequestFinanceApiKey(data.value);
        }
      } catch (error) {
        console.error('Error fetching API key:', error);
      }
    };

    fetchApiKey();
  }, [authenticated]);

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
