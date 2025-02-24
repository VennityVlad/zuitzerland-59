
import { useState, useEffect } from "react";
import { format, addDays, differenceInDays, parse } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { BookingFormData } from "@/types/booking";
import { useNavigate } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { useQuery } from "@tanstack/react-query";

const VAT_RATE = 0.038; // 3.8% VAT rate for all customers

export const useBookingForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isRoleBasedDiscount, setIsRoleBasedDiscount] = useState(false);
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

  // Query to get room type details for minimum stay validation
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
    
    const startDate = parse(checkin, 'yyyy-MM-dd', new Date());
    const endDate = parse(checkout, 'yyyy-MM-dd', new Date());
    const days = differenceInDays(endDate, startDate);
    
    console.log('Calculated stay duration (days):', days);
    
    if (days <= 0) {
      console.log('Invalid date range - days <= 0');
      return 0;
    }

    try {
      // Get the applicable price based on the duration
      const { data: prices, error } = await supabase
        .from('prices')
        .select('*')
        .eq('room_code', roomType)
        .lte('duration', days)
        .order('duration', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Supabase query error:', error);
        return 0;
      }

      if (!prices || prices.length === 0) {
        console.error('No applicable price found for:', {
          room_type: roomType,
          duration: days
        });
        return 0;
      }

      const applicablePrice = prices[0];
      console.log('Found applicable price:', applicablePrice);
      
      // Calculate total price based on the daily rate and number of days
      const totalPrice = applicablePrice.price * days;
      console.log('Calculated total price:', { 
        dailyRate: applicablePrice.price,
        days,
        totalPrice 
      });
      
      return totalPrice;
    } catch (error) {
      console.error('Error in calculatePrice:', error);
      return 0;
    }
  };

  const calculateDiscount = async (basePrice: number, bookingMonth: string) => {
    try {
      // First, check if the user has a co-designer or co-curator role
      if (user?.id) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('privy_id', user.id)
          .single();

        const isEligibleRole = userProfile?.role === 'co-designer' || userProfile?.role === 'co-curator';

        if (isEligibleRole) {
          const { data: discounts, error } = await supabase
            .from('discounts')
            .select('*')
            .eq('active', true)
            .eq('is_role_based', true)
            .eq('month', bookingMonth.toLowerCase());

          if (error) {
            console.error('Error fetching discounts:', error);
            return { amount: 0, isRoleBasedDiscount: false };
          }

          if (discounts && discounts.length > 0) {
            const discount = discounts[0];
            return {
              amount: (basePrice * discount.percentage) / 100,
              isRoleBasedDiscount: true
            };
          }
        }
      }

      // If no role-based discount applies, check for regular discounts
      const { data: regularDiscounts, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('active', true)
        .eq('is_role_based', false)
        .eq('month', bookingMonth.toLowerCase());

      if (error) {
        console.error('Error fetching regular discounts:', error);
        return { amount: 0, isRoleBasedDiscount: false };
      }

      if (regularDiscounts && regularDiscounts.length > 0) {
        const discount = regularDiscounts[0];
        return {
          amount: (basePrice * discount.percentage) / 100,
          isRoleBasedDiscount: false
        };
      }

      return { amount: 0, isRoleBasedDiscount: false };
    } catch (error) {
      console.error('Error calculating discount:', error);
      return { amount: 0, isRoleBasedDiscount: false };
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
    if (!roomType || !roomTypeDetails) return null;
    const minimumStay = roomTypeDetails.min_stay_days;
    
    if (days < minimumStay) {
      return `This room type (${roomTypeDetails.display_name}) requires a minimum stay of ${minimumStay} days`;
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
          (name === "checkin" || name === "checkout" || name === "roomType") &&
          newData.checkin &&
          newData.checkout &&
          newData.roomType
        ) {
          const basePrice = await calculatePrice(
            newData.checkin,
            newData.checkout,
            newData.roomType
          );
          
          const bookingDate = new Date();
          const bookingMonth = format(bookingDate, 'MMMM');
          
          const { amount, isRoleBasedDiscount } = await calculateDiscount(basePrice, bookingMonth);
          setDiscountAmount(amount);
          setIsRoleBasedDiscount(isRoleBasedDiscount);
          
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
            name: "Zuitzerland reservation",
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
            isRoleBasedDiscount
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
      // Check for existing non-cancelled bookings
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
  }, [formData, roomTypeDetails]);

  return {
    formData,
    isLoading,
    isFormValid,
    validationWarning,
    discountAmount,
    isRoleBasedDiscount,
    handleInputChange,
    handleSubmit,
    handleCountryChange,
    handlePaymentTypeChange,
    calculateTaxAmount,
  };
};
