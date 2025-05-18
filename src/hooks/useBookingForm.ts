import { useState, useEffect } from "react";
import { format, addDays, differenceInDays, parse } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { BookingFormData, PriceData } from "@/types/booking";
import { useNavigate } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { useQuery } from "@tanstack/react-query";

const VAT_RATE = 0.038; // 3.8% VAT rate for all customers
const STRIPE_FEE_RATE = 0.03; // 3% Stripe fee for credit card payments

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
  const [allPriceData, setAllPriceData] = useState<PriceData[]>([]);
  
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

  // Function to set price data from the component
  const setPriceData = (priceData: PriceData[]) => {
    console.log("Setting all price data:", priceData);
    setAllPriceData(priceData);
  };

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('privy_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: Boolean(user?.id)
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
    
    const startDate = parse(checkin, 'yyyy-MM-dd', new Date());
    const endDate = parse(checkout, 'yyyy-MM-dd', new Date());
    const days = differenceInDays(endDate, startDate);
    
    console.log('Calculated stay duration (days):', days);
    
    if (days <= 0) {
      console.log('Invalid date range - days <= 0');
      return 0;
    }

    // Use cached price data if available
    if (allPriceData && allPriceData.length > 0) {
      console.log('Using cached price data for calculation');
      
      // Filter price data for this room type using room_code instead of room_type
      const roomPrices = allPriceData.filter(price => price.room_code === roomType);
      console.log('Available prices for room type:', roomPrices);
      
      if (roomPrices.length === 0) {
        console.log('No cached prices found for room type:', roomType);
        // Fall back to database query
      } else {
        // Find the price with the highest duration that's less than or equal to the stay duration
        const applicablePrices = roomPrices
          .filter(price => price.duration <= days)
          .sort((a, b) => b.duration - a.duration);
        
        if (applicablePrices.length > 0) {
          const applicablePrice = applicablePrices[0];
          console.log('Found applicable price from cache:', applicablePrice);
          
          const totalPrice = applicablePrice.price * days;
          console.log('Calculated total price from cache:', { 
            dailyRate: applicablePrice.price,
            days,
            totalPrice 
          });
          
          return totalPrice;
        }
      }
    }

    // If we couldn't calculate from cache, query the database
    try {
      const { data: roomData, error: roomError } = await supabase
        .from('room_types')
        .select('code')
        .eq('code', roomType)
        .single();

      if (roomError || !roomData) {
        console.error('Error fetching room code:', roomError);
        return 0;
      }

      const { data: prices, error } = await supabase
        .from('prices')
        .select('*')
        .eq('room_code', roomData.code) // Use room_code for querying
        .lte('duration', days)
        .order('duration', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Supabase query error:', error);
        return 0;
      }

      if (!prices || prices.length === 0) {
        console.error('No applicable price found for:', {
          room_code: roomData.code,
          duration: days
        });
        return 0;
      }

      const applicablePrice = prices[0];
      console.log('Found applicable price from database:', applicablePrice);
      
      const totalPrice = applicablePrice.price * days;
      console.log('Calculated total price from database:', { 
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

  const calculateDiscount = async (basePrice: number, checkinDate: string) => {
    try {
      const currentDate = format(new Date(), 'yyyy-MM-dd');
      console.log('Calculating discount based on current date:', currentDate);
      
      if (user?.id) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('privy_id', user.id)
          .single();

        const isEligibleRole = userProfile?.role === 'co-designer' || userProfile?.role === 'co-curator';
        console.log('User has eligible role for discount:', isEligibleRole);

        if (isEligibleRole) {
          const { data: discounts, error } = await supabase
            .from('discounts')
            .select('*')
            .eq('active', true)
            .eq('is_role_based', true)
            .lte('start_date', currentDate)
            .gte('end_date', currentDate);

          if (error) {
            console.error('Error fetching role-based discounts:', error);
            return { 
              amount: 0, 
              isRoleBasedDiscount: false, 
              name: null, 
              percentage: 0, 
              month: null 
            };
          }

          if (discounts && discounts.length > 0) {
            const discount = discounts[0];
            console.log('Found applicable role-based discount:', discount);
            
            return {
              amount: (basePrice * discount.percentage) / 100,
              isRoleBasedDiscount: true,
              name: discount.discountName || 
                    `Special Discount (${format(new Date(discount.start_date), 'MMM d')} - ${format(new Date(discount.end_date), 'MMM d')})`,
              percentage: discount.percentage,
              month: null
            };
          }
        }
      }

      const { data: regularDiscounts, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('active', true)
        .eq('is_role_based', false)
        .lte('start_date', currentDate)
        .gte('end_date', currentDate);

      if (error) {
        console.error('Error fetching regular discounts:', error);
        return { 
          amount: 0, 
          isRoleBasedDiscount: false, 
          name: null, 
          percentage: 0, 
          month: null 
        };
      }

      if (regularDiscounts && regularDiscounts.length > 0) {
        const discount = regularDiscounts[0];
        console.log('Found applicable regular discount:', discount);
        
        return {
          amount: (basePrice * discount.percentage) / 100,
          isRoleBasedDiscount: false,
          name: discount.discountName || 
                `Special Discount (${format(new Date(discount.start_date), 'MMM d')} - ${format(new Date(discount.end_date), 'MMM d')})`,
          percentage: discount.percentage,
          month: null
        };
      }

      console.log('No applicable discounts found');
      return { 
        amount: 0, 
        isRoleBasedDiscount: false, 
        name: null, 
        percentage: 0, 
        month: null 
      };
    } catch (error) {
      console.error('Error calculating discount:', error);
      return { 
        amount: 0, 
        isRoleBasedDiscount: false, 
        name: null, 
        percentage: 0, 
        month: null 
      };
    }
  };

  const calculateTaxAmount = (priceWithFees: number): number => {
    return priceWithFees * VAT_RATE;
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
        const days = differenceInDays(endDate, startDate);
        
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

      // Create a separate function for price calculation to avoid nested async calls
      const updatePriceAndDiscount = async () => {
        if (
          (name === "checkin" || name === "checkout" || name === "roomType") &&
          newData.checkin &&
          newData.checkout &&
          newData.roomType
        ) {
          console.log('Recalculating price after input change:', {
            checkin: newData.checkin,
            checkout: newData.checkout,
            roomType: newData.roomType
          });

          const basePrice = await calculatePrice(
            newData.checkin,
            newData.checkout,
            newData.roomType
          );
          
          const { amount, isRoleBasedDiscount, name, percentage, month } = await calculateDiscount(basePrice, newData.checkin);
          
          console.log('Price calculation results:', {
            basePrice,
            discount: { amount, isRoleBasedDiscount, name, percentage, month }
          });
          
          setDiscountAmount(amount);
          setIsRoleBasedDiscount(isRoleBasedDiscount);
          setDiscountName(name);
          setDiscountPercentage(percentage || 0);
          setDiscountMonth(month);
          
          // Update form data with new price in a way that triggers UI updates
          setFormData(current => ({
            ...current,
            price: basePrice
          }));
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

  const createInvoice = async (bookingData: BookingFormData, customProfileId?: string, customPrice?: number) => {
    try {
      console.log('Creating invoice with profile ID:', customProfileId || 'Default');
      
      const creationDate = new Date().toISOString();
      const dueDate = calculateDueDate();
      const invoiceNumber = generateInvoiceNumber();

      const basePrice = customPrice !== undefined ? customPrice : bookingData.price;
      const priceAfterDiscount = basePrice - discountAmount;
      
      const stripeFee = bookingData.paymentType === "fiat" ? priceAfterDiscount * STRIPE_FEE_RATE : 0;
      
      const subtotalBeforeVAT = priceAfterDiscount + stripeFee;
      
      const taxAmount = calculateTaxAmount(subtotalBeforeVAT);
      
      const totalAmount = subtotalBeforeVAT + taxAmount;

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
          priceAfterDiscount: customPrice !== undefined ? customPrice - discountAmount : priceAfterDiscount,
          privyId: customProfileId ? null : user?.id,
          profileId: customProfileId || null,
          bookingInfo: {
            checkin: bookingData.checkin,
            checkout: bookingData.checkout,
            roomType: bookingData.roomType
          }
        }
      });

      if (invoiceError) {
        console.error('Error creating invoice:', invoiceError);
        throw invoiceError;
      }

      console.log('Invoice created successfully:', invoiceResponse);
      
      return invoiceResponse;
    } catch (error) {
      console.error('Error in createInvoice:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent, adminFormData?: BookingFormData, isAdminMode?: boolean) => {
    e.preventDefault();
    setIsLoading(true);

    const submissionData = isAdminMode && adminFormData ? adminFormData : formData;

    const days = differenceInDays(
      new Date(submissionData.checkout),
      new Date(submissionData.checkin)
    );

    const validationError = validateMinimumStay(days, submissionData.roomType);
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
      if (isAdminMode && adminFormData && adminFormData.profileId) {
        const customPrice = typeof adminFormData.price === 'number' ? adminFormData.price : undefined;
        const invoiceResponse = await createInvoice(adminFormData, adminFormData.profileId, customPrice);
        
        if (invoiceResponse.paymentLink) {
          window.open(invoiceResponse.paymentLink, '_blank');
        }

        toast({
          title: "Booking Created",
          description: "The booking has been successfully created for this user!",
        });

        navigate('/invoices');
        return;
      }

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

      const invoiceResponse = await createInvoice(submissionData);
      
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

  // Recalculate price whenever key booking parameters change
  useEffect(() => {
    const updatePrice = async () => {
      if (formData.checkin && formData.checkout && formData.roomType) {
        console.log('Recalculating price based on data changes:', {
          checkin: formData.checkin,
          checkout: formData.checkout,
          roomType: formData.roomType
        });

        const basePrice = await calculatePrice(
          formData.checkin,
          formData.checkout,
          formData.roomType
        );
        
        const { amount, isRoleBasedDiscount, name, percentage, month } = await calculateDiscount(basePrice, formData.checkin);
        
        setDiscountAmount(amount);
        setIsRoleBasedDiscount(isRoleBasedDiscount);
        setDiscountName(name);
        setDiscountPercentage(percentage || 0);
        setDiscountMonth(month);
        
        if (basePrice !== formData.price) {
          console.log('Updating price from', formData.price, 'to', basePrice);
          setFormData(current => ({
            ...current,
            price: basePrice
          }));
        }
      }
    };

    updatePrice();
  }, [formData.checkin, formData.checkout, formData.roomType]);

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
    formData.price, // Added to ensure validation runs when price changes
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
    calculateTaxAmount,
    setPriceData,
  };
};
