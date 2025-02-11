
import { useState, useEffect } from "react";
import { format, addDays, differenceInDays, parse } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ROOM_MIN_STAY, MIN_STAY_DAYS, PRICING_TABLE } from "@/lib/constants";
import type { BookingFormData } from "@/types/booking";
import { countries } from "@/lib/countries";
import { useNavigate } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";

const VAT_RATE = 0.038; // 3.8% VAT rate for all customers

export const useBookingForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = usePrivy();
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
      const creationDate = new Date().toISOString();
      const dueDate = calculateDueDate();
      const invoiceNumber = generateInvoiceNumber();

      const basePrice = bookingData.price;
      const priceAfterDiscount = basePrice - discountAmount;
      const taxAmount = calculateTaxAmount(priceAfterDiscount);
      const totalAmount = priceAfterDiscount + taxAmount;

      const invoiceData = {
        creationDate,
        invoiceItems: [
          {
            currency: "CHF",
            name: "Zuitzerland",
            quantity: 1,
            tax: {
              type: "percentage",
              amount: "3.8"
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

      const { error: dbError } = await supabase
        .from('invoices')
        .insert({
          privy_id: user?.id,
          request_invoice_id: invoiceResponse.invoiceId,
          invoice_uid: invoiceNumber,
          payment_link: invoiceResponse.paymentLink,
          status: 'pending',
          price: totalAmount,
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
            basePrice,
            discountAmount,
            taxAmount,
            totalAmount,
            discountCode: bookingData.discountCode || null
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
      const invoiceResponse = await createInvoice(formData);
      
      // Open payment link in new window
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
