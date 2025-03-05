
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';

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
    console.log('Starting invoice creation in edge function');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Request Finance API key from Edge Function secrets
    console.log('Fetching Request Finance API key from secrets');
    const requestFinanceApiKey = Deno.env.get('REQUEST_FINANCE_API_KEY');

    if (!requestFinanceApiKey) {
      console.error('No API key found in secrets');
      throw new Error('API key not found in configuration');
    }

    console.log('Successfully retrieved API key');

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log('Parsed request body successfully');
    } catch (e) {
      console.error('Error parsing request body:', e);
      throw new Error('Invalid request body format');
    }

    const { invoiceData, paymentType, priceAfterDiscount, privyId } = body;
    
    if (!invoiceData || !paymentType || typeof priceAfterDiscount !== 'number') {
      console.error('Missing required fields:', { 
        hasInvoiceData: !!invoiceData, 
        hasPaymentType: !!paymentType, 
        priceAfterDiscount 
      });
      throw new Error('Missing required fields in request');
    }

    // Retrieve the profile ID for the user if privyId is provided
    let profileId = null;
    if (privyId) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('privy_id', privyId)
        .maybeSingle();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else if (profileData) {
        profileId = profileData.id;
        console.log('Found profile ID:', profileId);
      } else {
        console.log('No profile found for privyId:', privyId);
      }
    }

    console.log('Request data validation passed:', {
      paymentType,
      priceAfterDiscount,
      buyerInfo: invoiceData.buyerInfo,
      privyId,
      profileId
    });

    // Get the price details from our calculate-price edge function to ensure consistency
    console.log('Calculating price details using calculate-price edge function');
    const calculatePriceReq = new Request(`${supabaseUrl}/functions/v1/calculate-price`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        checkin: invoiceData.meta.checkin,
        checkout: invoiceData.meta.checkout,
        roomType: invoiceData.meta.roomType,
        paymentType,
        privyId
      })
    });

    const calculatePriceRes = await fetch(calculatePriceReq);
    if (!calculatePriceRes.ok) {
      const errorText = await calculatePriceRes.text();
      console.error('Error calculating price:', errorText);
      throw new Error(`Failed to calculate price: ${errorText}`);
    }

    const priceDetails = await calculatePriceRes.json();
    console.log('Price details calculated:', priceDetails);

    // Adjust payment options based on payment type
    const paymentOptions = paymentType === 'fiat' ? 
      [{
        type: "stripe",
        value: {
          currency: "CHF",
          paymentInformation: {
            stripePublishableKey: "pk_live_51JP6y9Jdl2BXNtq7yWlocBoca85Q4s7yKZSXM5H6UHRQx7XNbOXgdT9hKZN13X87wDMt64pmNdhDwdLpNnLviJqa00utBfebZj"
          }
        }
      }] : 
      [
        {
          type: "wallet",
          value: {
            currencies: ["USDCn-optimism"],
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
      ];

    // Create the final invoice data with adjusted payment options
    const finalInvoiceData = {
      ...invoiceData,
      paymentOptions,
      invoiceItems: [{
        ...invoiceData.invoiceItems[0],
        name: "Zuitzerland reservation",
        unitPrice: `${Math.round(priceDetails.subtotalBeforeVAT)}00` // Send price before VAT but after discounts and fees
      }],
      tags: []
    };

    console.log('Prepared final invoice data:', JSON.stringify(finalInvoiceData, null, 2));

    // Step 1: Create off-chain invoice
    console.log('Creating off-chain invoice with Request Finance');
    const createInvoiceResponse = await fetch('https://api.request.finance/invoices', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': requestFinanceApiKey
      },
      body: JSON.stringify(finalInvoiceData)
    });

    console.log('Create Invoice API Response status:', createInvoiceResponse.status);
    
    if (!createInvoiceResponse.ok) {
      const errorText = await createInvoiceResponse.text();
      console.error('Request Finance API error response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(`Failed to create invoice: ${JSON.stringify(errorData)}`);
      } catch (e) {
        throw new Error(`Failed to create invoice: ${errorText}`);
      }
    }

    const offChainInvoice = await createInvoiceResponse.json();
    console.log('Off-chain invoice created:', offChainInvoice);

    // Step 2: Convert to on-chain request
    console.log('Converting invoice to on-chain request');
    const convertToOnChainResponse = await fetch(`https://api.request.finance/invoices/${offChainInvoice.id}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': requestFinanceApiKey
      }
    });

    console.log('Convert to on-chain API Response status:', convertToOnChainResponse.status);

    if (!convertToOnChainResponse.ok) {
      const errorText = await convertToOnChainResponse.text();
      console.error('Request Finance API error response for on-chain conversion:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(`Failed to convert invoice to on-chain request: ${JSON.stringify(errorData)}`);
      } catch (e) {
        throw new Error(`Failed to convert invoice to on-chain request: ${errorText}`);
      }
    }

    const onChainInvoice = await convertToOnChainResponse.json();
    console.log('On-chain invoice created:', onChainInvoice);

    // Step 3: Trigger Zapier webhook with enhanced invoice details
    try {
      console.log('Triggering Zapier webhook with enhanced details');
      const zapierResponse = await fetch('https://hooks.zapier.com/hooks/catch/15806559/2w3ifi2/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Invoice details
          invoiceId: onChainInvoice.id,
          paymentLink: onChainInvoice.invoiceLinks.pay,
          invoiceDueDate: onChainInvoice.dueDate,
          invoiceStatus: onChainInvoice.status,
          
          // Customer details
          customerName: `${invoiceData.buyerInfo.firstName} ${invoiceData.buyerInfo.lastName}`,
          customerEmail: invoiceData.buyerInfo.email,
          customerAddress: invoiceData.buyerInfo.street,
          customerCity: invoiceData.buyerInfo.city,
          customerCountry: invoiceData.buyerInfo.country,
          
          // Booking details
          basePrice: priceDetails.basePrice,
          discountAmount: priceDetails.discountAmount,
          priceAfterDiscount: priceDetails.priceAfterDiscount,
          stripeFee: priceDetails.stripeFee,
          subtotalBeforeVAT: priceDetails.subtotalBeforeVAT,
          vatAmount: priceDetails.vatAmount,
          totalAmount: priceDetails.totalAmount,
          checkinDate: invoiceData.meta.checkin,
          checkoutDate: invoiceData.meta.checkout,
          roomType: invoiceData.meta.roomType,
          numberOfNights: priceDetails.days,
          
          // Payment details
          paymentType: paymentType,
          currency: paymentType === 'fiat' ? 'CHF' : 'CRYPTO',
          
          // Timestamp
          createdAt: new Date().toISOString()
        })
      });

      if (!zapierResponse.ok) {
        console.error('Failed to trigger Zapier webhook:', await zapierResponse.text());
      } else {
        console.log('Successfully triggered Zapier webhook');
      }
    } catch (zapierError) {
      console.error('Error triggering Zapier webhook:', zapierError);
    }
    
    // Store the invoice data in our database with the profile ID
    try {
      const { error: dbError } = await supabase.from('invoices').insert({
        request_invoice_id: onChainInvoice.id,
        invoice_uid: onChainInvoice.invoiceNumber || crypto.randomUUID(),
        payment_link: onChainInvoice.invoiceLinks.pay,
        price: priceDetails.totalAmount,
        room_type: invoiceData.meta.roomType,
        checkin: invoiceData.meta.checkin,
        checkout: invoiceData.meta.checkout,
        email: invoiceData.buyerInfo.email,
        first_name: invoiceData.buyerInfo.firstName,
        last_name: invoiceData.buyerInfo.lastName,
        due_date: onChainInvoice.dueDate,
        booking_details: {
          ...invoiceData,
          priceCalculation: priceDetails
        },
        payment_type: paymentType,
        privy_id: privyId,
        profile_id: profileId
      });

      if (dbError) {
        console.error('Error storing invoice in database:', dbError);
      }
    } catch (dbError) {
      console.error('Exception storing invoice in database:', dbError);
    }
    
    console.log('Sending successful response');
    return new Response(JSON.stringify({
      invoiceId: onChainInvoice.id,
      requestId: onChainInvoice.requestId,
      paymentLink: onChainInvoice.invoiceLinks.pay
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in create-invoice function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
