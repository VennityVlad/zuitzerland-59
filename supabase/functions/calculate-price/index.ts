
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';

const VAT_RATE = 0.038; // 3.8% VAT rate
const STRIPE_FEE_RATE = 0.03; // 3% Stripe fee for credit card payments

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting price calculation in edge function');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log('Parsed request body successfully:', body);
    } catch (e) {
      console.error('Error parsing request body:', e);
      throw new Error('Invalid request body format');
    }

    const { 
      checkin, 
      checkout, 
      roomType, 
      paymentType = 'fiat',
      privyId = null
    } = body;
    
    if (!checkin || !checkout || !roomType) {
      console.error('Missing required fields:', { hasCheckin: !!checkin, hasCheckout: !!checkout, hasRoomType: !!roomType });
      throw new Error('Missing required fields in request');
    }

    // Calculate stay duration
    const startDate = new Date(checkin);
    const endDate = new Date(checkout);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days <= 0) {
      throw new Error('Invalid date range - checkout must be after checkin');
    }

    console.log('Calculated stay duration (days):', days);

    // Get room type details
    const { data: roomData, error: roomError } = await supabase
      .from('room_types')
      .select('code, min_stay_days')
      .eq('code', roomType)
      .single();

    if (roomError || !roomData) {
      console.error('Error fetching room code:', roomError);
      throw new Error('Invalid room type');
    }

    if (roomData.min_stay_days && days < roomData.min_stay_days) {
      throw new Error(`Minimum stay for this room type is ${roomData.min_stay_days} days`);
    }

    // Get applicable price
    const { data: prices, error: priceError } = await supabase
      .from('prices')
      .select('*')
      .eq('room_code', roomData.code)
      .lte('duration', days)
      .order('duration', { ascending: false })
      .limit(1);

    if (priceError) {
      console.error('Supabase query error:', priceError);
      throw new Error('Error retrieving price information');
    }

    if (!prices || prices.length === 0) {
      console.error('No applicable price found for:', {
        room_code: roomData.code,
        duration: days
      });
      throw new Error('No applicable price found for this room and duration');
    }

    const applicablePrice = prices[0];
    console.log('Found applicable price:', applicablePrice);
    
    const basePrice = applicablePrice.price * days;
    console.log('Calculated base price:', basePrice);

    // Calculate discount
    let discountAmount = 0;
    let discountName = null;
    let isRoleBasedDiscount = false;
    let discountPercentage = 0;
    let discountMonth = null;

    try {
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Check for role-based discount if user ID is provided
      if (privyId) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('privy_id', privyId)
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

          if (!error && discounts && discounts.length > 0) {
            const discount = discounts[0];
            console.log('Found applicable role-based discount:', discount);
            
            discountAmount = (basePrice * discount.percentage) / 100;
            isRoleBasedDiscount = true;
            discountName = discount.discountName || 
                  `Special Discount (${new Date(discount.start_date).toLocaleDateString()} - ${new Date(discount.end_date).toLocaleDateString()})`;
            discountPercentage = discount.percentage;
          }
        }
      }

      // If no role-based discount was applied, check for regular discounts
      if (discountAmount === 0) {
        const { data: regularDiscounts, error } = await supabase
          .from('discounts')
          .select('*')
          .eq('active', true)
          .eq('is_role_based', false)
          .lte('start_date', currentDate)
          .gte('end_date', currentDate);

        if (!error && regularDiscounts && regularDiscounts.length > 0) {
          const discount = regularDiscounts[0];
          console.log('Found applicable regular discount:', discount);
          
          discountAmount = (basePrice * discount.percentage) / 100;
          isRoleBasedDiscount = false;
          discountName = discount.discountName || 
                `Special Discount (${new Date(discount.start_date).toLocaleDateString()} - ${new Date(discount.end_date).toLocaleDateString()})`;
          discountPercentage = discount.percentage;
        }
      }
    } catch (error) {
      console.error('Error calculating discount:', error);
      // Don't throw an error, just continue with no discount
    }

    // Price after discount
    const priceAfterDiscount = basePrice - discountAmount;
    
    // Calculate Stripe fee if applicable
    const stripeFee = paymentType === 'fiat' ? priceAfterDiscount * STRIPE_FEE_RATE : 0;
    
    // Add Stripe fee to get subtotal before VAT
    const subtotalBeforeVAT = priceAfterDiscount + stripeFee;
    
    // Calculate VAT
    const vatAmount = subtotalBeforeVAT * VAT_RATE;
    
    // Final total amount
    const totalAmount = subtotalBeforeVAT + vatAmount;

    // Format all monetary values to 2 decimal places
    const formattedResult = {
      basePrice: parseFloat(basePrice.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      discountName,
      isRoleBasedDiscount,
      discountPercentage,
      discountMonth,
      priceAfterDiscount: parseFloat(priceAfterDiscount.toFixed(2)),
      stripeFee: parseFloat(stripeFee.toFixed(2)),
      subtotalBeforeVAT: parseFloat(subtotalBeforeVAT.toFixed(2)),
      vatAmount: parseFloat(vatAmount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      days,
      dailyRate: parseFloat(applicablePrice.price.toFixed(2)),
      durationTier: applicablePrice.duration
    };

    console.log('Calculated price details:', formattedResult);
    
    return new Response(JSON.stringify(formattedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in calculate-price function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
