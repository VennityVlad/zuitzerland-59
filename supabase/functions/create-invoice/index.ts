
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const requestFinanceApiKey = Deno.env.get('REQUEST_FINANCE_API_KEY');

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
    
    if (!requestFinanceApiKey) {
      console.error('REQUEST_FINANCE_API_KEY not found in environment');
      throw new Error('API key not configured');
    }

    const { invoiceData, paymentType, priceAfterDiscount } = await req.json();
    console.log('Received invoice data:', JSON.stringify(invoiceData, null, 2));
    console.log('Payment type:', paymentType);
    console.log('Price after discount:', priceAfterDiscount);

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
        unitPrice: `${Math.round(priceAfterDiscount)}00` // Convert to cents
      }]
    };

    console.log('Final invoice data:', JSON.stringify(finalInvoiceData, null, 2));

    // Step 1: Create off-chain invoice
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
      const errorData = await createInvoiceResponse.json();
      console.error('Request Finance API error details:', errorData);
      throw new Error(`Failed to create invoice: ${JSON.stringify(errorData)}`);
    }

    const offChainInvoice = await createInvoiceResponse.json();
    console.log('Off-chain invoice created:', offChainInvoice);

    // Step 2: Convert to on-chain request
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
      const errorData = await convertToOnChainResponse.json();
      console.error('Request Finance API error details for on-chain conversion:', errorData);
      throw new Error(`Failed to convert invoice to on-chain request: ${JSON.stringify(errorData)}`);
    }

    const onChainInvoice = await convertToOnChainResponse.json();
    console.log('On-chain invoice created:', onChainInvoice);
    
    return new Response(JSON.stringify({
      invoiceId: onChainInvoice.id,
      requestId: onChainInvoice.requestId,
      paymentLink: onChainInvoice.invoiceLinks.pay
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in create-invoice function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
