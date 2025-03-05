
import { useState, useEffect } from "react";
import { format, addDays, parse } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { BookingFormData } from "@/types/booking";
import { useNavigate } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { useQuery } from "@tanstack/react-query";

export const useBookingForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isRoleBasedDiscount, setIsRoleBasedDiscount] = useState(false);
  const [discountName, setDiscountName] = useState<string | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [discountMonth, setDiscountMonth] = useState<string | null>(null);
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
    paymentType: "fiat", // Default to fiat
  });

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

  const calculatePrice = async (checkin: string, checkout: string, roomType: string) => {
    console.log('calculatePrice called with:', { checkin, checkout, roomType });
    
    if (!checkin || !checkout || !roomType) {
      console.log('Missing required parameters:', { checkin, checkout, roomType });
      return 0;
    }

    try {
      // Call the edge function for price calculation
      const { data: priceDetails, error } = await supabase.functions.invoke('calculate-price', {
        body: { 
          checkin, 
          checkout, 
          roomType,
          paymentType: formData.paymentType,
          privyId: user?.id
        }
      });

      if (error) {
        console.error('Error from calculate-price edge function:', error);
        return 0;
      }

      console.log('Received price details from edge function:', priceDetails);
      
      // Update discount-related state
      setDiscountAmount(priceDetails.discountAmount);
      setIsRoleBasedDiscount(priceDetails.isRoleBasedDiscount);
      setDiscountName(priceDetails.discountName);
      setDiscountPercentage(priceDetails.discountPercentage);
      setDiscountMonth(priceDetails.discountMonth);
      
      return priceDetails.basePrice;
    } catch (error) {
      console.error('Error in calculatePrice:', error);
      return 0;
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMinimumStay = (days: number, roomType: string): string | null => {
    console.log('Validating minimum stay:', { days, roomType, roomTypeDetails });
    
    if (!roomType || !roomTypeDetails) {
      console.log('Skipping validation - missing room type or details');
      return null;
    }
    
    const minimumStay = roomTypeDetails.min_stay_days || 0;
    console.log('Minimum stay requirement:', minimumStay);
    
    if (days < minimumStay) {
      const warningMessage = `This room type (${roomTypeDetails.display_name}) requires a minimum stay of ${minimumStay} days`;
      console.log('Validation failed:', warningMessage);
      return warningMessage;
    }
    
    console.log('Validation passed');
    return null;
  };

  const validateForm = () => {
    console.log('Validating form with data:', formData);
    
    const requiredFields = [
      'firstName', 
      'lastName', 
      'email', 
      'address', 
      'city', 
      'zip', 
      'country', 
      'checkin', 
      'checkout', 
      'roomType',
      'paymentType'
    ] as const;
    
    const allFieldsFilled = requiredFields.every(field => formData[field]);
    const isEmailValid = validateEmail(formData.email);

    let stayValidation = null;
    if (formData.checkin && formData.checkout && formData.roomType) {
      try {
        const startDate = parse(formData.checkin, 'yyyy-MM-dd', new Date());
        const endDate = parse(formData.checkout, 'yyyy-MM-dd', new Date());
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log('Calculated stay duration:', {
          startDate,
          endDate,
          days,
          roomType: formData.roomType
        });
        
        if (days > 0) {
          stayValidation = validateMinimumStay(days, formData.roomType);
        } else {
          console.log('Invalid date range - days <= 0');
        }
      } catch (error) {
        console.error('Error calculating stay duration:', error);
      }
    } else {
      console.log('Missing required date or room type fields for validation');
    }

    console.log('Validation results:', {
      allFieldsFilled,
      isEmailValid,
      stayValidation,
      isFormValid: allFieldsFilled && isEmailValid && !stayValidation
    });

    setValidationWarning(stayValidation);
    setIsFormValid(allFieldsFilled && isEmailValid && !stayValidation);
  };

  const handleInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    console.log('Input changed:', { name, value });
    
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      const updatePriceAndDiscount = async () => {
        if (
          (name === "checkin" || name === "checkout" || name === "roomType" || name === "paymentType") &&
          newData.checkin &&
          newData.checkout &&
          newData.roomType
        ) {
          const basePrice = await calculatePrice(
            newData.checkin,
            newData.checkout,
            newData.roomType
          );
          
          newData.price = basePrice;
        }
      };

      updatePriceAndDiscount();
      return newData;
    });
  };

  const handleCountryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      country: value
    }));
  };

  const handlePaymentTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      paymentType: value as 'fiat' | 'crypto'
    }));

    // Recalculate price when payment type changes
    if (formData.checkin && formData.checkout && formData.roomType) {
      calculatePrice(formData.checkin, formData.checkout, formData.roomType);
    }
  };

  const generateInvoiceNumber = () => {
    const timestamp = new Date().getTime().toString().slice(-6);
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `INV-${timestamp}-${randomStr}`;
  };

  const calculateDueDate = () => {
    const now = new Date();
    const dueDate = addDays(now, 7);
    dueDate.setHours(23, 59, 59, 999);
    return dueDate.toISOString();
  };

  const createInvoice = async (bookingData: BookingFormData) => {
    try {
      console.log('Creating invoice with booking data:', bookingData);
      
      const creationDate = new Date().toISOString();
      const dueDate = calculateDueDate();
      const invoiceNumber = generateInvoiceNumber();

      // Get the latest price calculation from the edge function to ensure consistency
      const { data: priceDetails, error: priceError } = await supabase.functions.invoke('calculate-price', {
        body: { 
          checkin: bookingData.checkin, 
          checkout: bookingData.checkout, 
          roomType: bookingData.roomType,
          paymentType: bookingData.paymentType,
          privyId: user?.id
        }
      });

      if (priceError) {
        console.error('Error calculating price:', priceError);
        throw new Error('Failed to calculate price');
      }

      console.log('Received price details for invoice:', priceDetails);

      const invoiceData = {
        creationDate,
        invoiceItems: [
          {
            currency: "CHF",
            name: "Zuitzerland reservation",
            quantity: 1,
            tax: {
              type: "percentage",
              amount: "3.8"
            },
            unitPrice: `${Math.round(priceDetails.subtotalBeforeVAT)}00` // Send price before VAT (with Stripe fee if applicable)
          }
        ],
        invoiceNumber,
        buyerInfo: {
          address: {
            streetAddress: bookingData.address,
            city: bookingData.city,
            postalCode: bookingData.zip,
            country: bookingData.country
          },
          email: bookingData.email,
          firstName: bookingData.firstName,
          lastName: bookingData.lastName
        },
        paymentTerms: {
          dueDate
        },
        meta: {
          format: "rnf_invoice",
          version: "0.0.3",
          booking: {
            checkin: bookingData.checkin,
            checkout: bookingData.checkout,
            roomType: bookingData.roomType
          }
        }
      };

      const { data: invoiceResponse, error: invoiceError } = await supabase.functions.invoke('create-invoice', {
        body: { 
          invoiceData,
          paymentType: bookingData.paymentType,
          priceAfterDiscount: priceDetails.priceAfterDiscount,
          privyId: user?.id
        }
      });

      if (invoiceError) {
        console.error('Error creating invoice:', invoiceError);
        throw invoiceError;
      }

      console.log('Invoice created successfully:', invoiceResponse);

      const { error: dbError } = await supabase
        .from('invoices')
        .insert({
          privy_id: user?.id,
          request_invoice_id: invoiceResponse.invoiceId,
          invoice_uid: invoiceNumber,
          payment_link: invoiceResponse.paymentLink,
          status: 'pending',
          price: priceDetails.totalAmount,
          payment_type: bookingData.paymentType,
          due_date: dueDate,
          checkin: bookingData.checkin,
          checkout: bookingData.checkout,
          room_type: bookingData.roomType,
          first_name: bookingData.firstName,
          last_name: bookingData.lastName,
          email: bookingData.email,
          booking_details: {
            address: bookingData.address,
            city: bookingData.city,
            zip: bookingData.zip,
            country: bookingData.country,
            priceCalculation: priceDetails
          }
        });

      if (dbError) {
        console.error('Error storing invoice in database:', dbError);
        throw dbError;
      }

      return invoiceResponse;
    } catch (error) {
      console.error('Error in createInvoice:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: existingInvoices, error: checkError } = await supabase
        .from('invoices')
        .select('*')
        .eq('privy_id', user?.id)
        .neq('status', 'cancelled');

      if (checkError) throw checkError;

      if (existingInvoices && existingInvoices.length > 0) {
        toast({
          title: "Existing Booking",
          description: "You already have an existing booking. Please check your invoices page.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const invoiceResponse = await createInvoice(formData);
      
      if (invoiceResponse.paymentLink) {
        window.open(invoiceResponse.paymentLink, '_blank');
      }

      toast({
        title: "Booking Submitted",
        description: "Your booking has been successfully submitted!",
      });

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
    console.log('Running validation effect:', {
      formData,
      roomTypeDetails
    });
    validateForm();
  }, [
    formData.checkin,
    formData.checkout,
    formData.roomType,
    formData.email,
    formData.firstName,
    formData.lastName,
    formData.address,
    formData.city,
    formData.zip,
    formData.country,
    formData.paymentType,
    roomTypeDetails
  ]);

  return {
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
  };
};
