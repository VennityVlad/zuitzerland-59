
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VAT_RATE = 0.038; // 3.8% VAT rate
const STRIPE_FEE_RATE = 0.03; // 3% Stripe fee

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
      console.log('Parsed request body:', JSON.stringify(body, null, 2));
    } catch (e) {
      console.error('Error parsing request body:', e);
      throw new Error('Invalid request body format');
    }

    const { invoiceData, paymentType, priceAfterDiscount, privyId, bookingInfo } = body;
    
    if (!invoiceData || !paymentType || typeof priceAfterDiscount !== 'number') {
      console.error('Missing required fields:', { 
        hasInvoiceData: !!invoiceData, 
        hasPaymentType: !!paymentType, 
        priceAfterDiscount 
      });
      throw new Error('Missing required fields in request');
    }

    // Ensure we have valid booking info
    if (!bookingInfo || !bookingInfo.checkin || !bookingInfo.checkout || !bookingInfo.roomType) {
      console.error('Missing required booking info:', bookingInfo);
      throw new Error('Missing required booking information');
    }

    // Retrieve the profile ID for the user if privyId is provided
    let profileId = null;
    if (privyId) {
      console.log('Looking up profile with privyId:', privyId);
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
      profileId,
      bookingInfo
    });

    // Calculate price with Stripe fee if payment type is fiat
    const priceWithStripeFee = paymentType === 'fiat' 
      ? priceAfterDiscount * (1 + STRIPE_FEE_RATE)  // Add 3% Stripe fee
      : priceAfterDiscount;

    // Calculate VAT separately - Request Finance will handle this based on the tax info we provide
    const vatAmount = priceWithStripeFee * VAT_RATE;
    
    // Final price including all fees (for our records)
    const finalPrice = priceWithStripeFee + vatAmount;

    console.log('Price calculation:', {
      priceAfterDiscount,
      priceWithStripeFee,
      vatAmount,
      finalPrice
    });

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

    // Fix any potential properties in buyerInfo that should not exist (like street)
    const sanitizedBuyerInfo = { ...invoiceData.buyerInfo };
    if (sanitizedBuyerInfo.street) {
      // Move street to address.streetAddress if it exists directly on buyerInfo
      if (!sanitizedBuyerInfo.address) {
        sanitizedBuyerInfo.address = {
          streetAddress: sanitizedBuyerInfo.street
        };
      } else if (!sanitizedBuyerInfo.address.streetAddress) {
        sanitizedBuyerInfo.address.streetAddress = sanitizedBuyerInfo.street;
      }
      // Remove the top-level street property
      delete sanitizedBuyerInfo.street;
    }

    // Ensure address exists
    if (!sanitizedBuyerInfo.address) {
      sanitizedBuyerInfo.address = {};
    }

    // Fix the meta field - Remove booking info and just use the required format and version
    const sanitizedMeta = {
      format: "rnf_invoice",
      version: "0.0.3"
    };

    // Ensure invoiceItems has the necessary properties
    const invoiceItems = Array.isArray(invoiceData.invoiceItems) && invoiceData.invoiceItems.length > 0
      ? [{
          ...invoiceData.invoiceItems[0],
          name: "Zuitzerland reservation",
          unitPrice: `${Math.round(priceWithStripeFee)}00` // Send price with Stripe fee but before VAT
        }]
      : [{
          currency: "CHF",
          name: "Zuitzerland reservation",
          quantity: 1,
          unitPrice: `${Math.round(priceWithStripeFee)}00`,
          tax: {
            type: "percentage",
            amount: "3.8"
          }
        }];

    // Create the final invoice data with adjusted payment options and sanitized properties
    const finalInvoiceData = {
      ...invoiceData,
      paymentOptions,
      buyerInfo: sanitizedBuyerInfo,
      meta: sanitizedMeta, // Using the corrected meta field without booking info
      invoiceItems,
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
      const zapierWebhookUrl = Deno.env.get('ZAPIER_WEBHOOK_URL') || 'https://hooks.zapier.com/hooks/catch/15806559/2w3ifi2/';
      
      const zapierResponse = await fetch(zapierWebhookUrl, {
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
          customerName: `${sanitizedBuyerInfo.firstName} ${sanitizedBuyerInfo.lastName}`,
          customerEmail: sanitizedBuyerInfo.email,
          customerAddress: sanitizedBuyerInfo.address?.streetAddress || '',
          customerCity: sanitizedBuyerInfo.address?.city || '',
          customerCountry: sanitizedBuyerInfo.address?.country || '',
          
          // Booking details
          basePrice: priceAfterDiscount,
          stripeFee: paymentType === 'fiat' ? priceAfterDiscount * STRIPE_FEE_RATE : 0,
          vatAmount: vatAmount,
          totalAmount: finalPrice,
          checkinDate: bookingInfo.checkin || '',
          checkoutDate: bookingInfo.checkout || '',
          roomType: bookingInfo.roomType || '',
          numberOfNights: bookingInfo.checkin && bookingInfo.checkout ? 
            Math.ceil((new Date(bookingInfo.checkout).getTime() - new Date(bookingInfo.checkin).getTime()) / (1000 * 60 * 60 * 24)) : 0,
          
          // Payment details
          paymentType: paymentType,
          currency: paymentType === 'fiat' ? 'CHF' : 'CRYPTO',
          
          // Timestamp
          createdAt: new Date().toISOString(),
          
          // User identification 
          privyId: privyId,
          profileId: profileId
        })
      });

      if (!zapierResponse.ok) {
        console.error('Failed to trigger Zapier webhook:', await zapierResponse.text());
      } else {
        console.log('Successfully triggered Zapier webhook');
      }
    } catch (zapierError) {
      console.error('Error triggering Zapier webhook:', zapierError);
      // Continue execution even if the Zapier webhook fails
    }
    
    // Store the invoice data in our database with the profile ID
    try {
      console.log('Storing invoice data in Supabase with profile_id:', profileId);
      
      // Insert data into the database - create a detailed object
      const invoiceInsertData = {
        request_invoice_id: onChainInvoice.id,
        invoice_uid: onChainInvoice.invoiceNumber || crypto.randomUUID(),
        payment_link: onChainInvoice.invoiceLinks.pay,
        price: finalPrice,
        room_type: bookingInfo.roomType || '',
        checkin: bookingInfo.checkin || null,
        checkout: bookingInfo.checkout || null,
        email: sanitizedBuyerInfo.email,
        first_name: sanitizedBuyerInfo.firstName,
        last_name: sanitizedBuyerInfo.lastName,
        due_date: onChainInvoice.dueDate,
        booking_details: {
          ...invoiceData,
          bookingInfo, // Store the booking info here instead of in meta
          priceCalculation: {
            priceAfterDiscount,
            stripeFee: paymentType === 'fiat' ? priceAfterDiscount * STRIPE_FEE_RATE : 0,
            priceWithStripeFee,
            vatAmount,
            finalPrice
          }
        },
        payment_type: paymentType,
        privy_id: privyId,
        profile_id: profileId
      };

      console.log('Invoice insert data prepared:', JSON.stringify(invoiceInsertData, null, 2));
      
      const { data: insertedData, error: dbError } = await supabase
        .from('invoices')
        .insert(invoiceInsertData)
        .select()
        .single();

      if (dbError) {
        console.error('Error storing invoice in database:', dbError.message);
        console.error('Full error details:', JSON.stringify(dbError, null, 2));
        // Continue execution even if storing in the database fails, but log details
      } else {
        console.log('Successfully stored invoice in database with ID:', insertedData.id);
      }
    } catch (dbError) {
      console.error('Exception storing invoice in database:', dbError);
      console.error('Full error stack:', dbError.stack || 'No stack trace available');
      // Continue execution even if storing in the database fails
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
