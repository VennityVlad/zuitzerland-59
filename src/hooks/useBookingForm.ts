import { useState, useEffect } from "react";
import { format, addDays, differenceInDays, parse } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ROOM_MIN_STAY, MIN_STAY_DAYS, PRICING_TABLE } from "@/lib/constants";
import type { BookingFormData } from "@/types/booking";
import { countries } from "@/lib/countries";
import { useNavigate } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { v4 as uuidv4 } from 'uuid';

const VAT_RATE = 0.038; // 3.8% VAT rate for all customers

export const useBookingForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, authenticated } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
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
    discountCode: "",
    paymentType: "fiat", // Default to fiat
  });

  const calculatePrice = (checkin: string, checkout: string, roomType: string) => {
    if (!checkin || !checkout || !roomType) return 0;
    
    const startDate = parse(checkin, 'yyyy-MM-dd', new Date());
    const endDate = parse(checkout, 'yyyy-MM-dd', new Date());
    const days = differenceInDays(endDate, startDate);
    
    if (days <= 0) return 0;
    
    const priceArray = PRICING_TABLE[roomType];
    if (!priceArray) return 0;
    
    const mayFirst = new Date(2025, 4, 1);
    const startIndex = differenceInDays(startDate, mayFirst);
    
    let totalPrice = 0;
    for (let i = 0; i < days; i++) {
      const dayIndex = startIndex + i;
      const dayPrice = priceArray[Math.min(dayIndex, priceArray.length - 1)];
      totalPrice += dayPrice;
    }
    
    return totalPrice;
  };

  const calculateDiscount = async (basePrice: number, bookingMonth: string, discountCode?: string) => {
    try {
      const { data: discounts, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('active', true)
        .eq('month', bookingMonth.toLowerCase());

      if (error) {
        console.error('Error fetching discounts:', error);
        return 0;
      }

      let applicableDiscount = discounts.find(d => d.code === null); // Regular discount
      
      if (discountCode) {
        const specialDiscount = discounts.find(d => d.code === discountCode);
        if (specialDiscount) {
          applicableDiscount = specialDiscount;
        }
      }

      if (!applicableDiscount) return 0;

      return (basePrice * applicableDiscount.percentage) / 100;
    } catch (error) {
      console.error('Error calculating discount:', error);
      return 0;
    }
  };

  const calculateTaxAmount = (basePrice: number): number => {
    return basePrice * VAT_RATE;
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
      const days = differenceInDays(new Date(formData.checkout), new Date(formData.checkin));
      stayValidation = validateMinimumStay(days, formData.roomType);
    }

    setValidationWarning(stayValidation);
    setIsFormValid(allFieldsFilled && isEmailValid && !stayValidation);
  };

  const handleInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      const updatePriceAndDiscount = async () => {
        if (
          (name === "checkin" || name === "checkout" || name === "roomType" || name === "discountCode") &&
          newData.checkin &&
          newData.checkout &&
          newData.roomType
        ) {
          const basePrice = calculatePrice(
            newData.checkin,
            newData.checkout,
            newData.roomType
          );
          
          const bookingDate = new Date();
          const bookingMonth = format(bookingDate, 'MMMM');
          
          const discount = await calculateDiscount(basePrice, bookingMonth, newData.discountCode);
          setDiscountAmount(discount);
          
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
  };

  const generateInvoiceNumber = () => {
    const timestamp = new Date().getTime().toString().slice(-6); // Last 6 digits of timestamp
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase(); // 3 random alphanumeric
    return `INV-${timestamp}-${randomStr}`;
  };

  const calculateDueDate = () => {
    const now = new Date();
    const dueDate = addDays(now, 7); // Changed from 14 to 7 days
    // Set due date to end of the day (23:59:59)
    dueDate.setHours(23, 59, 59, 999);
    return dueDate.toISOString();
  };

  const notifyZapier = async (bookingData: BookingFormData) => {
    try {
      const { data: { webhook_url }, error } = await supabase
        .functions.invoke('get-secret', {
          body: { secret_name: 'ZAPIER_WEBHOOK_URL' }
        });

      if (error || !webhook_url) {
        console.error('Error fetching Zapier webhook URL:', error);
        throw new Error('Failed to get webhook URL');
      }

      const creationDate = new Date().toISOString();
      const dueDate = calculateDueDate();
      const invoiceNumber = generateInvoiceNumber();

      const basePrice = bookingData.price;
      const priceAfterDiscount = basePrice - discountAmount;
      const taxAmount = calculateTaxAmount(priceAfterDiscount);
      const totalAmount = priceAfterDiscount + taxAmount;

      // Format data for Request Finance
      const invoiceData = {
        creationDate,
        invoiceItems: [
          {
            currency: "CHF",
            name: "Zuitzerland",
            quantity: 1,
            tax: {
              type: "percentage",
              amount: "3.8" // VAT rate as string
            }
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
        tags: ["zapier_invoice"],
        meta: {
          format: "rnf_invoice",
          version: "0.0.3"
        }
      };

      // Create invoice using Request Finance API with payment type
      const { data: invoiceResponse, error: invoiceError } = await supabase.functions.invoke('create-invoice', {
        body: { 
          invoiceData,
          paymentType: bookingData.paymentType,
          priceAfterDiscount
        }
      });

      if (invoiceError) {
        console.error('Error creating invoice:', invoiceError);
        throw invoiceError;
      }

      console.log('Invoice created successfully:', invoiceResponse);

      // Send data to Zapier
      const zapierData = {
        firstName: bookingData.firstName,
        lastName: bookingData.lastName,
        email: bookingData.email,
        address: bookingData.address,
        city: bookingData.city,
        zip: bookingData.zip,
        country: bookingData.country,
        checkin: bookingData.checkin,
        checkout: bookingData.checkout,
        roomType: bookingData.roomType,
        basePrice,
        discountAmount,
        priceAfterDiscount,
        taxAmount,
        totalAmount,
        creationDate,
        dueDate,
        invoiceNumber,
        discountCode: bookingData.discountCode,
        paymentType: bookingData.paymentType === 'fiat' ? 'stripe' : 'wallet'
      };

      console.log('Sending data to Zapier:', zapierData);

      const { data, error: webhookError } = await supabase.functions.invoke('trigger-zapier', {
        body: { 
          webhook_url,
          data: zapierData
        }
      });

      if (webhookError) {
        console.error('Error calling webhook:', webhookError);
        throw webhookError;
      }

      console.log('Zapier webhook triggered successfully');
      return { invoiceNumber };
    } catch (error) {
      console.error('Error in notifyZapier:', error);
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
      await notifyZapier(formData);

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
    validateForm();
  }, [formData]);

  return {
    formData,
    isLoading,
    isFormValid,
    validationWarning,
    discountAmount,
    handleInputChange,
    handleSubmit,
    handleCountryChange,
    handlePaymentTypeChange,
    calculateTaxAmount,
  };
};
